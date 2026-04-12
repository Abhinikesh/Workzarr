const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
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
      'pending',
      'accepted',
      'arriving',
      'in_progress',
      'completed',
      'cancelled',
      'no_show'
    ],
    default: 'pending'
  },
  address: {
    fullAddress: { type: String, required: true },
    landmark: { type: String },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  acceptedAt: { type: Date },
  arrivedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledBy: {
    type: String,
    enum: ['customer', 'provider', 'admin']
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  commission: {
    type: Number,
    default: 0
  },
  providerEarning: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  otp: {
    type: String,
    match: [/^\d{4}$/, 'OTP must be exactly 4 digits']
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  customerReviewed: {
    type: Boolean,
    default: false
  },
  providerReviewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ 'address.coordinates': '2dsphere' });

bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    const min = 10000;
    const max = 99999;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    const year = new Date().getFullYear();
    this.bookingId = `BK${year}${randomNum}`;
    
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  }

  if (this.isModified('price') || this.isNew) {
    this.commission = parseFloat((this.price * 0.10).toFixed(2));
    this.providerEarning = parseFloat((this.price - this.commission).toFixed(2));
  }

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
