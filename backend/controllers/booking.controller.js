'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const User = require('../models/User');

const { emitToProvider, emitToUser, emitToRoom } = require('../socket/socket');
const { sendNotification, NOTIFICATION_TEMPLATES } = require('../utils/notification');
const {
  generateBookingId,
  checkProviderAvailability,
  calculateRefundAmount,
  validateStatusTransition,
  scheduleBookingJobs,
  cancelBookingJobs
} = require('../utils/bookingHelpers');

// Import part 2 functions at the end
const part2 = require('./booking.controller.part2');

// ─── 1. createBooking ─────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const { providerId, serviceId, categoryId, scheduledAt, address, paymentMethod, notes } = req.body;
  const customerId = req.user._id;

  // 1. Fetch provider & validate
  const provider = await Provider.findById(providerId);
  if (!provider || !provider.isActive || !provider.isVerified) {
    throw ApiError.badRequest('Provider is not available or inactive.');
  }

  // 2. Fetch service & validate
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive || service.provider.toString() !== providerId) {
    throw ApiError.badRequest('Service is invalid or inactive.');
  }

  // 3. Check availability & overlaps
  const availability = await checkProviderAvailability(providerId, scheduledAt);
  if (!availability.isAvailable) {
    throw ApiError.conflict(`Slot unavailable: ${availability.reason}`);
  }

  // 4. Calculate pricing
  const price = service.price;
  const commission = price * 0.10; // 10% platform fee
  const providerEarning = price - commission;

  // 5. Generate OTP (4 digits)
  const plainOtp = crypto.randomInt(1000, 10000).toString();
  const hashedOtp = await bcrypt.hash(plainOtp, 10);

  // 6. Create booking
  const booking = await Booking.create({
    customer: customerId,
    provider: providerId,
    service: serviceId,
    category: categoryId,
    scheduledAt,
    address,
    paymentMethod,
    price,
    notes,
    otp: hashedOtp
  });

  // 7. Schedule reminders and checks
  await scheduleBookingJobs(booking);

  // 8. Notifications & Sockets
  emitToProvider(providerId, 'booking:new_request', {
    bookingId: booking._id,
    displayId: booking.bookingId,
    customerName: req.user.name,
    service: service.title,
    address,
    scheduledAt,
    price,
    paymentMethod
  });

  await sendNotification({
    providerId,
    type: 'booking_request',
    ...NOTIFICATION_TEMPLATES.BOOKING_REQUESTED.provider,
    body: NOTIFICATION_TEMPLATES.BOOKING_REQUESTED.provider.body.replace('{customerName}', req.user.name).replace('{service}', service.title),
    data: { bookingId: booking._id }
  });

  await sendNotification({
    userId: customerId,
    type: 'booking_request',
    ...NOTIFICATION_TEMPLATES.BOOKING_REQUESTED.customer,
    body: NOTIFICATION_TEMPLATES.BOOKING_REQUESTED.customer.body.replace('{service}', service.title),
    data: { bookingId: booking._id }
  });

  // Handle payments (Mock Razorpay for UPI/Card)
  let paymentPayload = null;
  if (paymentMethod === 'upi' || paymentMethod === 'card') {
    // paymentPayload = await createRazorpayOrder(price) 
    // Stubbed for this scope
    paymentPayload = { orderId: `order_${crypto.randomBytes(6).toString('hex')}`, amount: price * 100 };
  }

  logger.info('Booking created', { bookingId: booking._id, customBookingId });

  return ApiResponse.success(res, 201, 'Booking created successfully.', {
    booking: { ...booking.toObject(), otp: plainOtp }, // Return plain OTP to customer once so they have it
    payment: paymentPayload
  });
});

