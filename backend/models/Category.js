const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    unique: true, 
    index: true 
  },
  description: { 
    type: String,
    maxLength: 300
  },
  iconUrl: { 
    type: String, 
    required: true // Cloudinary URL
  },
  isActive: { 
    type: Boolean, 
    default: true, 
    index: true 
  },
  basePrice: {
    type: Number,
    default: 0
  },
  order: { 
    type: Number, 
    default: 0 // Used to sort categories on frontend manually
  }
}, {
  timestamps: true
});

// Pre-validate hook to generate slug if missing
categorySchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
