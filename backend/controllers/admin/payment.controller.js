'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const Payment = require('../../models/Payment');

// GET /admin/payments/summary
exports.getSummary = asyncHandler(async (req, res) => {
  const result = await Payment.aggregate([
    {
      $group: {
        _id: null,
        captured:   { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] } },
        commission: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$commission', 0] } }
      }
    }
  ]);

  const raw = result[0] || {};
  const summary = {
    captured:       raw.captured       || 0,
    commission:     raw.commission     || 0,
    netRevenue:     raw.commission     || 0,
    pendingPayouts: 0
  };

  return ApiResponse.success(res, 200, 'Payment summary fetched', summary);
});

// GET /admin/payments/transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const { status, method, search, page = 1, limit = 25 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (method) query.method = method;
  if (search) {
    query.$or = [{ transactionId: new RegExp(search, 'i') }];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [items, total] = await Promise.all([
    Payment.find(query)
      .populate('customer', 'name phone avatar')
      .populate('provider', 'businessName')
      .populate('booking', 'bookingId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Payment.countDocuments(query)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)) || 1,
    totalItems: total,
    limit: parseInt(limit)
  };

  return res.status(200).json({
    success: true,
    message: 'Transactions fetched',
    data: { items, pagination }
  });
});

// GET /admin/payments/payouts
exports.getPayouts = asyncHandler(async (req, res) => {
  // Payouts are settlements to providers — derive from completed bookings' commissions
  const { status, page = 1, limit = 25 } = req.query;

  const query = { paymentType: 'payout' };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [items, total] = await Promise.all([
    Payment.find(query)
      .populate('provider', 'businessName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Payment.countDocuments(query)
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)) || 1,
    totalItems: total,
    limit: parseInt(limit)
  };

  return res.status(200).json({
    success: true,
    message: 'Payouts fetched',
    data: { items, pagination }
  });
});
