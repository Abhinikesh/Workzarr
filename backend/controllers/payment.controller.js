'use strict';

const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Payout = require('../models/Payout');

const { emitToProvider, emitToUser } = require('../socket/socket');
const { sendNotification } = require('../utils/notification');
const { creditWallet, lockPayoutAmount, debitWallet } = require('../utils/wallet');
const RAZORPAY_CONFIG = require('../config/razorpay.config');
const {
  createOrder,
  verifyPaymentSignature,
  capturePayment,
  validateVPA,
  createContact,
  createFundAccount
} = require('../utils/razorpay');

const payoutQueue = require('../jobs/payoutQueue');
const part2 = require('./payment.controller.part2');

// ─── 1. createPaymentOrder ────────────────────────────────────────────────────
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethod } = req.body;
  const customerId = req.user._id;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (booking.customer.toString() !== customerId.toString()) {
    throw ApiError.forbidden('This booking does not belong to you.');
  }
  if (!['pending', 'accepted'].includes(booking.status)) {
    throw ApiError.badRequest('Booking is not in a valid state for payment initiation.');
  }
  if (booking.paymentStatus !== 'pending') {
    throw ApiError.badRequest('Payment has already been initiated or completed.');
  }
  if (paymentMethod === 'cash') {
    throw ApiError.badRequest('Online payment order cannot be created for cash method.');
  }

  // Check for existing active payment attempt
  const existingPayment = await Payment.findOne({ booking: bookingId, status: 'initiated' });
  if (existingPayment) {
    return ApiResponse.success(res, 200, 'Existing payment order retrieved.', {
      orderId: existingPayment.razorpayOrderId,
      amount: existingPayment.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingId,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone
    });
  }

  const amountPaise = booking.price * 100;

  const order = await createOrder({
    amount: amountPaise,
    currency: 'INR',
    receipt: booking.bookingId,
    notes: {
      bookingId: booking._id.toString(),
      customerId: req.user._id.toString(),
      providerId: booking.provider.toString(),
      type: 'booking_payment'
    }
  });

  await Payment.create({
    booking: bookingId,
    payer: customerId,
    payee: booking.provider,
    amount: booking.price,
    commission: booking.commission,
    providerAmount: booking.providerEarning,
    method: paymentMethod,
    gateway: 'razorpay',
    razorpayOrderId: order.id,
    status: 'initiated'
  });

  logger.info('Razorpay payment order created', { bookingId, orderId: order.id });

  return ApiResponse.success(res, 201, 'Payment order created.', {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    bookingId,
    customerName: req.user.name,
    customerEmail: req.user.email,
    customerPhone: req.user.phone
  });
});

// ─── 2. verifyAndCapturePayment ───────────────────────────────────────────────
const verifyAndCapturePayment = asyncHandler(async (req, res) => {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const customerId = req.user._id;

  const isValid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!isValid) {
    logger.warn('Payment verification failed (Invalid Signature)', { customerId, razorpayOrderId, ip: req.ip });
    throw ApiError.badRequest('Payment verification failed.');
  }

  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) throw ApiError.notFound('Payment record not found.');

  // Idempotency check
  if (payment.status === 'captured') {
    return ApiResponse.success(res, 200, 'Payment was already captured.', { bookingId: payment.booking, amount: payment.amount });
  }

  const booking = await Booking.findById(payment.booking);
  
  // Note: We bypass the explicit Razorpay API fetch here because signature verification 
  // mathematically guarantees authenticity. But a strict setup could call `getPaymentDetails`.

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'captured';
  await payment.save();

  if (booking) {
    booking.paymentStatus = 'paid';
    booking.razorpayPaymentId = razorpayPaymentId;
    await booking.save();
  }

  // Add to Provider wallet
  await creditWallet(payment.payee, payment.providerAmount, payment.booking);

  emitToProvider(payment.payee, 'payment:received', {
    bookingId: payment.booking,
    amount: payment.amount,
    providerAmount: payment.providerAmount,
    customerName: req.user.name
  });

  await sendNotification({
    providerId: payment.payee,
    type: 'payment_received',
    title: 'Payment Received!',
    body: `₹${payment.providerAmount} received for booking ${booking.bookingId}.`,
    data: { bookingId: payment.booking }
  });

  logger.info('Payment captured successfully', { bookingId: payment.booking, paymentId: payment._id });

  return ApiResponse.success(res, 200, 'Payment successful.', { bookingId: payment.booking, amount: payment.amount });
});

