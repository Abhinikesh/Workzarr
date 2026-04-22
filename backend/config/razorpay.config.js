'use strict';

const RAZORPAY_CONFIG = {
  currency: 'INR',
  
  SUBSCRIPTION_PRICING: {
    premium: {
      monthly:   { price: 499,  days: 30,  label: '1 Month' },
      quarterly: { price: 1299, days: 90,  label: '3 Months' },
      yearly:    { price: 4799, days: 365, label: '1 Year' }
    }
  },

  COMMISSION_RATES: {
    default:       0.10,
    premium:       0.08,
    new_provider:  0.05,
    high_value:    0.07,
    high_value_threshold: 2000
  },

  PAYOUT_CONFIG: {
    minimumAmount:     100,
    processingTime:    '24 hours',
    batchTime:         '10:00 AM daily',
    maxPayoutsPerDay:  1
  },

  REFUND_POLICY: {
    fullRefundMinutes:    60,
    partialRefundMinutes: 30,
    partialRefundPercent: 50,
    noRefundMinutes:      0
  },

  WEBHOOK_EVENTS: [
    'payment.captured',
    'payment.failed',
    'refund.processed',
    'payout.processed',
    'payout.failed'
  ]
};

module.exports = RAZORPAY_CONFIG;
