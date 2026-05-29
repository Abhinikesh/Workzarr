const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, sendOTPSchema, verifyOTPSchema, refreshTokenSchema, completeProfileSchema } = require('../validators/auth.validator');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// ── OTP routes (phone login — existing) ──────────────────────────────────────
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

// ── Email + Password routes (NEW) ─────────────────────────────────────────────

// POST /api/v1/auth/register  — create account with name, email, password
router.post(
  '/register',
  authLimiter,
  authController.register
);

// POST /api/v1/auth/login  — email + password login for customers/providers
router.post(
  '/login',
  authLimiter,
  authController.login
);

// ── Admin login ───────────────────────────────────────────────────────────────
// POST /api/v1/auth/admin/login  — email + password, role must be 'admin'
router.post(
  '/admin/login',
  authLimiter,
  authController.adminLogin
);

// ── Token management ──────────────────────────────────────────────────────────
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

// ── Profile ───────────────────────────────────────────────────────────────────
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
