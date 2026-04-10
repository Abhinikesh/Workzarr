const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    unique: true, 
    default: () => uuidv4().slice(0, 8).toUpperCase(), 
    index: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Provider', 
    index: true 
  },
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',      // Looking for provider
      'accepted',     // Provider accepted
      'in_route',     // Provider traveling
      'in_progress',  // Job started
      'completed',    // Job done
      'cancelled',    // Cancelled by either
      'disputed'      // Raised issue
    ],
    default: 'pending',
    index: true
  },
  scheduledAt: { 
    type: Date, 
    required: true, 
    index: true 
  },
  completedAt: { 
    type: Date 
  },
  location: {
    addressLine: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  amount: {
    baseAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
    index: true
  },
  startOtp: { 
    type: String, // Random 4 digits for provider to start job
    select: false // Hide from generic queries
  },
  cancellationReason: { type: String },
  notes: { type: String, maxLength: 500 }
}, {
  timestamps: true
});

// Geo Index
bookingSchema.index({ 'location.coordinates': '2dsphere' });

// Pre save hook to generate OTP
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.startOtp) {
    this.startOtp = Math.floor(1000 + Math.random() * 9000).toString();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
