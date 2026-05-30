const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const otpUtils = require('../utils/otp');
const jwtUtils = require('../utils/jwt');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Helper — build a safe user object (no password, no sensitive fields)
// ─────────────────────────────────────────────────────────────────────────────
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  isProfileComplete: user.isProfileComplete,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper — issue tokens, set refresh cookie, return access token
// ─────────────────────────────────────────────────────────────────────────────
const issueTokens = async (res, user) => {
  const { accessToken, refreshToken } = await jwtUtils.generateTokenPair(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return accessToken;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. register  —  POST /api/v1/auth/register
//    Body: { name, email, password }
// ─────────────────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Please provide name, email and password');
  }

  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Create user — pre-save hook will hash the password
  const user = await User.create({
    name,
    email,
    password,
    role: 'customer',
    isEmailVerified: true,
    isProfileComplete: true,
  });

  user.lastLogin = new Date();
  await user.save();

  const accessToken = await issueTokens(res, user);

  return ApiResponse.success(res, 201, 'Account created successfully', {
    accessToken,
    user: safeUser(user),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. login  —  POST /api/v1/auth/login
//    Body: { email, password }
//    Works for customers and providers
// ─────────────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password');
  }

  // +password to override select: false on the schema
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact support.');
  }

  if (user.isBlocked) {
    throw ApiError.forbidden('Your account has been blocked. Contact support.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(res, user);

  return ApiResponse.success(res, 200, 'Login successful', {
    accessToken,
    user: safeUser(user),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. adminLogin  —  POST /api/v1/auth/admin/login
//    Body: { email, password }
//    Requires role === 'admin'
// ─────────────────────────────────────────────────────────────────────────────
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password');
  }

  const user = await User.findOne({ email, role: 'admin' }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your admin account is inactive. Contact super admin.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const payload = {
    id: user._id.toString(),
    userId: user._id.toString(),
    role: user.role
  };

  const accessToken = jwtUtils.generateAccessToken(payload, '15m');
  const refreshToken = jwtUtils.generateRefreshToken(payload, '7d');

  // Store refresh token in Redis (under key refresh:{userId} using client.set)
  const redisClient = require('../config/redis');
  await redisClient.set(`refresh:${payload.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  // Set httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.success(res, 200, 'Admin login successful', {
    accessToken,
    refreshToken,
    user: safeUser(user),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. sendOTP  —  POST /api/v1/auth/send-otp
// ─────────────────────────────────────────────────────────────────────────────
const sendOTP = asyncHandler(async (req, res) => {
  const { phone, purpose } = req.body;

  const isBlocked = await otpUtils.isPhoneBlocked(phone);
  if (isBlocked) {
    throw ApiError.tooManyRequests('Too many failed attempts. Try again in 30 minutes.');
  }

  const otp = otpUtils.generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Persist in MongoDB as fallback
  await OTP.findOneAndUpdate(
    { phone, purpose },
    { phone, purpose, otp: hashedOtp, attempts: 0, expiresAt: new Date(Date.now() + 10 * 60000) },
    { upsert: true, new: true }
  );

  // Also store in Redis (primary)
  await otpUtils.storeOTPinRedis(phone, hashedOtp, purpose);

  const smsResult = await otpUtils.sendOTPviaSMS(phone, otp);
  if (!smsResult.success) {
    throw ApiError.internal('Failed to send OTP via SMS');
  }

  const responseData = { messageId: smsResult.messageId };
  if (process.env.NODE_ENV === 'development') {
    responseData.otp = otp; // expose OTP in dev console only
  }

  return ApiResponse.success(res, 200, 'OTP sent successfully', responseData);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. verifyOTP  —  POST /api/v1/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, purpose } = req.body;

  const isBlocked = await otpUtils.isPhoneBlocked(phone);
  if (isBlocked) {
    throw ApiError.tooManyRequests('Too many failed attempts. Try again in 30 minutes.');
  }

  let otpData = await otpUtils.getOTPfromRedis(phone, purpose);
  let hashedOtp;

  if (otpData) {
    hashedOtp = otpData.hashedOtp;
  } else {
    const otpDoc = await OTP.findOne({ phone, purpose, expiresAt: { $gt: new Date() } });
    if (!otpDoc) {
      throw ApiError.badRequest('OTP expired or not found');
    }
    hashedOtp = otpDoc.otp;
  }

  const attempts = await otpUtils.incrementOTPAttempts(phone, purpose);
  const isMatch = await bcrypt.compare(otp, hashedOtp);

  if (!isMatch) {
    const remaining = 5 - attempts;
    if (remaining <= 0) {
      throw ApiError.tooManyRequests('Too many failed attempts. Try again in 30 minutes.');
    }
    throw ApiError.badRequest(`Invalid OTP. You have ${remaining} attempts left.`);
  }

  await otpUtils.deleteOTPfromRedis(phone, purpose);
  await OTP.deleteOne({ phone, purpose });

  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    user = await User.create({ phone, isPhoneVerified: true });
    isNewUser = true;
  } else {
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }
  }

  const accessToken = await issueTokens(res, user);

  return ApiResponse.success(res, 200, 'OTP verified successfully', {
    accessToken,
    user: safeUser(user),
    isNewUser,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. completeProfile  —  PATCH /api/v1/auth/complete-profile
// ─────────────────────────────────────────────────────────────────────────────
const completeProfile = asyncHandler(async (req, res) => {
  const { name, email, town, district, state, pincode } = req.body;
  const userId = req.user._id;

  if (email) {
    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      throw ApiError.conflict('Email is already registered by another user');
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, email, location: { town, district, state, pincode }, isProfileComplete: true },
    { new: true, runValidators: true }
  ).select('-__v -createdAt -updatedAt');

  return ApiResponse.success(res, 200, 'Profile updated successfully', { user });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. refreshAccessToken  —  POST /api/v1/auth/refresh-token
// ─────────────────────────────────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token is missing');
  }

  try {
    const decoded = jwtUtils.verifyRefreshToken(incomingRefreshToken);
    const userId = decoded.userId || decoded.id;
    const redisClient = require('../config/redis');
    
    // Check both potential Redis keys
    let redisKey = `refresh:${userId}`;
    let storedToken = await redisClient.get(redisKey);
    
    if (!storedToken) {
      redisKey = `refresh_token:${userId}`;
      storedToken = await redisClient.get(redisKey);
    }

    if (!storedToken || storedToken !== incomingRefreshToken) {
      // Invalidate if found on either key
      await redisClient.del(`refresh:${userId}`);
      await redisClient.del(`refresh_token:${userId}`);
      throw ApiError.unauthorized('Invalid refresh token or session expired');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    let accessToken, refreshToken;
    if (user.role === 'admin' || user.role === 'superAdmin') {
      const payload = {
        id: user._id.toString(),
        userId: user._id.toString(),
        role: user.role
      };
      accessToken = jwtUtils.generateAccessToken(payload, '15m');
      refreshToken = jwtUtils.generateRefreshToken(payload, '7d');

      // Update Redis key refresh:{userId}
      await redisClient.set(`refresh:${user._id.toString()}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    } else {
      const payload = {
        userId: user._id.toString(),
        id: user._id.toString(),
        role: user.role,
        phone: user.phone
      };
      accessToken = jwtUtils.generateAccessToken(payload);
      refreshToken = jwtUtils.generateRefreshToken(payload);

      // Update Redis key refresh_token:{userId}
      await redisClient.set(`refresh_token:${user._id.toString()}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    }

    // Update the cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return ApiResponse.success(res, 200, 'Token refreshed successfully', { 
      accessToken, 
      refreshToken 
    });
  } catch (error) {
    throw ApiError.unauthorized(error.message || 'Invalid refresh token');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. logout  —  POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const redisClient = require('../config/redis');

  // Invalidate both potential keys in Redis
  await redisClient.del(`refresh:${userId}`);
  await redisClient.del(`refresh_token:${userId}`);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  return ApiResponse.success(res, 200, 'Logged out successfully');
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. getMe  —  GET /api/v1/auth/me
// ─────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v -createdAt -updatedAt');

  let providerProfile = null;
  if (user.role === 'provider') {
    const Provider = require('../models/Provider');
    providerProfile = await Provider.findOne({ userId: req.user._id }).select('-__v');
  }

  return ApiResponse.success(res, 200, 'User profile fetched successfully', {
    user,
    providerProfile,
  });
});

module.exports = {
  register,
  login,
  adminLogin,
  sendOTP,
  verifyOTP,
  completeProfile,
  refreshAccessToken,
  logout,
  getMe,
};
