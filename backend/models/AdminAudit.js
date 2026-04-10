const mongoose = require('mongoose');

const adminAuditSchema = new mongoose.Schema({
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  action: { 
    type: String, 
    required: true, 
    index: true // E.g., 'VERIFY_PROVIDER', 'DELETE_USER', 'REFUND_BOOKING'
  },
  targetModel: { 
    type: String, 
    required: true // E.g., 'Provider', 'Booking'
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  description: { 
    type: String // Optional extra details on the action taken
  },
  ipAddress: { 
    type: String 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminAudit', adminAuditSchema);
