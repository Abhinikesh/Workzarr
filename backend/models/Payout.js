const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Provider', 
    required: true, 
    index: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending', 
    index: true 
  },
  method: { 
    type: String, 
    enum: ['bank_transfer', 'upi'], 
    required: true 
  },
  payoutAccountId: { 
    type: String // Razorpay Fund Account ID
  },
  referenceId: { 
    type: String, 
    index: true // Payout ID from Razorpay
  },
  utr: { 
    type: String // Unique Transaction Reference from bank
  },
  failureReason: { 
    type: String 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payout', payoutSchema);
