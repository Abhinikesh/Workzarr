const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const dashboardRoutes     = require('./dashboard.routes');
const userRoutes          = require('./user.routes');
const providerRoutes      = require('./provider.routes');
const notificationRoutes  = require('./notification.routes');
const settingsRoutes      = require('./settings.routes');
const categoryRoutes      = require('./category.routes');
const auditRoutes         = require('./audit.routes');
const bookingRoutes       = require('./booking.routes');
const paymentRoutes       = require('./payment.routes');
const analyticsRoutes     = require('./analytics.routes');

// Admin strict rate limiter
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to admin API, please try again later.'
  }
});

// Apply to all admin routes
router.use(adminRateLimiter);
router.use(protect);
router.use(restrictTo('admin', 'superAdmin'));

router.use('/dashboard',     dashboardRoutes);
router.use('/users',         userRoutes);
router.use('/providers',     providerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings',      settingsRoutes);
router.use('/categories',    categoryRoutes);
router.use('/audit',         auditRoutes);
router.use('/bookings',      bookingRoutes);
router.use('/payments',      paymentRoutes);
router.use('/analytics',     analyticsRoutes);

module.exports = router;
