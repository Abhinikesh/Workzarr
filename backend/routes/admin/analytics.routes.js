const express = require('express');
const analyticsController = require('../../controllers/admin/analytics.controller');
const router = express.Router();

// GET /admin/analytics/revenue?period=30d
router.get('/revenue', analyticsController.getRevenueAnalytics);

// GET /admin/analytics/bookings?period=30d
router.get('/bookings', analyticsController.getBookingAnalytics);

// GET /admin/analytics/categories
router.get('/categories', analyticsController.getCategoryAnalytics);

// GET /admin/analytics/geo
router.get('/geo', analyticsController.getGeoAnalytics);

module.exports = router;
