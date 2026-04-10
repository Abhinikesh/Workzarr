const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    index: true 
  },
  otp: { 
    type: String, 
    required: true // We can optionally hash it if we want extra security
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: { expires: 0 } // TTL index: document deletes itself when time hits expiresAt
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OTP', otpSchema);
