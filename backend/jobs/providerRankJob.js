'use strict';

const Agenda = require('agenda');
const mongoose     = require('mongoose');
const logger       = require('../utils/logger');
const redisClient  = require('../config/redis');
const Provider     = require('../models/Provider');
const Notification = require('../models/Notification');
const User         = require('../models/User');

// ─── Agenda instance (uses same MongoDB) ─────────────────────────────────────
const agenda = new Agenda({
  db: { address: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/localserve', collection: 'agendaJobs' },
  processEvery:       '1 minute',
  maxConcurrency:     5,
  defaultConcurrency: 2
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const computeRank = (provider) =>
  (provider.rating.average  * 20) +
  (provider.stats.completedJobs * 0.1) +
  (provider.subscription && provider.subscription.plan === 'premium' &&
   provider.subscription.isActive ? 30 : 0) +
  (provider.isVerified ? 20 : 0) -
  (provider.stats.cancelledJobs * 2);

const flushSearchCache = async () => {
  try {
    const keys = await redisClient.keys('search:*');
    if (keys.length) {
      await redisClient.del(...keys);
      logger.info(`Flushed ${keys.length} search cache keys.`);
    }
    const topKeys = await redisClient.keys('top_providers:*');
    if (topKeys.length) {
      await redisClient.del(...topKeys);
      logger.info(`Flushed ${topKeys.length} top-provider cache keys.`);
    }
  } catch (err) {
    logger.warn('Cache flush warning', { error: err.message });
  }
};

const createProviderNotification = async (userId, title, body, data = {}) => {
  try {
    await Notification.create({
      recipient: userId,
      type:      'subscription_expiring',
      title,
      body,
      data,
      channel:   'in_app'
    });
  } catch (err) {
    logger.warn('Failed to create provider notification', { userId, error: err.message });
  }
};

// ─── Job 1: update-provider-ranks (every day at 2 AM) ────────────────────────
agenda.define('update-provider-ranks', { priority: 'high', concurrency: 1 }, async (job) => {
  const startTime = Date.now();
  logger.info('Starting job: update-provider-ranks');

  try {
    const providers = await Provider.find({ isActive: true }).lean();

    if (!providers.length) {
      logger.info('No active providers found for rank update.');
      return;
    }

    const bulkOps = providers.map((p) => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { rank: computeRank(p) } }
      }
    }));

    const result = await Provider.bulkWrite(bulkOps, { ordered: false });
    const elapsedMs = Date.now() - startTime;

    await flushSearchCache();

    logger.info('Job complete: update-provider-ranks', {
      totalProviders: providers.length,
      modifiedCount:  result.modifiedCount,
      elapsedMs
    });
  } catch (err) {
    logger.error('Job failed: update-provider-ranks', { error: err.message, stack: err.stack });
    throw err; // Let Agenda mark the job as failed
  }
});

// ─── Job 2: check-subscription-expiry (every day at midnight) ────────────────
agenda.define('check-subscription-expiry', { priority: 'normal', concurrency: 1 }, async (job) => {
  logger.info('Starting job: check-subscription-expiry');

  const now         = new Date();
  const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    // ── 2a. Warn providers expiring in <= 3 days ─────────────────────────────
    const expiringSoon = await Provider.find({
      'subscription.isActive': true,
      'subscription.endDate':  { $lte: threeDaysOut, $gt: now }
    }).select('_id userId subscription').lean();

    for (const p of expiringSoon) {
      const daysLeft = Math.ceil((new Date(p.subscription.endDate) - now) / (1000 * 60 * 60 * 24));
      await createProviderNotification(
        p.userId,
        'Subscription Expiring Soon',
        `Your premium subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to keep your benefits.`,
        { providerId: p._id, expiresAt: p.subscription.endDate }
      );
    }

    logger.info(`Sent ${expiringSoon.length} subscription-expiry warnings.`);

    // ── 2b. Deactivate expired subscriptions ─────────────────────────────────
    const expired = await Provider.find({
      'subscription.isActive': true,
      'subscription.endDate':  { $lt: now }
    }).select('_id userId subscription rating stats isVerified').lean();

    if (expired.length) {
      const expiredIds = expired.map((p) => p._id);

      await Provider.updateMany(
        { _id: { $in: expiredIds } },
        {
          $set: {
            'subscription.isActive': false,
            'subscription.plan':     'free'
          }
        }
      );

      // Recompute ranks for expired providers
      const rankOps = expired.map((p) => {
        const fakeProvider = { ...p, subscription: { plan: 'free', isActive: false } };
        return {
          updateOne: {
            filter: { _id: p._id },
            update: { $set: { rank: computeRank(fakeProvider) } }
          }
        };
      });

      await Provider.bulkWrite(rankOps, { ordered: false });

      // Notify each provider
      for (const p of expired) {
        await createProviderNotification(
          p.userId,
          'Subscription Expired',
          'Your premium subscription has expired. Your profile has been moved to the free plan. Renew to restore premium visibility.',
          { providerId: p._id }
        );
      }

      await flushSearchCache();

      logger.info(`Deactivated ${expired.length} expired subscriptions.`);
    } else {
      logger.info('No expired subscriptions found.');
    }
  } catch (err) {
    logger.error('Job failed: check-subscription-expiry', { error: err.message, stack: err.stack });
    throw err;
  }
});

// ─── Schedule and start ────────────────────────────────────────────────────────
const startAgenda = async () => {
  await agenda.start();

  // Schedule recurring jobs
  await agenda.every('0 2 * * *', 'update-provider-ranks');    // 2:00 AM daily
  await agenda.every('0 0 * * *', 'check-subscription-expiry'); // midnight daily

  logger.info('Agenda jobs scheduled: update-provider-ranks (2AM), check-subscription-expiry (midnight)');
};

// Graceful shutdown
const stopAgenda = async () => {
  await agenda.stop();
  logger.info('Agenda stopped gracefully.');
};

module.exports = { agenda, startAgenda, stopAgenda };
