'use strict';

const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');

const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { emitToProvider, emitToUser } = require('../socket/socket');
const { sendNotification } = require('../utils/notification');
const { checkProviderAvailability, scheduleBookingJobs, cancelBookingJobs } = require('../utils/bookingHelpers');

// ─── 5. getBookingChatHistory ─────────────────────────────────────────────────
const getBookingChatHistory = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId).select('customer provider');
  if (!booking) throw ApiError.notFound('Booking not found.');

  const isCustomer = req.user.role === 'customer' && booking.customer.toString() === req.user._id.toString();
  const isProvider = req.provider && booking.provider.toString() === req.provider._id.toString();

  if (!isCustomer && !isProvider) {
    throw ApiError.forbidden('You do not have access to this chat.');
  }

  const chatKey = `chat:${bookingId}`;
  const rawMessages = await redisClient.lRange(chatKey, 0, -1);
  const messages = rawMessages.map(msg => JSON.parse(msg));

  // Sort by timestamp if not already implicitly sorted by LRANGE (which preserves insertion order)
  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return ApiResponse.success(res, 200, 'Chat history fetched.', { messages });
});

// ─── 6. getActiveBooking ──────────────────────────────────────────────────────
const getActiveBooking = asyncHandler(async (req, res) => {
  const query = { status: { $in: ['accepted', 'arriving', 'in_progress'] } };

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.provider) {
    query.provider = req.provider._id;
  } else {
    throw ApiError.forbidden('Invalid role for active booking fetch.');
  }

  const booking = await Booking.findOne(query)
    .populate('customer', 'name avatar phone location')
    .populate('provider', 'businessName profileImage phone location')
    .populate('service', 'title price duration')
    .lean();

  if (!booking) {
    return ApiResponse.success(res, 200, 'No active booking.', { booking: null });
  }

  // Get provider live location if active
  let liveLocation = null;
  const locRaw = await redisClient.get(`provider_location:${booking.provider._id}`);
  if (locRaw) liveLocation = JSON.parse(locRaw);

  return ApiResponse.success(res, 200, 'Active booking fetched.', { booking, providerLocation: liveLocation });
});

// ─── 7. rescheduleBooking ─────────────────────────────────────────────────────
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { scheduledAt } = req.body;

  const booking = await Booking.findById(bookingId).populate('customer', 'name').populate('provider', 'businessName');
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (booking.customer._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only reschedule your own bookings.');
  }

  if (!['pending', 'accepted'].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot reschedule a booking in '${booking.status}' state.`);
  }

  const availability = await checkProviderAvailability(booking.provider._id, scheduledAt);
  if (!availability.isAvailable) {
    throw ApiError.conflict(`Slot unavailable: ${availability.reason}`);
  }

  booking.scheduledAt = scheduledAt;
  await booking.save();

  await cancelBookingJobs(booking._id);
  await scheduleBookingJobs(booking);

  emitToProvider(booking.provider._id, 'booking:rescheduled', {
    bookingId: booking._id,
    newScheduledAt: scheduledAt
  });

  await sendNotification({
    providerId: booking.provider._id,
    type: 'booking_rescheduled',
    title: 'Booking Rescheduled',
    body: `${booking.customer.name} has rescheduled their booking to a new time.`,
    data: { bookingId: booking._id }
  });

  logger.info('Booking rescheduled', { bookingId: booking._id, scheduledAt });
  return ApiResponse.success(res, 200, 'Booking rescheduled successfully.', { booking });
});

// ─── 8. getBookingOTP ─────────────────────────────────────────────────────────
const getBookingOTP = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId).select('customer status otp');
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (booking.customer.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the customer can view the OTP.');
  }

  if (!['accepted', 'arriving'].includes(booking.status)) {
    throw ApiError.badRequest('OTP is only available when booking is accepted or provider is arriving.');
  }

  // Generate a temporary raw OTP if lost (since DB only has hash), but standard flow:
  // Usually, OTP is sent via SMS/Email initially. If they fetch it here, we'd either need
  // to store it symmetrically encrypted or generate a fresh one. We will generate a fresh one 
  // and update the hash to ensure they always get a valid one if they hit this endpoint.
  
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  
  const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
  booking.otp = await bcrypt.hash(plainOtp, 10);
  await booking.save();

  return ApiResponse.success(res, 200, 'OTP fetched successfully.', {
    bookingId: booking._id,
    otp: plainOtp,
    message: 'Share this OTP with the provider to start the job.'
  });
});

// ─── 9. adminGetAllBookings ───────────────────────────────────────────────────
const adminGetAllBookings = asyncHandler(async (req, res) => {
  const { status, customerId, providerId, categoryId, startDate, endDate, paymentStatus, paymentMethod, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (customerId) query.customer = customerId;
  if (providerId) query.provider = providerId;
  if (categoryId) query.category = categoryId;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    query.scheduledAt = {};
    if (startDate) query.scheduledAt.$gte = new Date(startDate);
    if (endDate) query.scheduledAt.$lte = new Date(endDate);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name email phone')
      .populate('provider', 'businessName phone')
      .populate('service', 'title price')
      .populate('category', 'name')
      .lean(),
    Booking.countDocuments(query)
  ]);

  // Aggregate stats (could be optimized or run separately if dataset grows)
  const statsAggr = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $in: ['$status', ['accepted', 'arriving', 'in_progress']] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$price', 0] } },
        totalCommission: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$commission', 0] } }
      }
    }
  ]);

  const stats = statsAggr[0] || { totalBookings: 0, pending: 0, active: 0, completed: 0, cancelled: 0, totalRevenue: 0, totalCommission: 0 };
  delete stats._id;

  const pagination = {
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalItems: total,
    limit: limitNum
  };

  return ApiResponse.success(res, 200, 'Admin bookings fetched.', { stats, bookings, pagination });
});

// ─── 10. adminUpdateBooking ───────────────────────────────────────────────────
const adminUpdateBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, noShowReason, manualRefundAmount } = req.body;

  const booking = await Booking.findById(bookingId).populate('customer').populate('provider');
  if (!booking) throw ApiError.notFound('Booking not found.');

  booking.status = status;
  if (status === 'no_show') {
    booking.cancellationReason = noShowReason || 'Admin marked as no_show';
    await Provider.findByIdAndUpdate(booking.provider._id, { $inc: { 'stats.cancelledJobs': 1 } });
    
    emitToUser(booking.customer._id, 'booking:cancelled', { bookingId: booking._id, reason: booking.cancellationReason });
    emitToProvider(booking.provider._id, 'booking:cancelled', { bookingId: booking._id, reason: booking.cancellationReason });
  }

  // Handle manual refund overrides if provided and status is cancelled
  if (status === 'cancelled' && manualRefundAmount !== undefined) {
    booking.cancellationReason = 'Admin cancelled with manual refund';
    // Integrate payment refund logic here using manualRefundAmount
  }

  await booking.save();

  // Audit log would be recorded here
  logger.info('Admin forced booking update', { bookingId: booking._id, status, adminId: req.user._id });

  return ApiResponse.success(res, 200, 'Booking updated by admin.', { booking });
});

module.exports = {
  getBookingChatHistory,
  getActiveBooking,
  rescheduleBooking,
  getBookingOTP,
  adminGetAllBookings,
  adminUpdateBooking
};
