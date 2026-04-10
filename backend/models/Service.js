const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String,
    maxLength: 500
  },
  basePrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  estimatedDuration: { 
    type: Number, 
    required: true // Time in minutes
  },
  iconUrl: { 
    type: String // Optional service specific icon
  },
  isActive: { 
    type: Boolean, 
    default: true, 
    index: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
