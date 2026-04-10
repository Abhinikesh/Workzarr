const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Provider', 
    required: true, 
    index: true 
  },
  planName: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  durationDays: { 
    type: Number, 
    required: true 
  },
  startDate: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true, 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'], 
    default: 'active', 
    index: true 
  },
  razorpaySubscriptionId: { 
    type: String, 
    sparse: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to dynamically check if it's currently valid relative to real time
subscriptionSchema.virtual('isValid').get(function() {
  return this.status === 'active' && this.endDate > new Date();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
