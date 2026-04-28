const asyncHandler = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const jwtUtils = require('../utils/jwt');
const User = require('../models/User');
const Provider = require('../models/Provider');
const redisClient = require('../config/redis');

// 1. protect
const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(ApiError.unauthorized('Not authorized to access this route. Please log in.'));
  }

  // Check generic blacklist (if implemented)
  const isBlacklisted = await redisClient.get(`blacklisted_token:${token}`);
  if (isBlacklisted) {
    return next(ApiError.unauthorized('Session expired. Please log in again.'));
  }

  try {
    const decoded = jwtUtils.verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('+status');
    
    if (!user) {
      return next(ApiError.unauthorized('The user belonging to this token no longer exists.'));
    }

    if (user.status === 'blocked') {
      return next(ApiError.forbidden('Your account has been blocked. Contact support.'));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.statusCode === 401) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
    }
    return next(error);
  }
});

// 2. restrictTo
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};

// 3. optionalAuth
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const isBlacklisted = await redisClient.get(`blacklisted_token:${token}`);
    if (isBlacklisted) return next();

    const decoded = jwtUtils.verifyAccessToken(token, true);
    if (!decoded) return next();

    const user = await User.findById(decoded.userId);

    if (user && user.status !== 'blocked') {
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Silent fail for optional auth
  }
  
  next();
});

// 4. providerOnly
const providerOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'provider' && req.user.role !== 'admin') {
    return next(ApiError.forbidden('Only providers can access this route'));
  }

  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    return next(ApiError.forbidden('Complete provider setup first'));
  }

  if (provider.verificationStatus !== 'approved' && req.user.role !== 'admin') {
    return next(ApiError.forbidden('Your provider profile is currently pending approval or rejected'));
  }

  req.provider = provider;
  next();
});

module.exports = {
  protect,
  restrictTo,
  optionalAuth,
  providerOnly
};
