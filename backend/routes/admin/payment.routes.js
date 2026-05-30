const express = require('express');
const paymentController = require('../../controllers/admin/payment.controller');
const router = express.Router();

// GET /admin/payments/summary
router.get('/summary', paymentController.getSummary);

// GET /admin/payments/transactions
router.get('/transactions', paymentController.getTransactions);

// GET /admin/payments/payouts
router.get('/payouts', paymentController.getPayouts);

module.exports = router;
