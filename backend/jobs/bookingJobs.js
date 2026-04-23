'use strict';

const mongoose = require('mongoose');
const Agenda = require('agenda');
const logger = require('../utils/logger');

// We use dynamic imports inside jobs to avoid circular dependencies
// at load time since models and helpers refer to each other.

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/localserve', collection: 'agendaJobs' },
  processEvery: '1 minute',
  maxConcurrency: 10,
  defaultConcurrency: 5
});

// ─── 1. send-review-reminder ──────────────────────────────────────────────────
agenda.define('send-review-reminder', async (job) => {
  const { bookingId, customerId, providerName } = job.attrs.data;
  const Review = require('../models/Review');
  const { sendNotification } = require('../utils/notification');

  try {
    const existingReview = await Review.exists({ booking: bookingId, customer: customerId });
    if (!existingReview) {
      await sendNotification({
        userId: customerId,
        type: 'review_reminder',
        title: 'Rate your experience!',
        body: `How was your experience with ${providerName}? Rate them now!`,
        data: { bookingId }
      });
      logger.info('Sent review reminder', { bookingId, customerId });
    }
  } catch (err) {
    logger.error('send-review-reminder job failed', { error: err.message, bookingId });
  }
});

// ─── 2. booking-no-show-check ─────────────────────────────────────────────────
agenda.define('booking-no-show-check', async (job) => {
  const { bookingId } = job.attrs.data;
  const Booking = require('../models/Booking');
  const Provider = require('../models/Provider');
  const { emitToUser, emitToProvider } = require('../socket/socket');
  const { sendNotification } = require('../utils/notification');

  try {
    const booking = await Booking.findById(bookingId).populate('customer', 'name').populate('provider', 'businessName stats');
    if (!booking) return;

    if (['accepted', 'arriving'].includes(booking.status)) {
      booking.status = 'no_show';
      booking.cancellationReason = 'System automatically marked as no_show';
      await booking.save();

      const providerId = booking.provider._id;
      const updatedProvider = await Provider.findByIdAndUpdate(providerId, { $inc: { 'stats.noShows': 1 } }, { new: true });

      // Notify parties
      emitToUser(booking.customer._id, 'booking:cancelled', { bookingId, reason: 'Provider did not arrive on time (No Show)' });
      emitToProvider(providerId, 'booking:cancelled', { bookingId, reason: 'Automatically marked as no-show' });

      await sendNotification({
        userId: booking.customer._id,
        type: 'booking_no_show',
        title: 'Booking Cancelled (No Show)',
        body: `Your provider ${booking.provider.businessName} did not arrive. A full refund has been initiated if paid.`,
        data: { bookingId }
      });

      await sendNotification({
        providerId,
        type: 'booking_no_show_provider',
        title: 'Marked as No Show',
        body: `You did not start booking ${booking.bookingId} in time. This impacts your rank.`,
        data: { bookingId }
      });

      // Flag for review if 3+ no shows
      if (updatedProvider.stats && updatedProvider.stats.noShows >= 3) {
        logger.warn('Provider flagged for admin review due to excessive no-shows', { providerId });
        // Can optionally notify admin here
      }

      logger.info('Marked booking as no-show', { bookingId });
    }
  } catch (err) {
    logger.error('booking-no-show-check job failed', { error: err.message, bookingId });
  }
});

// ─── 3. booking-reminder-customer ─────────────────────────────────────────────
agenda.define('booking-reminder-customer', async (job) => {
  const { bookingId, customerId, providerId, serviceId } = job.attrs.data;
  const Booking = require('../models/Booking');
  const { sendNotification } = require('../utils/notification');

  try {
    const booking = await Booking.findById(bookingId).populate('provider', 'businessName').populate('service', 'title');
    if (!booking || !['pending', 'accepted'].includes(booking.status)) return;

    await sendNotification({
      userId: customerId,
      type: 'booking_reminder',
      title: 'Upcoming Booking',
      body: `Reminder: ${booking.provider.businessName} will arrive in 1 hour for ${booking.service.title}.`,
      data: { bookingId }
    });
    logger.info('Sent customer booking reminder', { bookingId });
  } catch (err) {
    logger.error('booking-reminder-customer job failed', { error: err.message, bookingId });
  }
});

// ─── 4. booking-reminder-provider ─────────────────────────────────────────────
agenda.define('booking-reminder-provider', async (job) => {
  const { bookingId, customerId, providerId } = job.attrs.data;
  const Booking = require('../models/Booking');
  const { sendNotification } = require('../utils/notification');

  try {
    const booking = await Booking.findById(bookingId).populate('customer', 'name');
    if (!booking || !['pending', 'accepted'].includes(booking.status)) return;

    await sendNotification({
      providerId,
      type: 'booking_reminder',
      title: 'Upcoming Booking',
      body: `Reminder: You have a booking with ${booking.customer.name} in 2 hours at ${booking.address.fullAddress}.`,
      data: { bookingId }
    });
    logger.info('Sent provider booking reminder', { bookingId });
  } catch (err) {
    logger.error('booking-reminder-provider job failed', { error: err.message, bookingId });
  }
});

module.exports = { agenda };
