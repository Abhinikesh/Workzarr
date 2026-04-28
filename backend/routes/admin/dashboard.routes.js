const express = require('express');
const dashboardController = require('../../controllers/admin/dashboard.controller');
const router = express.Router();

router.get('/overview', dashboardController.getDashboardOverview);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/booking-chart', dashboardController.getBookingChart);
router.get('/geographic', dashboardController.getGeographicAnalytics);

module.exports = router;
