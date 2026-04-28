const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Review = require('../../models/Review');
const Provider = require('../../models/Provider');
const redisClient = require('../../config/redis');
const { logAdminAction } = require('../../utils/adminHelpers');
const jwt = require('jsonwebtoken');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, isBlocked, isPhoneVerified, search, town, district, sortBy, page = 1, limit = 20 } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isActive) query.isActive = isActive === 'true';
  if (isBlocked) query.isBlocked = isBlocked === 'true';
  if (isPhoneVerified) query.isPhoneVerified = isPhoneVerified === 'true';
  if (town) query['address.town'] = new RegExp(town, 'i');
  if (district) query['address.district'] = new RegExp(district, 'i');

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') }
    ];
  }

  let sort = { createdAt: -1 };
  if (sortBy === 'oldest') sort = { createdAt: 1 };
  else if (sortBy === 'lastLogin') sort = { lastLogin: -1 };

  const skip = (page - 1) * limit;

  const users = await User.aggregate([
    { $match: query },
    { $sort: sort },
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'customer',
        as: 'bookings'
      }
    },
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'customer',
        as: 'payments'
      }
    },
    {
      $addFields: {
        bookingCount: { $size: '$bookings' },
        totalSpent: { $sum: '$payments.amount' }
      }
    },
    {
      $project: { bookings: 0, payments: 0, password: 0 }
    }
  ]);

  const total = await User.countDocuments(query);

  res.status(200).json(new ApiResponse(200, { users, total, page: parseInt(page), pages: Math.ceil(total / limit) }, 'Users fetched'));
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) throw new ApiError(404, 'User not found');

  let providerProfile = null;
  if (user.role === 'provider') {
    providerProfile = await Provider.findOne({ user: user._id });
  }

  const recentBookings = await Booking.find({ customer: user._id }).sort({ createdAt: -1 }).limit(10).populate('provider', 'businessName');
  const recentPayments = await Payment.find({ customer: user._id }).sort({ createdAt: -1 }).limit(10);
  const reviews = await Review.find({ customer: user._id }).sort({ createdAt: -1 }).limit(5).populate('provider', 'businessName');

  res.status(200).json(new ApiResponse(200, { user, providerProfile, recentBookings, recentPayments, reviews }, 'User details fetched'));
});

exports.blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason, password } = req.body;
  if (!reason) throw new ApiError(400, 'Block reason is required');

  const admin = await User.findById(req.user._id).select('+password');
  if (!(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid admin password');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin' || user.role === 'superAdmin') {
    throw new ApiError(403, 'Cannot block other admins');
  }

  user.isBlocked = true;
  user.blockReason = reason;
  user.blockedAt = new Date();
  user.blockedBy = req.user._id;
  await user.save();

  await redisClient.set(`user_blocked:${userId}`, 'true');

  if (user.role === 'provider') {
    const provider = await Provider.findOne({ user: userId });
    if (provider) {
      provider.isActive = false;
      await provider.save();

      await Booking.updateMany(
        { provider: provider._id, status: { $in: ['pending', 'accepted'] } },
        { status: 'cancelled', cancellationReason: 'Provider account suspended' }
      );
    }
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'BLOCK_USER',
    targetModel: 'User',
    targetId: userId,
    reason,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, null, 'User blocked successfully'));
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.isBlocked = false;
  user.blockReason = undefined;
  user.blockedAt = undefined;
  user.blockedBy = undefined;
  await user.save();

  await redisClient.del(`user_blocked:${userId}`);

  if (user.role === 'provider') {
    await Provider.findOneAndUpdate({ user: userId }, { isActive: true });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'UNBLOCK_USER',
    targetModel: 'User',
    targetId: userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, null, 'User unblocked successfully'));
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  const admin = await User.findById(req.user._id).select('+password');
  if (!(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid admin password');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin' || user.role === 'superAdmin') {
    throw new ApiError(403, 'Cannot delete other admins');
  }

  user.isActive = false;
  user.deletedAt = new Date();
  user.name = 'Deleted User';
  user.email = `deleted_${userId}@localserve.com`;
  user.phone = `deleted_${userId}`;
  
  await user.save({ validateBeforeSave: false });

  await Booking.updateMany(
    { customer: userId, status: { $in: ['pending', 'accepted'] } },
    { status: 'cancelled', cancellationReason: 'User deleted account' }
  );

  if (user.role === 'provider') {
    const provider = await Provider.findOne({ user: userId });
    if (provider) {
      provider.isActive = false;
      provider.businessName = 'Deleted Business';
      await provider.save({ validateBeforeSave: false });
    }
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'DELETE_USER',
    targetModel: 'User',
    targetId: userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, null, 'User soft-deleted successfully'));
});

exports.impersonateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (req.user.role !== 'superAdmin') {
    throw new ApiError(403, 'Only super admins can impersonate users');
  }

  const admin = await User.findById(req.user._id).select('+password');
  if (!(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid admin password');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin' || user.role === 'superAdmin') {
    throw new ApiError(403, 'Cannot impersonate admins');
  }

  const payload = {
    id: user._id,
    role: user.role,
    impersonatedBy: req.user._id,
    isImpersonation: true
  };

  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });

  await logAdminAction({
    adminId: req.user._id,
    action: 'IMPERSONATE_USER',
    targetModel: 'User',
    targetId: userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, { accessToken: token, user }, 'Impersonation token generated'));
});
