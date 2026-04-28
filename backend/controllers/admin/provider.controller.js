const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Provider = require('../../models/Provider');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Review = require('../../models/Review');
const AdminAudit = require('../../models/AdminAudit');
const { logAdminAction } = require('../../utils/adminHelpers');
const { sendNotification } = require('../../utils/notification');
const redisClient = require('../../config/redis');

exports.getAllProviders = asyncHandler(async (req, res) => {
  const { isVerified, isActive, isBlocked, categoryId, town, district, search, sortBy, page = 1, limit = 20 } = req.query;
  const query = {};

  if (isVerified) query.isVerified = isVerified === 'true';
  if (isActive) query.isActive = isActive === 'true';
  if (categoryId) query.category = categoryId;
  if (town) query['address.town'] = new RegExp(town, 'i');
  if (district) query['address.district'] = new RegExp(district, 'i');

  if (search) {
    query.$or = [
      { businessName: new RegExp(search, 'i') },
      { about: new RegExp(search, 'i') }
    ];
  }

  let sort = { createdAt: -1 };
  if (sortBy === 'rating') sort = { 'stats.rating': -1 };
  else if (sortBy === 'earnings') sort = { 'stats.totalEarnings': -1 };
  else if (sortBy === 'bookings') sort = { 'stats.totalBookings': -1 };

  const skip = (page - 1) * limit;

  const providers = await Provider.find(query)
    .populate('user', 'name phone email isBlocked')
    .populate('category', 'name')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Provider.countDocuments(query);

  const providersData = await Promise.all(providers.map(async (p) => {
    const balance = await redisClient.hget(`wallet:${p.user._id}`, 'balance');
    return {
      ...p.toObject(),
      bookingCount: p.stats?.totalBookings || 0,
      totalEarnings: p.stats?.totalEarnings || 0,
      pendingPayout: parseFloat(balance || 0)
    };
  }));

  res.status(200).json(new ApiResponse(200, { providers: providersData, total, page: parseInt(page), pages: Math.ceil(total / limit) }, 'Providers fetched'));
});

exports.getProviderById = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.providerId)
    .populate('user', '-password')
    .populate('category');
    
  if (!provider) throw new ApiError(404, 'Provider not found');

  const recentBookings = await Booking.find({ provider: provider._id }).sort({ createdAt: -1 }).limit(20).populate('customer', 'name');
  const earnings = await Payment.find({ provider: provider._id, status: 'captured' }).sort({ createdAt: -1 }).limit(20);
  const reviews = await Review.find({ provider: provider._id }).sort({ createdAt: -1 }).limit(20);
  const auditLogs = await AdminAudit.find({ targetModel: 'Provider', targetId: provider._id }).sort({ createdAt: -1 });
  const payoutHistory = await Payment.find({ provider: provider._id, paymentType: 'payout' }).sort({ createdAt: -1 });
  const subscriptionHistory = provider.subscription ? [provider.subscription] : [];

  res.status(200).json(new ApiResponse(200, { provider, recentBookings, earnings, reviews, auditLogs, payoutHistory, subscriptionHistory }, 'Provider details fetched'));
});

exports.verifyProviderDocument = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { documentId, action, rejectionReason } = req.body;

  if (action === 'reject' && !rejectionReason) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const provider = await Provider.findById(providerId);
  if (!provider) throw new ApiError(404, 'Provider not found');

  const doc = provider.documents.id(documentId);
  if (!doc) throw new ApiError(404, 'Document not found');

  if (action === 'approve') {
    doc.verified = true;
    doc.verifiedAt = new Date();
    doc.verifiedBy = req.user._id;
  } else if (action === 'reject') {
    doc.verified = false;
  }

  const aadhaar = provider.documents.find(d => d.type === 'aadhaar');
  const photo = provider.documents.find(d => d.type === 'photo');
  
  if (aadhaar?.verified && photo?.verified) {
    provider.isVerified = true;
    await sendNotification({
      providerId: provider._id,
      type: 'provider_verified',
      title: 'Profile Verified!',
      body: 'Your documents have been verified. You can now receive bookings.'
    });
  }

  await provider.save();

  if (action === 'reject') {
    await sendNotification({
      providerId: provider._id,
      type: 'document_rejected',
      title: 'Document Rejected',
      body: `Your ${doc.type} was rejected. Reason: ${rejectionReason}. Please re-upload.`
    });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'VERIFY_DOCUMENT',
    targetModel: 'Provider',
    targetId: provider._id,
    reason: action === 'reject' ? rejectionReason : 'Approved',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  const updatedProvider = await Provider.findById(providerId).populate('user', 'name phone email').populate('category');
  res.status(200).json(new ApiResponse(200, updatedProvider, `Document ${action}ed successfully`));
});

exports.verifyProvider = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const provider = await Provider.findById(providerId);
  if (!provider) throw new ApiError(404, 'Provider not found');

  provider.isVerified = true;
  await provider.save();

  await sendNotification({
    providerId: provider._id,
    type: 'provider_verified',
    title: 'Profile Verified!',
    body: 'Your profile has been manually verified by admin.'
  });

  await logAdminAction({
    adminId: req.user._id,
    action: 'VERIFY_PROVIDER',
    targetModel: 'Provider',
    targetId: provider._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, provider, 'Provider manually verified'));
});

exports.featureProvider = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const provider = await Provider.findById(providerId);
  if (!provider) throw new ApiError(404, 'Provider not found');

  provider.isFeatured = !provider.isFeatured; 
  await provider.save({ validateBeforeSave: false });

  await logAdminAction({
    adminId: req.user._id,
    action: 'FEATURE_PROVIDER',
    targetModel: 'Provider',
    targetId: provider._id,
    newValue: provider.isFeatured,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, provider, `Provider featured status set to ${provider.isFeatured}`));
});

exports.adjustProviderEarnings = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { amount, type, reason, bookingId } = req.body;
  if (!reason || !amount || !type) throw new ApiError(400, 'Amount, type, and reason are required');

  const provider = await Provider.findById(providerId);
  if (!provider) throw new ApiError(404, 'Provider not found');

  const adjustment = await Payment.create({
    amount,
    currency: 'INR',
    method: 'wallet',
    status: 'captured',
    paymentType: 'adjustment',
    provider: provider._id,
    booking: bookingId || null,
    notes: reason
  });

  if (type === 'credit') {
    provider.stats.totalEarnings += amount;
    await redisClient.hincrbyfloat(`wallet:${provider.user}`, 'balance', amount);
  } else {
    provider.stats.totalEarnings -= amount;
    await redisClient.hincrbyfloat(`wallet:${provider.user}`, 'balance', -amount);
  }

  await provider.save();

  await sendNotification({
    providerId: provider._id,
    type: 'wallet_adjustment',
    title: 'Wallet Adjustment',
    body: `Your wallet was ${type}ed with ₹${amount}. Reason: ${reason}`
  });

  await logAdminAction({
    adminId: req.user._id,
    action: 'ADJUST_EARNINGS',
    targetModel: 'Provider',
    targetId: provider._id,
    reason,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, { provider, adjustment }, 'Earnings adjusted successfully'));
});

exports.getPendingVerifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const providers = await Provider.find({ 'documents.verified': false })
    .populate('category', 'name')
    .sort({ 'documents.uploadedAt': 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Provider.countDocuments({ 'documents.verified': false });

  res.status(200).json(new ApiResponse(200, { providers, total, page: parseInt(page), pages: Math.ceil(total / limit) }, 'Pending verifications fetched'));
});
