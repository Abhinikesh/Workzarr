const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be greater than zero']
  },
  method: {
    type: String,
    enum: ['upi', 'bank_transfer'],
    required: true
  },
  upiId: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.method === 'upi' && (!v || v.trim().length === 0)) {
          return false;
        }
        return true;
      },
      message: 'UPI ID is required when method is upi'
    }
  },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true },
    accountHolderName: { type: String, trim: true }
  },
  status: {
    type: String,
    enum: ['requested', 'processing', 'completed', 'failed'],
    default: 'requested'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: { type: Date },
  transactionRef: { type: String },
  failureReason: { type: String },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

payoutSchema.pre('validate', function(next) {
  if (this.method === 'bank_transfer') {
    const { bankDetails } = this;
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.accountHolderName) {
      this.invalidate('bankDetails', 'Bank details are required when method is bank_transfer');
    }
  }
  next();
});

const Payout = mongoose.model('Payout', payoutSchema);
module.exports = Payout;
