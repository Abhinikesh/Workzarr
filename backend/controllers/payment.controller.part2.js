'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const Provider = require('../models/Provider');
const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const AdminAudit = require('../models/AdminAudit');
const Subscription = require('../models/Subscription'); // Assumes a Subscription model exists or we track it in Provider

const { emitToProvider } = require('../socket/socket');
const { sendNotification } = require('../utils/notification');
const RAZORPAY_CONFIG = require('../config/razorpay.config');
const { createOrder, verifyPaymentSignature, createPayout } = require('../utils/razorpay');
const { startAgenda } = require('../jobs/providerRankJob'); // to trigger rank recalculation

// ─── 6. purchaseSubscription ──────────────────────────────────────────────────
const purchaseSubscription = asyncHandler(async (req, res) => {
  const { plan, duration, paymentMethod } = req.body;
  const providerId = req.provider._id;

  const pricing = RAZORPAY_CONFIG.SUBSCRIPTION_PRICING[plan];
  if (!pricing || !pricing[duration]) {
    throw ApiError.badRequest('Invalid subscription plan or duration.');
  }

  const price = pricing[duration].price;
  const provider = await Provider.findById(providerId);

  if (provider.subscriptionPlan === plan && provider.subscription && provider.subscription.isActive) {
    throw ApiError.conflict('You already have an active subscription for this plan.');
  }

  const order = await createOrder({
    amount: price * 100,
    currency: 'INR',
    receipt: `sub_${providerId}`,
    notes: {
      providerId: providerId.toString(),
      plan,
      duration,
      type: 'subscription'
    }
  });

  // Track the pending subscription in Payment or Subscription model
  // We'll use Payment model with a special gateway/status to track it
  await Payment.create({
    payer: req.user._id, // User who is the provider
    payee: req.user._id, // Self-payment technically, or platform
    amount: price,
    method: paymentMethod,
    gateway: 'razorpay',
    razorpayOrderId: order.id,
    status: 'initiated',
    metadata: { plan, duration, isSubscription: true }
  });

  logger.info('Subscription order created', { providerId, orderId: order.id });

  return ApiResponse.success(res, 201, 'Subscription order created.', {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID
  });
});

// ─── 7. verifySubscriptionPayment ─────────────────────────────────────────────
const verifySubscriptionPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const providerId = req.provider._id;

  const isValid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!isValid) throw ApiError.badRequest('Payment verification failed.');

  const payment = await Payment.findOne({ razorpayOrderId, 'metadata.isSubscription': true });
  if (!payment) throw ApiError.notFound('Subscription payment record not found.');

  if (payment.status === 'captured') {
    return ApiResponse.success(res, 200, 'Subscription already activated.');
  }

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'captured';
  await payment.save();

  const { plan, duration } = payment.metadata;
  const pricing = RAZORPAY_CONFIG.SUBSCRIPTION_PRICING[plan][duration];
  
  const now = new Date();
  const endDate = new Date(now.getTime() + pricing.days * 24 * 60 * 60 * 1000);

  const provider = await Provider.findById(providerId);
  provider.subscriptionPlan = plan;
  provider.subscription = {
    isActive: true,
    startDate: now,
    endDate: endDate
  };
  await provider.save();

  // Trigger Rank Update Job
  const { agenda } = require('../jobs/providerRankJob');
  if (agenda) {
    await agenda.now('update-provider-ranks');
  }

  await sendNotification({
    providerId,
    type: 'subscription_activated',
    title: 'Welcome to Premium!',
    body: `Your ${plan} subscription is now active until ${endDate.toDateString()}.`
  });

  logger.info('Subscription activated', { providerId, plan, duration });
  return ApiResponse.success(res, 200, 'Subscription activated successfully.', { provider });
});

