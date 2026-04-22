'use strict';

const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const redisClient = require('../config/redis');
const RAZORPAY_CONFIG = require('../config/razorpay.config');
const logger = require('../utils/logger');

// ─── COMMISSION RULES ─────────────────────────────────────────────────────────
const COMMISSION_RULES = RAZORPAY_CONFIG.COMMISSION_RATES;

// ─── 1. calculateCommission ───────────────────────────────────────────────────
const calculateCommission = (booking, provider) => {
  let commissionRate = COMMISSION_RULES.default;
  let appliedRule = 'default';

  // Check provider stats for "new_provider" rule
  if (provider.stats && provider.stats.completedJobs < 10) {
    commissionRate = COMMISSION_RULES.new_provider;
    appliedRule = 'new_provider';
  }
  // Check subscription plan
  else if (provider.subscriptionPlan === 'premium') {
    commissionRate = COMMISSION_RULES.premium;
    appliedRule = 'premium_provider';
  }
  // Check high value booking
  else if (booking.price > COMMISSION_RULES.high_value_threshold) {
    commissionRate = COMMISSION_RULES.high_value;
    appliedRule = 'high_value';
  }

  const commissionAmount = booking.price * commissionRate;
  const providerEarning = booking.price - commissionAmount;

  return {
    commissionRate,
    commissionAmount,
    providerEarning,
    appliedRule
  };
};

// ─── 2. recordCommission ──────────────────────────────────────────────────────
const recordCommission = async (bookingId, commissionData) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    booking.commission = commissionData.commissionAmount;
    booking.providerEarning = commissionData.providerEarning;
    await booking.save();

    // Update Platform Revenue Tracker in Redis
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    await Promise.all([
      redisClient.incrByFloat('platform:revenue:total', commissionData.commissionAmount),
      redisClient.incrByFloat(`platform:revenue:${monthKey}`, commissionData.commissionAmount)
    ]);

    logger.info('Commission recorded', { bookingId, commissionAmount: commissionData.commissionAmount });
  } catch (err) {
    logger.error('recordCommission error', { bookingId, error: err.message });
  }
};

// ─── 3. getCommissionSummary ──────────────────────────────────────────────────
const getCommissionSummary = async (startDate, endDate) => {
  const query = { status: 'captured' };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const payments = await Payment.find(query).select('commission method');
  
  let totalCommission = 0;
  const breakdown = { cash: 0, upi: 0, card: 0 };

  payments.forEach(p => {
    totalCommission += p.commission;
    if (breakdown[p.method] !== undefined) {
      breakdown[p.method] += p.commission;
    }
  });

  return {
    totalCommission,
    breakdown,
    transactionCount: payments.length
  };
};

// ─── 4. recalculateProviderCommissions ────────────────────────────────────────
const recalculateProviderCommissions = async (providerId) => {
  // Only applies to FUTURE pending/accepted bookings.
  // Captured payments are immutable.
  try {
    const bookings = await Booking.find({
      provider: providerId,
      status: { $in: ['pending', 'accepted'] }
    });

    const Provider = require('../models/Provider');
    const provider = await Provider.findById(providerId);

    if (!provider) return;

    for (const booking of bookings) {
      const calc = calculateCommission(booking, provider);
      booking.commission = calc.commissionAmount;
      booking.providerEarning = calc.providerEarning;
      await booking.save();
    }

    logger.info('Provider future commissions recalculated', { providerId, updatedCount: bookings.length });
  } catch (err) {
    logger.error('recalculateProviderCommissions error', { providerId, error: err.message });
  }
};

module.exports = {
  COMMISSION_RULES,
  calculateCommission,
  recordCommission,
  getCommissionSummary,
  recalculateProviderCommissions
};
