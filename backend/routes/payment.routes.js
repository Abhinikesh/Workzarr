'use strict';

const express = require('express');
const ctrl = require('../controllers/payment.controller');
const { protect, restrictTo, providerOnly } = require('../middleware/auth.middleware');
const rawBodyMiddleware = require('../middleware/rawBody.middleware');
const {
  validate,
  createOrderSchema,
  verifyPaymentSchema,
  requestPayoutSchema,
  subscriptionPurchaseSchema
} = require('../validators/payment.validator');

const router = express.Router();

// ─── Webhook (Must use raw body, so no express.json() here) ───────────────────
// Note: In app.js, this specific route must be mounted before global express.json()
// We'll configure app.js to do: app.use('/api/v1/payments/webhook', rawBodyMiddleware, ctrl.handleWebhook);
// But for completeness in the router if mounted directly:
router.post('/webhook', rawBodyMiddleware, ctrl.handleWebhook);

// ─── Customer Routes ──────────────────────────────────────────────────────────
router.post(
  '/create-order',
  protect,
  restrictTo('customer'),
  validate(createOrderSchema),
  ctrl.createPaymentOrder
);

router.post(
  '/verify',
  protect,
  restrictTo('customer'),
  validate(verifyPaymentSchema),
  ctrl.verifyAndCapturePayment
);

// ─── Provider Routes ──────────────────────────────────────────────────────────
router.post(
  '/payout/request',
  protect,
  providerOnly,
  validate(requestPayoutSchema),
  ctrl.requestPayout
);

router.get(
  '/payout/history',
  protect,
  providerOnly,
  ctrl.getPayoutHistory
);

router.get(
  '/earnings',
  protect,
  providerOnly,
  ctrl.getEarningsSummary
);

router.post(
  '/subscription/create',
  protect,
  providerOnly,
  validate(subscriptionPurchaseSchema),
  ctrl.purchaseSubscription
);

router.post(
  '/subscription/verify',
  protect,
  providerOnly,
  validate(verifyPaymentSchema),
  ctrl.verifySubscriptionPayment
);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get(
  '/admin/all',
  protect,
  restrictTo('admin'),
  ctrl.adminGetAllPayments
);

router.post(
  '/admin/payout/:payoutId',
  protect,
  restrictTo('admin'),
  ctrl.adminProcessPayout
);

router.get(
  '/admin/analytics',
  protect,
  restrictTo('admin'),
  ctrl.adminGetRevenueAnalytics
);

module.exports = router;
