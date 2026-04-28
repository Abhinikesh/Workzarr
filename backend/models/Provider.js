const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profileImage: {
    type: String
  },
  gallery: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 6 images']
  },
  documents: [{
    docType: {
      type: String,
      enum: ['aadhaar', 'certificate', 'photo'],
      required: true
    },
    url: { type: String, required: true },
    publicId: { type: String },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  location: {
    town: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { 
      type: String,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit PIN code'] 
    },
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
  serviceRadius: {
    type: Number,
    default: 10,
    min: [1, 'Service radius must be at least 1 km']
  },
  pricing: {
    basePrice: { type: Number, required: true, min: [0, 'Base price cannot be negative'] },
    priceUnit: {
      type: String,
      enum: ['per_hour', 'per_job', 'negotiable'],
      required: true
    },
    description: { type: String, maxlength: [200, 'Pricing description is too long'] }
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    schedule: [{
      day: { type: Number, min: 0, max: 6, required: true },
      startTime: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/, default: "09:00" },
      endTime: { type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/, default: "18:00" },
      isOff: { type: Boolean, default: false }
    }]
  },
  rating: {
    average: { type: Number, default: 0.0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    breakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  stats: {
    totalJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    cancelledJobs: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false }
  },
  leadBalance: {
    type: Number,
    default: 0
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  rank: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

function arrayLimit(val) {
  return val.length <= 6;
}

providerSchema.index({ category: 1 });
providerSchema.index({ 'location.coordinates': '2dsphere' });
providerSchema.index({ rank: -1 });

providerSchema.pre('save', function(next) {
  let computedRank = 0;
  const avgRating = this.rating.average || 0;
  const completedJobs = this.stats.completedJobs || 0;

  computedRank += avgRating * 10;
  computedRank += Math.min(completedJobs, 100) * 0.5;
  
  if (this.subscription.isActive && this.subscription.plan === 'premium') {
    computedRank += 50;
  }
  
  // Clamp rank between 0 and 100
  this.rank = Math.min(Math.max(computedRank, 0), 100);
  next();
});

const Provider = mongoose.model('Provider', providerSchema);
module.exports = Provider;
