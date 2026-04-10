const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['booking', 'payment', 'system', 'promotion'],
    required: true,
    index: true
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    index: true // Could be Booking ID, Payment ID depending on type
  },
  isRead: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  pushSent: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