// ─── 8. getEarningsSummary ────────────────────────────────────────────────────
const getEarningsSummary = asyncHandler(async (req, res) => {
  const providerId = req.provider._id;

  const now = new Date();
  const todayMidnight = new Date(now.setHours(0, 0, 0, 0));
  
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Today
  const todayAgg = await Payment.aggregate([
    { $match: { payee: providerId, status: 'captured', createdAt: { $gte: todayMidnight } } },
    { $group: { _id: null, earnings: { $sum: '$providerAmount' }, bookings: { $sum: 1 } } }
  ]);
  const today = todayAgg[0] || { earnings: 0, bookings: 0 };

  // This Week
  const weekAgg = await Payment.aggregate([
    { $match: { payee: providerId, status: 'captured', createdAt: { $gte: weekAgo } } },
    { $group: { _id: null, earnings: { $sum: '$providerAmount' }, bookings: { $sum: 1 } } }
  ]);
  const thisWeek = weekAgg[0] || { earnings: 0, bookings: 0 };

  // This Month
  const monthAgg = await Payment.aggregate([
    { $match: { payee: providerId, status: 'captured', createdAt: { $gte: monthAgo } } },
    { $group: { _id: null, earnings: { $sum: '$providerAmount' }, bookings: { $sum: 1 } } }
  ]);
  const thisMonth = monthAgg[0] || { earnings: 0, bookings: 0 };

  // Daily Breakdown (Last 30 Days)
  const dailyBreakdown = await Payment.aggregate([
    { $match: { payee: providerId, status: 'captured', createdAt: { $gte: monthAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        earnings: { $sum: '$providerAmount' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Payment Method Breakdown (All time)
  const methodAgg = await Payment.aggregate([
    { $match: { payee: providerId, status: 'captured' } },
    {
      $group: {
        _id: '$method',
        total: { $sum: '$providerAmount' }
      }
    }
  ]);
  const methods = { cash: 0, upi: 0, card: 0 };
  methodAgg.forEach(m => methods[m._id] = m.total);

  return ApiResponse.success(res, 200, 'Earnings summary fetched.', {
    summary: { today, thisWeek, thisMonth },
    dailyBreakdown,
    paymentMethods: methods
  });
});

// ─── 9. adminGetAllPayments ───────────────────────────────────────────────────
const adminGetAllPayments = asyncHandler(async (req, res) => {
  const { status, method, gateway, startDate, endDate, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (method) query.method = method;
  if (gateway) query.gateway = gateway;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('payer', 'name email')
      .populate('payee', 'businessName email')
      .populate('booking', 'bookingId status')
      .lean(),
    Payment.countDocuments(query)
  ]);

  // Aggregate summary
  const summaryAgg = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] } },
        totalCommission: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$commission', 0] } },
        totalRefunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } }
      }
    }
  ]);

  const methodBreakdown = await Payment.aggregate([
    { $match: query },
    { $group: { _id: '$method', count: { $sum: 1 } } }
  ]);
  const byMethod = { cash: 0, upi: 0, card: 0 };
  methodBreakdown.forEach(m => { if (m._id) byMethod[m._id] = m.count; });

  const statusBreakdown = await Payment.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const byStatus = {};
  statusBreakdown.forEach(s => { byStatus[s._id] = s.count; });

  const summary = summaryAgg[0] || { totalTransactions: 0, totalRevenue: 0, totalCommission: 0, totalRefunded: 0 };
  summary.byMethod = byMethod;
  summary.byStatus = byStatus;
  summary.successRate = summary.totalTransactions ? ((byStatus.captured || 0) / summary.totalTransactions) * 100 : 0;
  delete summary._id;

  const pagination = {
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalItems: total,
    limit: limitNum
  };

  return ApiResponse.success(res, 200, 'Admin payments fetched.', { summary, payments, pagination });
});

