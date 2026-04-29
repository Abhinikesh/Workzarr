const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, sendOTPSchema, verifyOTPSchema, refreshTokenSchema, completeProfileSchema } = require('../validators/auth.validator');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post(
  '/send-otp',
  otpLimiter,
  authLimiter,
  validate(sendOTPSchema),
  authController.sendOTP
);

router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOTPSchema),
  authController.verifyOTP
);

router.post(
  '/admin/login',
  authLimiter,
  authController.adminLogin
);

router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshAccessToken
);

router.post(
  '/logout',
  authMiddleware.protect,
  authController.logout
);

router.get(
  '/me',
  authMiddleware.protect,
  authController.getMe
);

router.patch(
  '/complete-profile',
  authMiddleware.protect,
  validate(completeProfileSchema),
  authController.completeProfile
);

module.exports = router;
