'use strict';

const asyncHandler = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const { emitToProvider } = require('../socket/socket');
const { sendNotification } = require('../utils/notification');
const { uploadToCloudinary, TRANSFORMATIONS } = require('../utils/cloudinary');

// ─── 1. createReview ──────────────────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, title, comment } = req.body;
  const customerId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    throw ApiError.badRequest('Rating must be between 1 and 5.');
  }

  const booking = await Booking.findById(bookingId).populate('provider', 'businessName userId');
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (booking.customer.toString() !== customerId.toString()) {
    throw ApiError.forbidden('You can only review your own bookings.');
  }
  if (booking.status !== 'completed') {
    throw ApiError.badRequest('You can only review completed bookings.');
  }
  if (booking.customerReviewed) {
    throw ApiError.conflict('You have already reviewed this booking.');
  }

  // Handle optional image uploads
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    if (req.files.length > 3) throw ApiError.badRequest('Maximum 3 images allowed for a review.');
    
    const uploads = await Promise.all(
      req.files.map(file => 
        uploadToCloudinary(file.buffer, {
          folder: `localserve/reviews/${booking._id}`,
          transformation: TRANSFORMATIONS.GALLERY,
          resource_type: 'image'
        })
      )
    );
    imageUrls = uploads.map(u => u.url);
  }

  const review = await Review.create({
    booking: booking._id,
    customer: customerId,
    provider: booking.provider._id,
    rating,
    title: title ? title.trim() : undefined,
    comment: comment ? comment.trim() : undefined,
    images: imageUrls
  });

  booking.customerReviewed = true;
  await booking.save();

  // Update Provider rating mathematically
  const provider = await Provider.findById(booking.provider._id).select('rating');
  const oldAvg = provider.rating.average;
  const oldCount = provider.rating.count;
  
  const newAvg = ((oldAvg * oldCount) + Number(rating)) / (oldCount + 1);
  
  provider.rating.average = Number(newAvg.toFixed(1));
  provider.rating.count = oldCount + 1;
  provider.rating.breakdown[rating] = (provider.rating.breakdown[rating] || 0) + 1;
  await provider.save();

  // Recompute rank (import logic or call agenda to do it, but simple math here is fine too)
  const { agenda } = require('../jobs/providerRankJob');
  if (agenda) {
    await agenda.now('update-provider-ranks'); // Triggers the nightly rank job immediately for this or globally
  }

  // Notify Provider
  emitToProvider(booking.provider._id, 'review:new', {
    reviewId: review._id,
    rating,
    title,
    customerName: req.user.name
  });

  await sendNotification({
    providerId: booking.provider._id,
    type: 'new_review',
    title: 'New Review Received!',
    body: `${req.user.name} left you a ${rating}-star review.`,
    data: { reviewId: review._id }
  });

  logger.info('Review created', { reviewId: review._id, bookingId: booking._id, rating });
  return ApiResponse.success(res, 201, 'Review submitted successfully.', { review });
});

// ─── 2. getProviderReviews ────────────────────────────────────────────────────
const getProviderReviews = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { rating, page = 1, limit = 10 } = req.query;

  const query = { provider: providerId, isVisible: true };
  if (rating) query.rating = parseInt(rating, 10);

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total, providerData] = await Promise.all([
    Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name avatar')
      .lean(),
    Review.countDocuments(query),
    Provider.findById(providerId).select('rating').lean()
  ]);

  const summary = providerData ? providerData.rating : null;

  const pagination = {
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalItems: total,
    limit: limitNum
  };

  return ApiResponse.success(res, 200, 'Reviews fetched.', { summary, reviews, pagination });
});

// ─── 3. replyToReview ─────────────────────────────────────────────────────────
const replyToReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const providerId = req.provider._id;

  if (!reply || reply.length > 300) {
    throw ApiError.badRequest('Reply is required and must be under 300 characters.');
  }

  const review = await Review.findOne({ _id: reviewId, provider: providerId });
  if (!review) throw ApiError.notFound('Review not found or does not belong to you.');
  if (review.providerReply) throw ApiError.conflict('You have already replied to this review.');

  review.providerReply = {
    text: reply.trim(),
    repliedAt: new Date()
  };
  await review.save();

  logger.info('Review replied', { reviewId: review._id, providerId });
  return ApiResponse.success(res, 200, 'Reply posted successfully.', { review });
});

// ─── 4. adminToggleReviewVisibility ───────────────────────────────────────────
const adminToggleReviewVisibility = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found.');

  review.isVisible = !review.isVisible;
  await review.save();

  // Optionally recalculate provider average here by running an aggregation
  // For production, if hidden, it should ideally deduct from the average.
  if (!review.isVisible) {
    const provider = await Provider.findById(review.provider);
    if (provider && provider.rating.count > 0) {
      const oldTotal = provider.rating.average * provider.rating.count;
      provider.rating.count -= 1;
      provider.rating.average = provider.rating.count === 0 ? 0 : Number(((oldTotal - review.rating) / provider.rating.count).toFixed(1));
      provider.rating.breakdown[review.rating] = Math.max(0, provider.rating.breakdown[review.rating] - 1);
      await provider.save();
    }
  } else {
    const provider = await Provider.findById(review.provider);
    if (provider) {
      const oldTotal = provider.rating.average * provider.rating.count;
      provider.rating.count += 1;
      provider.rating.average = Number(((oldTotal + review.rating) / provider.rating.count).toFixed(1));
      provider.rating.breakdown[review.rating] += 1;
      await provider.save();
    }
  }

  return ApiResponse.success(res, 200, `Review visibility toggled.`, { review });
});

// ─── 5. getMyReviews ──────────────────────────────────────────────────────────
const getMyReviews = asyncHandler(async (req, res) => {
  const providerId = req.provider._id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find({ provider: providerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('customer', 'name avatar')
      .populate('booking', 'bookingId service')
      .lean(),
    Review.countDocuments({ provider: providerId })
  ]);

  const pagination = {
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
    totalItems: total,
    limit: limitNum
  };

  return ApiResponse.success(res, 200, 'Your reviews fetched.', { reviews, pagination });
});

module.exports = {
  createReview,
  getProviderReviews,
  replyToReview,
  adminToggleReviewVisibility,
  getMyReviews
};
