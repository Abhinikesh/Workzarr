const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String, 
    default: '' 
  },
  email: { 
    type: String, 
    sparse: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    select: false // Admin logins etc
  },
  role: { 
    type: String, 
    enum: ['customer', 'provider', 'admin'], 
    default: 'customer', 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'banned', 'deleted'], 
    default: 'active' 
  },
  profilePicture: { 
    type: String, 
    default: '' 
  },
  pushToken: { 
    type: String, 
    default: '' 
  },
  savedAddresses: [{
    label: { type: String, enum: ['home', 'work', 'other'], default: 'other' },
    addressLine: { type: String },
    city: { type: String },
    pincode: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create 2dsphere index for location-based search among addresses if needed
userSchema.index({ 'savedAddresses.location': '2dsphere' });

// Pre-save hook to hash password (if using passwords for admin login)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to verify password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
