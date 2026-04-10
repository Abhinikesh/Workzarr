const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  bio: { 
    type: String, 
    maxLength: 500,
    trim: true
  },
  experienceYears: { 
    type: Number, 
    default: 0 
  },
  servicesOffered: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service' 
  }],
  aadhaarNumber: { 
    type: String, 
    unique: true, 
    sparse: true, 
    select: false // Keep sensitive info hidden by default
  },
  documents: [{
    title: { type: String, required: true }, // E.g., 'Aadhaar Card', 'Trade Certificate'
    url: { type: String, required: true }, // Cloudinary URL
    isVerified: { type: Boolean, default: false }
  }],
  isVerified: { 
    type: Boolean, 
    default: false, 
    index: true // Overall provider KYC status
  },
  availability: {
    isOnline: { type: Boolean, default: false, index: true },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
  },
  wallet: {
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  bankDetails: {
    accountNumber: { type: String, select: false },
    ifscCode: { type: String, select: false },
    bankName: { type: String },
    upiId: { type: String, select: false }
  },
  rating: {
    average: { type: Number, default: 0, index: true },
    count: { type: Number, default: 0 }
  },
  activeSubscription: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscription' 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// GeoJSON Index for finding nearby providers
providerSchema.index({ 'availability.currentLocation': '2dsphere' });

module.exports = mongoose.model('Provider', providerSchema);