// ─── 10. adminProcessPayout ───────────────────────────────────────────────────
const adminProcessPayout = asyncHandler(async (req, res) => {
  const { payoutId } = req.params;

  const payout = await Payout.findById(payoutId).populate('provider');
  if (!payout) throw ApiError.notFound('Payout not found.');
  if (payout.status !== 'requested') throw ApiError.badRequest('Payout is not in requested state.');

  const provider = payout.provider;

  let fundAccountId = null;
  if (payout.method === 'bank_transfer' && provider.bankDetails) {
    fundAccountId = provider.bankDetails.fundAccountId;
  } else if (payout.method === 'upi' && provider.upiDetails) {
    fundAccountId = provider.upiDetails.fundAccountId;
  }

  if (!fundAccountId) {
    throw ApiError.badRequest('Provider missing fund account details for this payout method.');
  }

  const razorpayPayout = await createPayout({
    fundAccountId,
    amount: payout.amount * 100,
    purpose: 'payout',
    queue: true,
    notes: { payoutId: payout._id.toString(), providerId: provider._id.toString(), adminProcessed: 'true' }
  });

  payout.status = 'processing';
  payout.processedBy = req.user._id;
  payout.transactionRef = razorpayPayout.id;
  payout.processedAt = new Date();
  await payout.save();

  // Log Audit
  if (AdminAudit) {
    await AdminAudit.create({
      admin: req.user._id,
      action: 'process_payout',
      target: payout._id,
      targetModel: 'Payout',
      details: `Processed payout of ₹${payout.amount} for provider ${provider._id}`
    });
  }

  emitToProvider(provider._id, 'notification:new', {
    title: 'Payout Processing',
    body: `Your payout of ₹${payout.amount} is being processed.`
  });

  return ApiResponse.success(res, 200, 'Payout processing initiated via RazorpayX.', { payout });
});

// ─── 11. adminGetRevenueAnalytics ─────────────────────────────────────────────
const adminGetRevenueAnalytics = asyncHandler(async (req, res) => {
  // Overarching analytical aggregation for platform
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Overview (All Time)
  const overviewAgg = await Payment.aggregate([
    { $group: {
        _id: null,
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] } },
        totalCommission: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$commission', 0] } },
        totalRefunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } }
    }}
  ]);
  const overview = overviewAgg[0] || { totalRevenue: 0, totalCommission: 0, totalRefunded: 0 };
  overview.netRevenue = overview.totalCommission - overview.totalRefunded;
  delete overview._id;

  // 2. Growth (Current Month vs Last Month)
  const getMonthStats = async (start, end) => {
    const agg = await Payment.aggregate([
      { $match: { status: 'captured', createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, revenue: { $sum: '$amount' }, bookings: { $sum: 1 } } }
    ]);
    return agg[0] || { revenue: 0, bookings: 0 };
  };

  const [statsThisMonth, statsLastMonth] = await Promise.all([
    getMonthStats(thisMonth, now),
    getMonthStats(lastMonth, thisMonth)
  ]);

  const growth = {
    revenueGrowth: statsLastMonth.revenue ? ((statsThisMonth.revenue - statsLastMonth.revenue) / statsLastMonth.revenue) * 100 : 0,
    bookingGrowth: statsLastMonth.bookings ? ((statsThisMonth.bookings - statsLastMonth.bookings) / statsLastMonth.bookings) * 100 : 0
  };

  // 3. Top Providers
  const topProviders = await Payment.aggregate([
    { $match: { status: 'captured' } },
    { $group: { _id: '$payee', generatedRevenue: { $sum: '$amount' }, commissionPaid: { $sum: '$commission' } } },
    { $sort: { generatedRevenue: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'providers', localField: '_id', foreignField: '_id', as: 'providerInfo' } },
    { $unwind: '$providerInfo' },
    { $project: { _id: 1, generatedRevenue: 1, commissionPaid: 1, businessName: '$providerInfo.businessName' } }
  ]);

  return ApiResponse.success(res, 200, 'Revenue analytics generated.', {
    overview,
    growth,
    topProviders
  });
});

module.exports = {
  purchaseSubscription,
  verifySubscriptionPayment,
  getEarningsSummary,
  adminGetAllPayments,
  adminProcessPayout,
  adminGetRevenueAnalytics
};
