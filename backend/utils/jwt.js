const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const ApiError = require('./ApiError');
const logger = require('./logger');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;

const generateAccessToken = (payload) => {
  return jwt.sign(
    { userId: payload.userId, role: payload.role, phone: payload.phone },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { userId: payload.userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired');
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }
};

const generateTokenPair = async (user) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    phone: user.phone
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in Redis (1 active token per user)
  const redisKey = `refresh_token:${payload.userId}`;
  try {
    await redisClient.setEx(redisKey, REFRESH_TOKEN_EXPIRY_SECONDS, refreshToken);
  } catch (error) {
    logger.error('Redis setsEx error while saving refresh token:', error);
    throw ApiError.internal('Could not save refresh token');
  }

  return { accessToken, refreshToken };
};

const invalidateRefreshToken = async (userId) => {
  const redisKey = `refresh_token:${userId}`;
  try {
    await redisClient.del(redisKey);
  } catch (error) {
    logger.error('Redis del error while invalidating refresh token:', error);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  invalidateRefreshToken
};
