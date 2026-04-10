const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true, 
    unique: true // One review per booking
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Provider', 
    required: true, 
    index: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    trim: true, 
    maxLength: 500 
  }
}, {
  timestamps: true
});

// Post-save hook to update provider average rating
reviewSchema.post('save', async function() {
  const Provider = mongoose.model('Provider');
  
  // Aggregate reviews for this provider
  const result = await this.constructor.aggregate([
    { $match: { provider: this.provider } },
    { 
      $group: { 
        _id: '$provider', 
        average: { $avg: '$rating' }, 
        count: { $sum: 1 } 
      } 
    }
  ]);
  
  if (result.length > 0) {
    await Provider.findByIdAndUpdate(this.provider, {
      'rating.average': Number(result[0].average.toFixed(1)),
      'rating.count': result[0].count
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
