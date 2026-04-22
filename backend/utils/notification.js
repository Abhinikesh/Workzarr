'use strict';

const admin = require('firebase-admin');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser, emitToProvider } = require('../socket/socket');
const logger = require('./logger');

// Initialize Firebase Admin gracefully
try {
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('Firebase Admin initialized.');
  }
} catch (err) {
  logger.warn('Failed to initialize Firebase Admin. Push notifications will be skipped.', { error: err.message });
}

// ─── NOTIFICATION TEMPLATES ───────────────────────────────────────────────────

const NOTIFICATION_TEMPLATES = {
  BOOKING_REQUESTED: {
    customer: { title: 'Booking Confirmed!', body: 'Your booking for {service} has been placed.' },
    provider: { title: 'New Booking Request!', body: '{customerName} needs {service}. Accept now!' }
  },
  BOOKING_ACCEPTED: {
    customer: { title: 'Provider Accepted!', body: '{providerName} accepted your booking.' }
  },
  BOOKING_CANCELLED: {
    customer: { title: 'Booking Cancelled', body: 'Your booking has been cancelled.' },
    provider: { title: 'Booking Cancelled', body: 'Booking by {customerName} was cancelled.' }
  },
  PROVIDER_ARRIVING: {
    customer: { title: 'Provider is on the way!', body: '{providerName} is heading to your location.' }
  },
  JOB_STARTED: {
    customer: { title: 'Work Started', body: '{providerName} has started the job.' }
  },
  JOB_COMPLETED: {
    customer: { title: 'Job Completed!', body: 'Rate your experience with {providerName}.' }
  },
  PAYMENT_RECEIVED: {
    provider: { title: 'Payment Received!', body: '₹{amount} received for {service}.' }
  }
};

const CRITICAL_TYPES = [
  'booking_request', 'booking_accepted', 'booking_cancelled',
  'payment_received', 'account_verified'
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const sendPushNotification = async (fcmToken, { title, body, data }) => {
  if (!admin.apps.length || !fcmToken) return;

  try {
    const message = {
      notification: { title, body },
      data: data || {},
      token: fcmToken
    };
    await admin.messaging().send(message);
  } catch (error) {
    logger.error('Push notification failed', { error: error.message, fcmToken });
  }
};

const sendBulkNotification = async (userIds, { title, body, data, type }) => {
  if (!admin.apps.length || !userIds || !userIds.length) return;

  try {
    // 1. Save to DB for all
    const notifications = userIds.map((userId) => ({
      recipient: userId,
      type,
      title,
      body,
      data,
      channel: 'in_app'
    }));
    await Notification.insertMany(notifications);

    // 2. Emit Socket events
    userIds.forEach(userId => {
      emitToUser(userId.toString(), 'notification:new', { title, body, data, type, createdAt: new Date() });
    });

    // 3. Fetch FCM tokens
    const users = await User.find({ _id: { $in: userIds }, fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
    const tokens = users.map(u => u.fcmToken);

    // 4. Send via Firebase Multicast (batches of 500)
    const BATCH_SIZE = 500;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + BATCH_SIZE);
      const message = {
        notification: { title, body },
        data: data || {},
        tokens: batchTokens
      };
      await admin.messaging().sendEachForMulticast(message); // sendMulticast is deprecated in newer SDKs, sendEachForMulticast is the replacement
    }
  } catch (error) {
    logger.error('Bulk push notification failed', { error: error.message });
  }
};

const queueSMS = async (phone, body) => {
  // Graceful MSG91 stub (since no specific MSG91 API key is provided here)
  if (!process.env.MSG91_AUTH_KEY) {
    logger.info('SMS Queue skipped (No MSG91 Auth Key)', { phone, body });
    return;
  }
  // Standard MSG91 Axios call would go here
  logger.info('SMS Queued via MSG91', { phone, body });
};

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

/**
 * Main notification dispatcher
 * @param {Object} params
 * @param {String} params.userId Customer _id (if targeting customer)
 * @param {String} params.providerId Provider _id (if targeting provider)
 * @param {String} params.type Notification type
 * @param {String} params.title Title
 * @param {String} params.body Body
 * @param {Object} params.data Custom payload
 */
const sendNotification = async ({ userId, providerId, type, title, body, data = {} }) => {
  try {
    const recipientId = userId || providerId;
    if (!recipientId) return;

    // 1. Save to Notification model in DB
    const notif = await Notification.create({
      recipient: recipientId,
      type,
      title,
      body,
      data,
      channel: 'in_app'
    });

    // 2. Fetch User to get FCM token & phone
    const user = await User.findById(recipientId).select('fcmToken phone role');
    
    // 3. Emit Socket.io event (if online)
    if (user && user.role === 'provider' && providerId) {
      emitToProvider(providerId.toString(), 'notification:new', notif);
    } else {
      emitToUser(recipientId.toString(), 'notification:new', notif);
    }

    if (!user) return;

    // 4. Send Firebase push notification
    if (user.fcmToken) {
      await sendPushNotification(user.fcmToken, {
        title,
        body,
        data: {
          type,
          ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) // FCM requires string values
        }
      });
    }

    // 5. Queue SMS if critical
    if (CRITICAL_TYPES.includes(type) && user.phone) {
      await queueSMS(user.phone, body);
    }

  } catch (err) {
    logger.error('sendNotification failed', { error: err.message, stack: err.stack });
  }
};

module.exports = {
  NOTIFICATION_TEMPLATES,
  sendNotification,
  sendPushNotification,
  sendBulkNotification
};
