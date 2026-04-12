const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  features: {
    type: [String]
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

subscriptionSchema.index({ provider: 1, isActive: 1 });

subscriptionSchema.post('save', async function() {
  const providerId = this.provider;
  
  await mongoose.model('Provider').findByIdAndUpdate(providerId, {
    'subscription.plan': this.plan,
    'subscription.startDate': this.startDate,
    'subscription.endDate': this.endDate,
    'subscription.isActive': this.isActive
  });
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
