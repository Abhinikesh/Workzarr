const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true, 
    index: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Provider' 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'INR' 
  },
  method: { 
    type: String, 
    enum: ['upi', 'card', 'netbanking', 'cash'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending', 
    index: true 
  },
  razorpayOrderId: { 
    type: String, 
    index: true, 
    sparse: true 
  },
  razorpayPaymentId: { 
    type: String, 
    index: true, 
    sparse: true 
  },
  razorpaySignature: { 
    type: String 
  },
  errorDetails: { 
    type: String 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
