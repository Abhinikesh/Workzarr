const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },
  otp: {
    type: String,
    required: [true, 'OTP hash is required']
  },
  purpose: {
    type: String,
    enum: ['login', 'register', 'reset'],
    required: [true, 'Purpose is required']
  },
  attempts: {
    type: Number,
    default: 0,
    max: [5, 'Maximum attempts reached']
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000)
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.pre('save', async function(next) {
  if (this.isModified('otp')) {
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

otpSchema.methods.verifyOTP = async function(inputOtp) {
  return await bcrypt.compare(inputOtp, this.otp);
};

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
