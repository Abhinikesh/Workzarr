const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  commission: {
    type: Number,
    required: true,
    min: [0, 'Commission cannot be negative']
  },
  providerAmount: {
    type: Number,
    required: true,
    min: [0, 'Provider amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['cash', 'upi', 'card', 'wallet'],
    required: true
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'manual'],
    required: true
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  status: {
    type: String,
    enum: ['initiated', 'captured', 'failed', 'refunded'],
    default: 'initiated'
  },
  refundId: { type: String },
  refundAmount: { type: Number, min: 0 },
  refundReason: { type: String },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

paymentSchema.index({ booking: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