// ─── 2. getMyBookings ─────────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page, limit, sortBy, startDate, endDate } = req.query;

  const query = {};
  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.provider) {
    query.provider = req.provider._id;
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (startDate || endDate) {
    query.scheduledAt = {};
    if (startDate) query.scheduledAt.$gte = new Date(startDate);
    if (endDate) query.scheduledAt.$lte = new Date(endDate);
  }

  const sortStage = (() => {
    switch (sortBy) {
      case 'oldest': return { createdAt: 1 };
      case 'scheduled': return { scheduledAt: 1 };
      default: return { createdAt: -1 };
    }
  })();

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .sort(sortStage)
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name avatar phone')
      .populate('provider', 'businessName profileImage phone rating')
      .populate('service', 'title price')
      .populate('category', 'name icon')
      .lean(),
    Booking.countDocuments(query)
  ]);

  const pagination = {
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalItems: total,
    limit: limitNum
  };

  return ApiResponse.paginated(res, 'Bookings fetched.', bookings, pagination);
});

// ─── 3. getBookingById ────────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate('customer', 'name avatar phone location')
    .populate('provider', 'businessName profileImage phone rating location')
    .populate('service', 'title price description duration')
    .populate('category', 'name icon')
    .lean();

  if (!booking) throw ApiError.notFound('Booking not found.');

  // Check permissions
  const isCustomer = req.user.role === 'customer' && booking.customer._id.toString() === req.user._id.toString();
  const isProvider = req.provider && booking.provider._id.toString() === req.provider._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isProvider && !isAdmin) {
    throw ApiError.forbidden('You do not have access to this booking.');
  }

  // Fetch chat history
  const chatKey = `chat:${bookingId}`;
  const chatRaw = await redisClient.lRange(chatKey, 0, 49);
  const chatHistory = chatRaw.map(msg => JSON.parse(msg));

  // Fetch provider live location if active
  let liveLocation = null;
  if (['accepted', 'arriving', 'in_progress'].includes(booking.status)) {
    const locRaw = await redisClient.get(`provider_location:${booking.provider._id}`);
    if (locRaw) liveLocation = JSON.parse(locRaw);
  }

  return ApiResponse.success(res, 200, 'Booking fetched.', {
    booking,
    chatHistory,
    providerLocation: liveLocation
  });
});

