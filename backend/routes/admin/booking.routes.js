const express = require('express');
const bookingController = require('../../controllers/admin/booking.controller');
const router = express.Router();

// GET /admin/bookings
router.get('/', bookingController.getAllBookings);

// GET /admin/bookings/:bookingId
router.get('/:bookingId', bookingController.getBookingById);

// PATCH /admin/bookings/:bookingId/status
router.patch('/:bookingId/status', bookingController.updateBookingStatus);

module.exports = router;
