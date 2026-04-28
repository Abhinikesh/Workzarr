'use strict';

const redisClient = require('../config/redis');
const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const ApiError = require('./ApiError');
const logger = require('./logger');

// ─── 1. getWalletBalance ──────────────────────────────────────────────────────
const getWalletBalance = async (providerId) => {
  const cacheKey = `wallet:${providerId}`;
  
  // Try caching layer first
  const cachedStr = await redisClient.get(cacheKey);
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr);
      return cached;
    } catch (e) {
      // Ignore parse error and fall back to DB
    }
  }

  // Calculate from DB
  // totalEarnings: SUM of Payment.providerAmount where status="captured" & payee=providerId
  const earningsAgg = await Payment.aggregate([
    { $match: { payee: providerId, status: 'captured' } },
    { $group: { _id: null, total: { $sum: '$providerAmount' } } }
  ]);
  const totalEarnings = earningsAgg[0] ? earningsAgg[0].total : 0;

  // Paid out + Processing payouts
  const payoutsAgg = await Payout.aggregate([
    { $match: { provider: providerId, status: { $in: ['completed', 'processing', 'requested'] } } },
    { $group: {
        _id: '$status',
        total: { $sum: '$amount' }
      }
    }
  ]);

  let totalPaidOut = 0;
  let processingAmount = 0;

  payoutsAgg.forEach(p => {
    if (p._id === 'completed') totalPaidOut += p.total;
    if (p._id === 'processing' || p._id === 'requested') processingAmount += p.total;
  });

  const availableBalance = totalEarnings - totalPaidOut - processingAmount;

  const result = {
    totalEarnings,
    totalPaidOut,
    processingAmount,
    availableBalance
  };

  // Cache in Redis TTL 5 min
  try {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
  } catch (err) {
    logger.warn('Redis wallet cache set failed', { error: err.message });
  }

  return result;
};

// ─── 2. creditWallet ──────────────────────────────────────────────────────────
const creditWallet = async (providerId, amount, bookingId) => {
  try {
    const cacheKey = `wallet:${providerId}`;
    
    // Invalidate cache
    try {
      await redisClient.del(cacheKey);
    } catch (err) {
      logger.warn('Redis wallet cache delete failed', { error: err.message });
    }

    logger.info('Wallet credited', { providerId, amount, bookingId });
    return await getWalletBalance(providerId);
  } catch (err) {
    logger.error('creditWallet error', { error: err.message, providerId });
    throw ApiError.internal('Failed to update wallet balance');
  }
};

// ─── 3. debitWallet ───────────────────────────────────────────────────────────
const debitWallet = async (providerId, amount, payoutId) => {
  try {
    const cacheKey = `wallet:${providerId}`;
    const lockKey = `wallet_debit_lock:${providerId}`;

    // 1. Atomic Balance Check & Hold in Redis
    // In a production app, we might use a Lua script here for pure atomicity across DB+Redis
    // But since the source of truth is DB, we use a Redis lock during the DB check.
    
    const locked = await redisClient.set(lockKey, 'LOCKED', { NX: true, EX: 10 });
    if (!locked) throw ApiError.conflict('A wallet operation is already in progress. Please try again.');

    try {
      const current = await getWalletBalance(providerId);
      if (current.availableBalance < amount) {
        throw ApiError.badRequest('Insufficient balance for this payout.');
      }

      // Invalidate cache
      await redisClient.del(cacheKey);
    } finally {
      await redisClient.del(lockKey);
    }

    logger.info('Wallet debited', { providerId, amount, payoutId });
    return await getWalletBalance(providerId);
  } catch (err) {
    logger.error('debitWallet error', { error: err.message, providerId });
    if (err instanceof ApiError) throw err;
    throw ApiError.internal('Failed to update wallet balance');
  }
};

// ─── 4. lockPayoutAmount ──────────────────────────────────────────────────────
const lockPayoutAmount = async (providerId, amount) => {
  const lockKey = `wallet_lock:${providerId}:${amount}`;
  const locked = await redisClient.set(lockKey, 'LOCKED', { NX: true, EX: 1800 }); // TTL 30 mins
  
  if (!locked) {
    throw ApiError.conflict('A payout for this amount is already being processed.');
  }
  return true;
};

// ─── 5. unlockPayoutAmount ────────────────────────────────────────────────────
const unlockPayoutAmount = async (providerId, amount) => {
  const lockKey = `wallet_lock:${providerId}:${amount}`;
  await redisClient.del(lockKey);
};

// ─── 6. getWalletTransactions ─────────────────────────────────────────────────
const getWalletTransactions = async (providerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // We fetch Payments (Credits) and Payouts (Debits) and combine them.
  // In a truly production system at scale, you'd maintain a unified Ledger collection.
  // Here we simulate it by fetching both and merging in-memory for the paginated window.
  
  const [payments, payouts] = await Promise.all([
    Payment.find({ payee: providerId, status: 'captured' }).lean(),
    Payout.find({ provider: providerId }).lean()
  ]);

  const transactions = [];

  payments.forEach(p => {
    transactions.push({
      type: 'credit',
      amount: p.providerAmount,
      reference: p.razorpayPaymentId || p._id,
      description: `Payment received for booking`,
      status: p.status,
      date: p.createdAt
    });
  });

  payouts.forEach(p => {
    transactions.push({
      type: 'debit',
      amount: p.amount,
      reference: p.transactionRef || p._id,
      description: `Payout to ${p.method}`,
      status: p.status,
      date: p.createdAt
    });
  });

  // Sort descending by date
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  const paginated = transactions.slice(skip, skip + limit);

  return {
    transactions: paginated,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(transactions.length / limit),
      totalItems: transactions.length,
      limit
    }
  };
};

module.exports = {
  getWalletBalance,
  creditWallet,
  debitWallet,
  lockPayoutAmount,
  unlockPayoutAmount,
  getWalletTransactions
};
