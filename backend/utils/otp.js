const crypto = require('crypto');
const axios = require('axios');
const redisClient = require('../config/redis');
const logger = require('./logger');

const OTP_TTL = 600; // 10 minutes
const BLOCK_TTL = 1800; // 30 minutes
const MAX_ATTEMPTS = 5;

const generateOTP = () => {
  if (process.env.NODE_ENV === 'development') {
    return '123456';
  }
  return crypto.randomInt(100000, 999999).toString();
};

const sendOTPviaSMS = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV MODE] Sending OTP ${otp} to phone ${phone}`);
    return { success: true, messageId: 'dev_mock_id' };
  }

  try {
    const url = 'https://control.msg91.com/api/v5/otp';
    const response = await axios.post(
      url,
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        authkey: process.env.MSG91_AUTH_KEY,
        otp: otp
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.type === 'error') {
      logger.error('MSG91 Error:', response.data);
      return { success: false, error: response.data.message };
    }

    return { success: true, messageId: response.data.request_id };
  } catch (error) {
    logger.error('MSG91 API Request Failed:', error.message);
    return { success: false, error: error.message };
  }
};

const storeOTPinRedis = async (phone, hashedOtp, purpose) => {
  const key = `otp:${purpose}:${phone}`;
  const value = JSON.stringify({ hashedOtp, attempts: 0 });
  await redisClient.setex(key, OTP_TTL, value);
};

const getOTPfromRedis = async (phone, purpose) => {
  const key = `otp:${purpose}:${phone}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

const incrementOTPAttempts = async (phone, purpose) => {
  const key = `otp:${purpose}:${phone}`;
  const dataStr = await redisClient.get(key);
  
  if (!dataStr) return 0;
  
  const data = JSON.parse(dataStr);
  data.attempts += 1;
  
  await redisClient.setex(key, OTP_TTL, JSON.stringify(data));
  
  if (data.attempts >= MAX_ATTEMPTS) {
    const blockKey = `otp_blocked:${phone}`;
    await redisClient.setex(blockKey, BLOCK_TTL, 'blocked');
    await redisClient.del(key);
  }
  
  return data.attempts;
};

const isPhoneBlocked = async (phone) => {
  const blockKey = `otp_blocked:${phone}`;
  const blocked = await redisClient.get(blockKey);
  return !!blocked;
};

const deleteOTPfromRedis = async (phone, purpose) => {
  const key = `otp:${purpose}:${phone}`;
  await redisClient.del(key);
};

module.exports = {
  generateOTP,
  sendOTPviaSMS,
  storeOTPinRedis,
  getOTPfromRedis,
  incrementOTPAttempts,
  isPhoneBlocked,
  deleteOTPfromRedis
};
