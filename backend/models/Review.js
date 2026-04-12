const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  images: {
    type: [String],
    validate: [(val) => val.length <= 3, '{PATH} exceeds the limit of 3 images']
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  providerReply: {
    text: { type: String, maxlength: [500, 'Reply cannot exceed 500 characters'] },
    repliedAt: { type: Date }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.index({ provider: 1, isVisible: 1 });
reviewSchema.index({ customer: 1 });

reviewSchema.post('save', async function() {
  const providerId = this.provider;
  
  const stats = await this.constructor.aggregate([
    { $match: { provider: providerId, isVisible: true } },
    {
      $group: {
        _id: '$provider',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Provider').findByIdAndUpdate(providerId, {
      rating: {
        average: parseFloat(stats[0].averageRating.toFixed(1)),
        count: stats[0].totalReviews,
        breakdown: {
          1: stats[0].rating1,
          2: stats[0].rating2,
          3: stats[0].rating3,
          4: stats[0].rating4,
          5: stats[0].rating5
        }
      }
    });
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