// ─── 4. updateBookingStatus ───────────────────────────────────────────────────
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, cancellationReason, otp } = req.body;
  const role = req.user.role;

  const booking = await Booking.findById(bookingId).populate('customer', 'name fcmToken phone').populate('provider', 'businessName phone');
  if (!booking) throw ApiError.notFound('Booking not found.');

  // Permissions & State Validation
  const isCustomer = role === 'customer' && booking.customer._id.toString() === req.user._id.toString();
  const isProvider = role === 'provider' && req.provider && booking.provider._id.toString() === req.provider._id.toString();
  
  if (!isCustomer && !isProvider) {
    throw ApiError.forbidden('You cannot update this booking.');
  }

  const actingRole = isCustomer ? 'customer' : 'provider';
  const validation = validateStatusTransition(booking.status, status, actingRole);

  if (!validation.isValid) {
    throw ApiError.badRequest(validation.reason);
  }

  const now = new Date();

  // ─── STATE MACHINE HANDLERS ───
  if (status === 'accepted') {
    booking.acceptedAt = now;
    booking.status = 'accepted';
    
    emitToUser(booking.customer._id, 'booking:accepted', {
      bookingId: booking._id,
      providerName: booking.provider.businessName,
      providerPhone: booking.provider.phone
    });
    
    await sendNotification({
      userId: booking.customer._id,
      type: 'booking_accepted',
      ...NOTIFICATION_TEMPLATES.BOOKING_ACCEPTED.customer,
      body: NOTIFICATION_TEMPLATES.BOOKING_ACCEPTED.customer.body.replace('{providerName}', booking.provider.businessName)
    });
  }

  else if (status === 'arriving') {
    booking.arrivedAt = now;
    booking.status = 'arriving';
    
    emitToUser(booking.customer._id, 'booking:provider_arriving', {
      bookingId: booking._id,
      providerName: booking.provider.businessName
    });

    await sendNotification({
      userId: booking.customer._id,
      type: 'provider_arriving',
      ...NOTIFICATION_TEMPLATES.PROVIDER_ARRIVING.customer,
      body: NOTIFICATION_TEMPLATES.PROVIDER_ARRIVING.customer.body.replace('{providerName}', booking.provider.businessName)
    });
  }

  else if (status === 'in_progress') {
    if (!otp) throw ApiError.badRequest('OTP is required to start the job.');
    const isValidOtp = await bcrypt.compare(otp, booking.otp);
    if (!isValidOtp) throw ApiError.badRequest('Invalid OTP.');

    booking.otpVerified = true;
    booking.startedAt = now;
    booking.status = 'in_progress';

    emitToUser(booking.customer._id, 'booking:job_started', {
      bookingId: booking._id,
      startedAt: now
    });

    await sendNotification({
      userId: booking.customer._id,
      type: 'job_started',
      ...NOTIFICATION_TEMPLATES.JOB_STARTED.customer,
      body: NOTIFICATION_TEMPLATES.JOB_STARTED.customer.body.replace('{providerName}', booking.provider.businessName)
    });
  }

  else if (status === 'completed') {
    if (!booking.otpVerified) throw ApiError.badRequest('Cannot complete job without OTP verification.');
    
    booking.completedAt = now;
    booking.status = 'completed';

    // Update Provider stats
    await Provider.findByIdAndUpdate(booking.provider._id, {
      $inc: { 'stats.completedJobs': 1, 'stats.totalEarnings': booking.providerEarning }
    });

    if (booking.paymentMethod === 'cash') {
      booking.paymentStatus = 'paid';
      // Create Payment record would happen here
    }

    emitToUser(booking.customer._id, 'booking:completed', {
      bookingId: booking._id,
      completedAt: now,
      amount: booking.price
    });

    await sendNotification({
      userId: booking.customer._id,
      type: 'job_completed',
      ...NOTIFICATION_TEMPLATES.JOB_COMPLETED.customer,
      body: NOTIFICATION_TEMPLATES.JOB_COMPLETED.customer.body.replace('{providerName}', booking.provider.businessName)
    });

    // Schedule review reminder
    const { agenda } = require('../jobs/bookingJobs');
    if (agenda) {
      await agenda.schedule(new Date(Date.now() + 30 * 60 * 1000), 'send-review-reminder', {
        bookingId: booking._id,
        customerId: booking.customer._id,
        providerName: booking.provider.businessName
      });
    }
  }

  else if (status === 'cancelled') {
    booking.cancelledAt = now;
    booking.status = 'cancelled';
    booking.cancelledBy = actingRole;
    booking.cancellationReason = cancellationReason;

    const { refundAmount } = calculateRefundAmount(booking, actingRole);
    // Refund process trigger would happen here via Payment Gateway

    if (actingRole === 'customer') {
      // Notify Provider
      emitToProvider(booking.provider._id, 'booking:cancelled', { bookingId: booking._id, reason: cancellationReason });
      await sendNotification({
        providerId: booking.provider._id,
        type: 'booking_cancelled',
        ...NOTIFICATION_TEMPLATES.BOOKING_CANCELLED.provider,
        body: NOTIFICATION_TEMPLATES.BOOKING_CANCELLED.provider.body.replace('{customerName}', booking.customer.name)
      });
    } else {
      // Notify Customer
      await Provider.findByIdAndUpdate(booking.provider._id, { $inc: { 'stats.cancelledJobs': 1 } });
      emitToUser(booking.customer._id, 'booking:cancelled', { bookingId: booking._id, reason: cancellationReason, refundAmount });
      await sendNotification({
        userId: booking.customer._id,
        type: 'booking_cancelled',
        ...NOTIFICATION_TEMPLATES.BOOKING_CANCELLED.customer
      });
    }

    await cancelBookingJobs(booking._id);
  }

  await booking.save();
  logger.info('Booking status updated', { bookingId: booking._id, status, actingRole });

  return ApiResponse.success(res, 200, `Booking status updated to ${status}.`, { booking });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  ...part2
};
