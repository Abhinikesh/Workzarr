const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const redisClient = require('../config/redis');

// Centralize rate limit error response handling
const standardHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message
  });
};

const createRedisStore = (prefix) => {
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl_${prefix}:`
  });
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('global'),
  handler: standardHandler,
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
  handler: standardHandler,
  message: 'Too many authentication attempts, please try again after 15 minutes.'
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('otp'),
  handler: standardHandler,
  message: 'Too many OTP requests from this IP, please try again after an hour.'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('api'),
  keyGenerator: (req) => {
    // Limit by user ID if logged in, otherwise IP
    return req.user ? req.user._id.toString() : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
  },
  handler: standardHandler,
  message: 'API rate limit exceeded. Please try again later.'
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  apiLimiter
};
