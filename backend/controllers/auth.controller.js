const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const otpUtils = require('../utils/otp');
const jwtUtils = require('../utils/jwt');
const logger = require('../utils/logger');

// 1. sendOTP
const sendOTP = asyncHandler(async (req, res) => {
  const { phone, purpose } = req.body;

  const isBlocked = await otpUtils.isPhoneBlocked(phone);
  if (isBlocked) {
    throw ApiError.tooManyRequests('Too many failed attempts. Try again in 30 minutes.');
  }

  const otp = otpUtils.generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Fallback to MongoDB
  await OTP.findOneAndUpdate(
    { phone, purpose },
    { phone, purpose, otp: hashedOtp, attempts: 0, expiresAt: new Date(Date.now() + 10 * 60000) },
    { upsert: true, new: true }
  );

  // Store in Redis too
  await otpUtils.storeOTPinRedis(phone, hashedOtp, purpose);

  const smsResult = await otpUtils.sendOTPviaSMS(phone, otp);
  if (!smsResult.success) {
    throw ApiError.internal('Failed to send OTP via SMS');
  }

  const responseData = { messageId: smsResult.messageId };

  if (process.env.NODE_ENV === 'development') {
    responseData.otp = otp; // ONLY for dev
  }

  return ApiResponse.success(res, 200, 'OTP sent successfully', responseData);
});

// 2. verifyOTP
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
    // Fallback to MongoDB
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

  // OTP verified successfully
  await otpUtils.deleteOTPfromRedis(phone, purpose);
  await OTP.deleteOne({ phone, purpose }); // Delete from DB too

  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      phone,
      isPhoneVerified: true
    });
    isNewUser = true;
  } else {
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }
  }

  const { accessToken, refreshToken } = await jwtUtils.generateTokenPair(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return ApiResponse.success(res, 200, 'OTP verified successfully', {
    accessToken,
    user: {
      _id: user._id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      isProfileComplete: user.isProfileComplete
    },
    isNewUser
  });
});

// 3. completeProfile
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
    {
      name,
      email,
      location: {
        town,
        district,
        state,
        pincode
      },
      isProfileComplete: true
    },
    { new: true, runValidators: true }
  ).select('-__v -createdAt -updatedAt');

  return ApiResponse.success(res, 200, 'Profile updated successfully', { user });
});

// 4. refreshAccessToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token is missing');
  }

  try {
    const decoded = jwtUtils.verifyRefreshToken(incomingRefreshToken);
    
    // Check Redis
    const redisClient = require('../config/redis');
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
    
    if (storedToken !== incomingRefreshToken) {
      // Token reuse / potentially compromised
      await jwtUtils.invalidateRefreshToken(decoded.userId);
      throw ApiError.unauthorized('Invalid refresh token or session expired');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const { accessToken, refreshToken } = await jwtUtils.generateTokenPair(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, 200, 'Token refreshed successfully', { accessToken });
  } catch (error) {
    throw ApiError.unauthorized(error.message || 'Invalid refresh token');
  }
});

// 5. logout
const logout = asyncHandler(async (req, res) => {
  await jwtUtils.invalidateRefreshToken(req.user._id.toString());
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  return ApiResponse.success(res, 200, 'Logged out successfully');
});

// 6. getMe
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v -createdAt -updatedAt');
  
  let providerProfile = null;
  if (user.role === 'provider' || user.role === 'admin') {
    // If provider model exists, populate it here.
    // Assuming Provider model is used elsewhere, we simulate it or fetch it.
    const Provider = require('../models/Provider');
    providerProfile = await Provider.findOne({ user: req.user._id }).select('-__v');
  }

  return ApiResponse.success(res, 200, 'User profile fetched successfully', { 
    user, 
    providerProfile 
  });
});

module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  refreshAccessToken,
  logout,
  getMe
};