// ─── 3. handleWebhook ─────────────────────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody; // Populated by rawBodyMiddleware

  if (!signature || !rawBody) {
    return res.status(400).send('Missing signature or body');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    logger.warn('Invalid webhook signature detected', { ip: req.ip });
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      case 'payment.captured': {
        const paymentData = event.payload.payment.entity;
        const payment = await Payment.findOne({ razorpayOrderId: paymentData.order_id });
        
        if (payment && payment.status !== 'captured') {
          payment.razorpayPaymentId = paymentData.id;
          payment.status = 'captured';
          await payment.save();

          const booking = await Booking.findById(payment.booking);
          if (booking) {
            booking.paymentStatus = 'paid';
            booking.razorpayPaymentId = paymentData.id;
            await booking.save();
          }

          await creditWallet(payment.payee, payment.providerAmount, payment.booking);
          logger.info('Webhook: Payment captured', { paymentId: payment._id });
        }
        break;
      }
      
      case 'payment.failed': {
        const paymentData = event.payload.payment.entity;
        const payment = await Payment.findOne({ razorpayOrderId: paymentData.order_id });
        
        if (payment && payment.status !== 'failed') {
          payment.status = 'failed';
          await payment.save();
          
          emitToUser(payment.payer, 'notification:new', {
            title: 'Payment Failed',
            body: 'Your recent payment attempt failed. Please retry.'
          });
          logger.info('Webhook: Payment failed', { paymentId: payment._id });
        }
        break;
      }

      case 'refund.processed': {
        const refundData = event.payload.refund.entity;
        const payment = await Payment.findOne({ razorpayPaymentId: refundData.payment_id });
        
        if (payment) {
          payment.status = 'refunded';
          await payment.save();
          
          await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'refunded' });
          logger.info('Webhook: Refund processed', { paymentId: payment._id });
        }
        break;
      }

      case 'payout.processed': {
        const payoutData = event.payload.payout.entity;
        const payout = await Payout.findOne({ transactionRef: payoutData.id });
        
        if (payout && payout.status !== 'completed') {
          payout.status = 'completed';
          payout.processedAt = new Date();
          await payout.save();

          emitToProvider(payout.provider, 'notification:new', {
            title: 'Payout Successful',
            body: `Your payout of ₹${payout.amount} has been processed to your account.`
          });
          logger.info('Webhook: Payout processed', { payoutId: payout._id });
        }
        break;
      }

      case 'payout.failed': {
        const payoutData = event.payload.payout.entity;
        const payout = await Payout.findOne({ transactionRef: payoutData.id });
        
        if (payout && payout.status !== 'failed') {
          payout.status = 'failed';
          payout.failureReason = payoutData.failure_reason;
          await payout.save();

          // Reverse wallet debit since it failed
          await creditWallet(payout.provider, payout.amount, 'refund_payout_fail');

          emitToProvider(payout.provider, 'notification:new', {
            title: 'Payout Failed',
            body: `Your payout of ₹${payout.amount} failed and has been returned to your balance.`
          });
          logger.info('Webhook: Payout failed', { payoutId: payout._id });
        }
        break;
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, event: event.event });
  }

  // Always return 200 to Razorpay
  res.status(200).send('OK');
});

// ─── 4. requestPayout ─────────────────────────────────────────────────────────
const requestPayout = asyncHandler(async (req, res) => {
  const { amount, method, upiId, bankDetails } = req.body;
  const providerId = req.provider._id;

  const { getWalletBalance } = require('../utils/wallet');
  const wallet = await getWalletBalance(providerId);

  if (amount > wallet.availableBalance) {
    throw ApiError.badRequest(`Insufficient balance. Available: ₹${wallet.availableBalance}`);
  }

  const existingPending = await Payout.findOne({ provider: providerId, status: { $in: ['requested', 'processing'] } });
  if (existingPending) {
    throw ApiError.conflict('You already have a pending payout request.');
  }

  const provider = await Provider.findById(providerId);

  // Validate & create Razorpay Contact/Fund accounts if missing
  if (!provider.razorpayContactId) {
    const contact = await createContact({
      name: provider.businessName,
      email: req.user.email,
      phone: provider.phone,
      type: 'vendor'
    });
    provider.razorpayContactId = contact.id;
  }

  if (method === 'upi') {
    const validation = await validateVPA(upiId);
    if (!validation.success) throw ApiError.badRequest('Invalid UPI ID.');

    if (!provider.upiDetails || provider.upiDetails.upiId !== upiId || !provider.upiDetails.fundAccountId) {
      const fundAcc = await createFundAccount({
        contactId: provider.razorpayContactId,
        accountType: 'vpa',
        vpa: upiId
      });
      provider.upiDetails = { upiId, fundAccountId: fundAcc.id };
    }
  } else if (method === 'bank_transfer') {
    if (!provider.bankDetails || provider.bankDetails.accountNumber !== bankDetails.accountNumber || !provider.bankDetails.fundAccountId) {
      const fundAcc = await createFundAccount({
        contactId: provider.razorpayContactId,
        accountType: 'bank_account',
        bankAccount: {
          name: bankDetails.accountHolderName,
          ifsc: bankDetails.ifsc,
          account_number: bankDetails.accountNumber
        }
      });
      provider.bankDetails = { ...bankDetails, fundAccountId: fundAcc.id };
    }
  }

  await provider.save();

  // Lock amount
  await lockPayoutAmount(providerId, amount);

  const payout = await Payout.create({
    provider: providerId,
    amount,
    method,
    upiId: method === 'upi' ? upiId : undefined,
    bankDetails: method === 'bank_transfer' ? bankDetails : undefined,
    status: 'requested',
    requestedAt: new Date()
  });

  // Debit Wallet locally
  await debitWallet(providerId, amount, payout._id);

  // Queue background processing
  await payoutQueue.add({ payoutId: payout._id }, { delay: 5000 }); // Process shortly, or via batch

  await sendNotification({
    providerId,
    type: 'payout_requested',
    title: 'Payout Requested',
    body: `Your payout request for ₹${amount} has been received and will be processed within 24 hours.`
  });

  return ApiResponse.success(res, 200, 'Payout requested successfully.', { payout });
});

// ─── 5. getPayoutHistory ──────────────────────────────────────────────────────
const getPayoutHistory = asyncHandler(async (req, res) => {
  const providerId = req.provider._id;
  const { page = 1, limit = 10 } = req.query;

  const { getWalletBalance } = require('../utils/wallet');
  const balance = await getWalletBalance(providerId);

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [payouts, total] = await Promise.all([
    Payout.find({ provider: providerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Payout.countDocuments({ provider: providerId })
  ]);

  const pagination = {
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalItems: total,
    limit: limitNum
  };

  return ApiResponse.success(res, 200, 'Payout history fetched.', { balance, payouts, pagination });
});

module.exports = {
  createPaymentOrder,
  verifyAndCapturePayment,
  handleWebhook,
  requestPayout,
  getPayoutHistory,
  ...part2
};
