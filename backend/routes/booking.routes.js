'use strict';

const express = require('express');
const ctrl = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  validate,
  createBookingSchema,
  getBookingsSchema,
  rescheduleBookingSchema,
  updateBookingStatusSchema
} = require('../validators/booking.validator');

const router = express.Router();

// ─── Customer Routes ──────────────────────────────────────────────────────────

router.post(
  '/',
  protect,
  restrictTo('customer'),
  validate(createBookingSchema),
  ctrl.createBooking
);

router.get(
  '/',
  protect,
  validate(getBookingsSchema, 'query'),
  ctrl.getMyBookings
);

router.get(
  '/active',
  protect,
  ctrl.getActiveBooking
);

router.get(
  '/:bookingId',
  protect,
  ctrl.getBookingById
);

router.get(
  '/:bookingId/otp',
  protect,
  restrictTo('customer'),
  ctrl.getBookingOTP
);

router.get(
  '/:bookingId/chat',
  protect,
  ctrl.getBookingChatHistory
);

router.patch(
  '/:bookingId/reschedule',
  protect,
  restrictTo('customer'),
  validate(rescheduleBookingSchema),
  ctrl.rescheduleBooking
);

router.patch(
  '/:bookingId/status',
  protect,
  validate(updateBookingStatusSchema),
  ctrl.updateBookingStatus
);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.get(
  '/admin/all',
  protect,
  restrictTo('admin'),
  ctrl.adminGetAllBookings
);

router.patch(
  '/admin/:bookingId',
  protect,
  restrictTo('admin'),
  ctrl.adminUpdateBooking
);

module.exports = router;
