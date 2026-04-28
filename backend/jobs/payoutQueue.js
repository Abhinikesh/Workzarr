'use strict';

const Queue = require('bull');
const Payout = require('../models/Payout');
const Provider = require('../models/Provider');
const { createPayout } = require('../utils/razorpay');
const { unlockPayoutAmount, debitWallet } = require('../utils/wallet');
const { sendNotification } = require('../utils/notification');
const logger = require('../utils/logger');

// ─── CREATE QUEUE ─────────────────────────────────────────────────────────────
const payoutQueue = new Queue('payout-processing', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { 
      type: 'exponential', 
      delay: 5000,
      // Note: Bull natively doesn't have a 'maxDelay' property in the backoff object, 
      // but we can simulate it with a custom strategy or just keep it reasonable.
      // Standard practice: 3 attempts with 5s exponential is fine.
    },
    removeOnComplete: false,
    removeOnFail: false
  }
});

// ─── PROCESSOR ────────────────────────────────────────────────────────────────
payoutQueue.process(async (job) => {
  const { payoutId } = job.data;

  const payout = await Payout.findById(payoutId);
  if (!payout) throw new Error(`Payout ${payoutId} not found.`);

  // If status changed (already processed), skip to prevent double processing
  if (payout.status !== 'requested') {
    logger.info(`Payout ${payoutId} already processed. Skipping.`, { status: payout.status });
    return;
  }

  const provider = await Provider.findById(payout.provider);
  if (!provider) throw new Error(`Provider for payout ${payoutId} not found.`);

  try {
    let fundAccountId = null;

    if (payout.method === 'bank_transfer') {
      if (!provider.bankDetails || !provider.bankDetails.fundAccountId) {
        throw new Error('Provider missing RazorpayX fund account for bank transfer.');
      }
      fundAccountId = provider.bankDetails.fundAccountId;
    } else if (payout.method === 'upi') {
      if (!provider.upiDetails || !provider.upiDetails.fundAccountId) {
        throw new Error('Provider missing RazorpayX fund account for UPI transfer.');
      }
      fundAccountId = provider.upiDetails.fundAccountId;
    }

    // Process via Razorpay X Payout API
    const razorpayPayout = await createPayout({
      fundAccountId,
      amount: payout.amount * 100, // paise
      purpose: 'payout',
      queue: true,
      notes: { payoutId: payout._id.toString(), providerId: provider._id.toString() }
    });

    payout.status = 'processing';
    payout.transactionRef = razorpayPayout.id;
    payout.processedAt = new Date();
    await payout.save();

    logger.info('Payout processed to Razorpay', { payoutId, razorpayPayoutId: razorpayPayout.id });

  } catch (error) {
    payout.status = 'failed';
    payout.failureReason = error.message;
    await payout.save();

    // Release lock & reverse debit from wallet
    await unlockPayoutAmount(provider._id, payout.amount);
    
    // Notify provider of failure
    await sendNotification({
      providerId: provider._id,
      type: 'payout_failed',
      title: 'Payout Failed',
      body: `Your payout of ₹${payout.amount} failed. Reason: ${error.message}`,
      data: { payoutId: payout._id }
    });

    throw error; // Let Bull handle retries if applicable
  }
});

// ─── EVENTS ───────────────────────────────────────────────────────────────────
payoutQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} (Payout ${job.data.payoutId}) completed successfully.`);
});

payoutQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} (Payout ${job.data.payoutId}) failed.`, { error: err.message });
});

payoutQueue.on('error', (err) => {
  logger.error('Payout queue error', { error: err.message });
});

// ─── SCHEDULED BATCH JOB (Run elsewhere, e.g., via node-cron or agenda) ───────
// Included as a helper method on the queue export
payoutQueue.queueDailyBatch = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const pendingPayouts = await Payout.find({
    status: 'requested',
    requestedAt: { $lte: oneHourAgo }
  });

  for (const payout of pendingPayouts) {
    await payoutQueue.add({ payoutId: payout._id });
  }

  logger.info(`Queued ${pendingPayouts.length} pending payouts for processing.`);
};

module.exports = payoutQueue;
