'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('./ApiError');
const logger = require('./logger');

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} catch (err) {
  logger.error('Failed to initialize Razorpay. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.', { error: err.message });
}

// ─── 1. createOrder ───────────────────────────────────────────────────────────
const createOrder = async ({ amount, currency = 'INR', receipt, notes }) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    
    const options = {
      amount: Math.round(amount), // amount in paise
      currency,
      receipt: receipt.toString(),
      notes
    };
    
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    logger.error('Razorpay createOrder error', { error: error.message, stack: error.stack });
    throw ApiError.internal('Failed to create payment order. Please try again.');
  }
};

// ─── 2. verifyPaymentSignature ────────────────────────────────────────────────
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;

  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

// ─── 3. capturePayment ────────────────────────────────────────────────────────
const capturePayment = async (paymentId, amount) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    return await razorpay.payments.capture(paymentId, Math.round(amount), 'INR');
  } catch (error) {
    logger.error('Razorpay capturePayment error', { paymentId, error: error.message });
    throw ApiError.internal('Failed to capture payment.');
  }
};

// ─── 4. initiateRefund ────────────────────────────────────────────────────────
const initiateRefund = async ({ paymentId, amount, notes, speed = 'normal' }) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    
    const options = {
      amount: Math.round(amount), // amount in paise
      speed,
      notes
    };
    
    return await razorpay.payments.refund(paymentId, options);
  } catch (error) {
    logger.error('Razorpay initiateRefund error', { paymentId, error: error.message });
    throw ApiError.internal('Failed to initiate refund.');
  }
};

// ─── 5. getPaymentDetails ─────────────────────────────────────────────────────
const getPaymentDetails = async (paymentId) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    logger.error('Razorpay getPaymentDetails error', { paymentId, error: error.message });
    throw ApiError.internal('Failed to fetch payment details.');
  }
};

// ─── 6. createPayout ──────────────────────────────────────────────────────────
const createPayout = async ({ fundAccountId, amount, purpose = 'payout', queue = true, notes }) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    
    const options = {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, // Merchant's RazorpayX account number
      fund_account_id: fundAccountId,
      amount: Math.round(amount), // amount in paise
      currency: 'INR',
      mode: 'NEFT', // Or IMPS/RTGS/UPI based on fund account
      purpose,
      queue_if_low_balance: queue,
      notes
    };
    
    // Note: razorpay.payouts requires RazorpayX setup in the actual library
    // This assumes the Razorpay module exposes payouts or you'd use a raw Axios call
    return await razorpay.payouts.create(options);
  } catch (error) {
    logger.error('Razorpay createPayout error', { fundAccountId, error: error.message });
    throw ApiError.internal('Failed to create payout.');
  }
};

// ─── 7. createContact ─────────────────────────────────────────────────────────
const createContact = async ({ name, email, phone, type = 'vendor' }) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    
    const options = {
      name,
      email,
      contact: phone,
      type
    };
    
    // Requires RazorpayX Contacts API
    return await razorpay.contacts.create(options);
  } catch (error) {
    logger.error('Razorpay createContact error', { error: error.message });
    throw ApiError.internal('Failed to create provider contact.');
  }
};

// ─── 8. createFundAccount ─────────────────────────────────────────────────────
const createFundAccount = async ({ contactId, accountType = 'bank_account', bankAccount, vpa }) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    
    const options = {
      contact_id: contactId,
      account_type: accountType
    };

    if (accountType === 'bank_account' && bankAccount) {
      options.bank_account = {
        name: bankAccount.name,
        ifsc: bankAccount.ifsc,
        account_number: bankAccount.account_number
      };
    } else if (accountType === 'vpa' && vpa) {
      options.vpa = { address: vpa };
    }
    
    // Requires RazorpayX Fund Accounts API
    return await razorpay.fundAccount.create(options);
  } catch (error) {
    logger.error('Razorpay createFundAccount error', { contactId, error: error.message });
    throw ApiError.internal('Failed to create fund account.');
  }
};

// ─── 9. validateVPA ───────────────────────────────────────────────────────────
const validateVPA = async (vpa) => {
  try {
    if (!razorpay) throw ApiError.internal('Payment gateway not initialized.');
    
    // The Razorpay VPA validation API
    const response = await razorpay.virtualAccounts.validateVpa({ vpa });
    
    return {
      success: response.success,
      customerName: response.customer_name
    };
  } catch (error) {
    logger.error('Razorpay validateVPA error', { vpa, error: error.message });
    // Don't throw 500, just return validation failure
    return { success: false, customerName: null };
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
  capturePayment,
  initiateRefund,
  getPaymentDetails,
  createPayout,
  createContact,
  createFundAccount,
  validateVPA
};
