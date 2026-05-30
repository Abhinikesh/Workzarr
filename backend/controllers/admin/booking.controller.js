'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');

// GET /admin/bookings
exports.getAllBookings = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 25 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [{ bookingId: new RegExp(search, 'i') }];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [bookings, total, totalAll, completed, active, revAgg] = await Promise.all([
    Booking.find(query)
      .populate('customer', 'name phone avatar email')
      .populate('provider', 'businessName phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Booking.countDocuments(query),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: { $in: ['accepted', 'arriving', 'in_progress'] } }),
    Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ])
  ]);

  const completionRate = totalAll > 0 ? Math.round((completed / totalAll) * 100) : 0;

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)) || 1,
    totalItems: total,
    limit: parseInt(limit)
  };

  const stats = {
    total: totalAll,
    active,
    completionRate,
    revenue: revAgg[0]?.total || 0
  };

  return res.status(200).json({
    success: true,
    message: 'Bookings fetched successfully',
    data: { bookings, stats, pagination }
  });
});

// GET /admin/bookings/:bookingId
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('customer', 'name phone email avatar')
    .populate('provider', 'businessName phone profileImage')
    .lean();

  if (!booking) throw new ApiError(404, 'Booking not found');

  return ApiResponse.success(res, 200, 'Booking fetched', booking);
});

// PATCH /admin/bookings/:bookingId/status
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const allowed = ['pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled', 'no_show'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status');

  const booking = await Booking.findByIdAndUpdate(
    req.params.bookingId,
    { status, ...(reason && { cancellationReason: reason }) },
    { new: true }
  );
  if (!booking) throw new ApiError(404, 'Booking not found');

  return ApiResponse.success(res, 200, 'Booking status updated', booking);
});
