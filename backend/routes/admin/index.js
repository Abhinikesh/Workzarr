const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');
const providerRoutes = require('./provider.routes');
const notificationRoutes = require('./notification.routes');
const settingsRoutes = require('./settings.routes');
const categoryRoutes = require('./category.routes');
const auditRoutes = require('./audit.routes');

// Admin strict rate limiter
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to admin API, please try again later.'
  }
});

// Apply to all admin routes
router.use(protect);
router.use(restrictTo('admin', 'superAdmin'));
router.use(adminRateLimiter);

router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/providers', providerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/categories', categoryRoutes);
router.use('/audit', auditRoutes);

module.exports = router;
