'use strict';

const crypto = require('crypto');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// 1. generateBookingId()
const generateBookingId = async () => {
  const year = new Date().getFullYear();
  let isUnique = false;
  let bookingId = '';

  while (!isUnique) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    bookingId = `BK${year}${randomHex}`;
    const exists = await Booking.exists({ bookingId });
    if (!exists) {
      isUnique = true;
    }
  }
  return bookingId;
};

// 2. checkProviderAvailability(providerId, scheduledAt)
const checkProviderAvailability = async (providerId, scheduledAt) => {
  const provider = await Provider.findById(providerId).select('availability');
  if (!provider || !provider.availability.isAvailable) {
    return { isAvailable: false, reason: 'Provider is currently offline or unavailable.' };
  }

  const date = new Date(scheduledAt);
  const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
  const scheduleDay = provider.availability.schedule[dayOfWeek];

  if (!scheduleDay || !scheduleDay.isAvailable) {
    return { isAvailable: false, reason: 'Provider does not work on this day of the week.' };
  }

  // Basic time bounds check
  const timeString = date.toTimeString().slice(0, 5); // "HH:MM"
  if (timeString < scheduleDay.startTime || timeString > scheduleDay.endTime) {
    return { isAvailable: false, reason: `Provider working hours are from ${scheduleDay.startTime} to ${scheduleDay.endTime}.` };
  }

  // Check overlapping accepted/arriving/in_progress bookings (2 hr window)
  const twoHoursBefore = new Date(date.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(date.getTime() + 2 * 60 * 60 * 1000);

  const overlapping = await Booking.exists({
    provider: providerId,
    status: { $in: ['accepted', 'arriving', 'in_progress'] },
    scheduledAt: { $gte: twoHoursBefore, $lt: twoHoursAfter }
  });

  if (overlapping) {
    return { isAvailable: false, reason: 'Provider has an overlapping booking at this time.' };
  }

  return { isAvailable: true };
};

// 3. calculateRefundAmount(booking, cancelledBy)
const calculateRefundAmount = (booking, cancelledBy) => {
  if (booking.paymentMethod === 'cash' || booking.paymentStatus !== 'paid') {
    return { refundAmount: 0, refundPercent: 0, reason: 'No payment was made.' };
  }

  const amountPaid = booking.price; // Simplified; ignoring tax/fees here for now

  if (cancelledBy === 'provider' || cancelledBy === 'system' || cancelledBy === 'admin') {
    return { refundAmount: amountPaid, refundPercent: 100, reason: 'Cancelled by provider/system.' };
  }

  if (cancelledBy === 'customer') {
    const minutesUntilScheduled = (new Date(booking.scheduledAt).getTime() - Date.now()) / (1000 * 60);

    if (minutesUntilScheduled > 60) {
      return { refundAmount: amountPaid, refundPercent: 100, reason: 'Cancelled > 60 min before.' };
    } else if (minutesUntilScheduled > 30) {
      return { refundAmount: amountPaid * 0.5, refundPercent: 50, reason: 'Cancelled 30-60 min before.' };
    } else {
      return { refundAmount: 0, refundPercent: 0, reason: 'Cancelled < 30 min before.' };
    }
  }

  return { refundAmount: 0, refundPercent: 0, reason: 'Unknown cancellation scenario.' };
};

// 4. validateStatusTransition(currentStatus, newStatus, role)
const validateStatusTransition = (currentStatus, newStatus, role) => {
  const validTransitions = {
    pending: {
      accepted: ['provider'],
      cancelled: ['customer', 'provider', 'admin']
    },
    accepted: {
      arriving: ['provider'],
      cancelled: ['customer', 'provider', 'admin'],
      no_show: ['system', 'admin']
    },
    arriving: {
      in_progress: ['provider'],
      cancelled: ['customer', 'provider', 'admin'] // Provider can still cancel with penalty, admin force
    },
    in_progress: {
      completed: ['provider'],
      cancelled: ['admin'] // Only admin can cancel once started
    },
    completed: {},
    cancelled: {},
    no_show: {}
  };

  const allowedStatuses = validTransitions[currentStatus];
  if (!allowedStatuses) {
    return { isValid: false, reason: `Cannot transition from terminal state '${currentStatus}'.` };
  }

  const allowedRoles = allowedStatuses[newStatus];
  if (!allowedRoles) {
    return { isValid: false, reason: `Cannot transition from '${currentStatus}' to '${newStatus}'.` };
  }

  if (!allowedRoles.includes(role)) {
    return { isValid: false, reason: `Role '${role}' cannot perform transition to '${newStatus}'.` };
  }

  return { isValid: true };
};

// 5. scheduleBookingJobs(booking) & 6. cancelBookingJobs(bookingId)
// We dynamically import agenda so we don't cause circular dependencies
// if jobs file requires models that require helpers.
const scheduleBookingJobs = async (booking) => {
  try {
    const { agenda } = require('../jobs/bookingJobs');
    if (!agenda) return;

    const scheduledAt = new Date(booking.scheduledAt);
    
    // Customer reminder: 1 hr before
    const customerReminderTime = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
    if (customerReminderTime > new Date()) {
      await agenda.schedule(customerReminderTime, 'booking-reminder-customer', {
        bookingId: booking._id,
        customerId: booking.customer,
        providerId: booking.provider,
        serviceId: booking.service
      });
    }

    // Provider reminder: 2 hrs before
    const providerReminderTime = new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000);
    if (providerReminderTime > new Date()) {
      await agenda.schedule(providerReminderTime, 'booking-reminder-provider', {
        bookingId: booking._id,
        customerId: booking.customer,
        providerId: booking.provider
      });
    }

    // No-show check: 2 hrs after
    const noShowCheckTime = new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000);
    await agenda.schedule(noShowCheckTime, 'booking-no-show-check', {
      bookingId: booking._id
    });
  } catch (err) {
    const logger = require('./logger');
    logger.error('Failed to schedule booking jobs', { error: err.message, bookingId: booking._id });
  }
};

const cancelBookingJobs = async (bookingId) => {
  try {
    const { agenda } = require('../jobs/bookingJobs');
    if (!agenda) return;

    await agenda.cancel({ 'data.bookingId': bookingId.toString() });
  } catch (err) {
    const logger = require('./logger');
    logger.error('Failed to cancel booking jobs', { error: err.message, bookingId });
  }
};

module.exports = {
  generateBookingId,
  checkProviderAvailability,
  calculateRefundAmount,
  validateStatusTransition,
  scheduleBookingJobs,
  cancelBookingJobs
};
