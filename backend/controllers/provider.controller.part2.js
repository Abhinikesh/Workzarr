'use strict';

/**
 * provider.controller.part2.js
 * Functions: searchProviders, getProviderById, getProviderStats, getTopProvidersByCategory
 *
 * This file is required by provider.controller.js — see bottom of that file.
 */

const mongoose     = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError     = require('../utils/ApiError');
const ApiResponse  = require('../utils/ApiResponse');
const logger       = require('../utils/logger');
const redisClient  = require('../config/redis');
const { generateSignedUrl } = require('../utils/cloudinary');

const Provider = require('../models/Provider');
const Review   = require('../models/Review');
const Service  = require('../models/Service');
const Booking  = require('../models/Booking');
const Payout   = require('../models/Payout');

const PROVIDER_CACHE_TTL = 300;
const TOP_CACHE_TTL      = 600;
const SEARCH_CACHE_TTL   = 120;

// ─── 9. searchProviders ───────────────────────────────────────────────────────
const searchProviders = asyncHandler(async (req, res) => {
  const {
    lat, lng, radius = 10, categoryId,
    minRating, maxPrice, isAvailable,
    sortBy = 'relevance', page = 1, limit = 10
  } = req.query;

  const latF   = parseFloat(lat);
  const lngF   = parseFloat(lng);
  const latKey = latF.toFixed(3);
  const lngKey = lngF.toFixed(3);

  const cacheKey = `search:${latKey}:${lngKey}:${radius}:${categoryId || 'all'}:${sortBy}:${page}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.info('Search cache hit', { cacheKey });
    const payload = JSON.parse(cached);
    return ApiResponse.paginated(res, 'Providers fetched.', payload.data, payload.pagination);
  }

  logger.info('Search cache miss', { cacheKey });

  const geoQuery = {
    isActive:   true,
    isVerified: true,
    ...(categoryId && mongoose.Types.ObjectId.isValid(categoryId)
      ? { category: new mongoose.Types.ObjectId(categoryId) }
      : {}),
    ...(isAvailable !== undefined ? { 'availability.isAvailable': isAvailable === true || isAvailable === 'true' } : {})
  };

  const sortStage = (() => {
    switch (sortBy) {
      case 'rating':   return { 'rating.average': -1, relevanceScore: -1 };
      case 'price':    return { 'pricing.basePrice': 1, relevanceScore: -1 };
      case 'distance': return { distance: 1, relevanceScore: -1 };
      default:         return { relevanceScore: -1 };
    }
  })();

  const pageNum  = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip     = (pageNum - 1) * limitNum;

  const pipeline = [
    {
      $geoNear: {
        near:          { type: 'Point', coordinates: [lngF, latF] },
        distanceField: 'distance',
        maxDistance:   parseFloat(radius) * 1000,
        spherical:     true,
        query:         geoQuery
      }
    },
    {
      $lookup: {
        from:         'categories',
        localField:   'category',
        foreignField: '_id',
        as:           'category'
      }
    },
    { $unwind: '$category' },
    {
      $lookup: {
        from:         'users',
        localField:   'userId',
        foreignField: '_id',
        as:           'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        ...(minRating ? { 'rating.average': { $gte: parseFloat(minRating) } } : {}),
        ...(maxPrice  ? { 'pricing.basePrice': { $lte: parseFloat(maxPrice) } } : {})
      }
    },
    {
      $addFields: {
        distanceKm: { $divide: ['$distance', 1000] },
        relevanceScore: {
          $add: [
            { $multiply: ['$rating.average', 20] },
            { $multiply: ['$stats.completedJobs', 0.1] },
            { $cond: [{ $and: [{ $eq: ['$subscription.plan', 'premium'] }, '$subscription.isActive'] }, 30, 0] },
            { $cond: ['$isVerified', 20, 0] },
            {
              $multiply: [
                { $subtract: [50, { $divide: ['$distance', 1000] }] },
                0.5
              ]
            }
          ]
        }
      }
    },
    { $sort: sortStage },
    {
      $facet: {
        metadata:  [{ $count: 'total' }],
        providers: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              businessName:               1,
              profileImage:               1,
              'category.name':            1,
              'category.icon':            1,
              'category.slug':            1,
              'user.name':                1,
              'user.avatar':              1,
              'rating.average':           1,
              'rating.count':             1,
              pricing:                    1,
              'availability.isAvailable': 1,
              distanceKm:                 1,
              isVerified:                 1,
              subscriptionPlan:           '$subscription.plan',
              relevanceScore:             1
            }
          }
        ]
      }
    }
  ];

  const [result] = await Provider.aggregate(pipeline);

  const total      = result.metadata[0] ? result.metadata[0].total : 0;
  const providers  = result.providers || [];
  const totalPages = Math.ceil(total / limitNum);

  const pagination = { currentPage: pageNum, totalPages, totalItems: total, limit: limitNum };

  await redisClient.setEx(cacheKey, SEARCH_CACHE_TTL, JSON.stringify({ data: providers, pagination }));

  return ApiResponse.paginated(res, 'Providers fetched.', providers, pagination);
});

// ─── 10. getProviderById ──────────────────────────────────────────────────────
const getProviderById = asyncHandler(async (req, res) => {
  const { providerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(providerId)) {
    throw ApiError.badRequest('Invalid provider ID.');
  }

  const cacheKey = `provider_public:${providerId}`;
  const cached   = await redisClient.get(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return ApiResponse.success(res, 200, 'Provider fetched.', JSON.parse(cached));
  }

  const provider = await Provider.findById(providerId)
    .populate('category', 'name icon slug')
    .populate('userId', 'name avatar')
    .select('-documents -leadBalance -subscription')
    .lean();

  if (!provider || !provider.isActive) {
    throw ApiError.notFound('Provider not found.');
  }

  const [reviews, services] = await Promise.all([
    Review.find({ provider: providerId, isVisible: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name avatar')
      .lean(),
    Service.find({ provider: providerId, isActive: true }).lean()
  ]);

  const payload = { provider, reviews, services };

  await redisClient.setEx(cacheKey, PROVIDER_CACHE_TTL, JSON.stringify(payload));

  return ApiResponse.success(res, 200, 'Provider fetched.', payload);
});

// ─── 11. getProviderStats ─────────────────────────────────────────────────────
const getProviderStats = asyncHandler(async (req, res) => {
  const provider  = req.provider;
  const providerId = provider._id;

  const now       = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [bookingStats, ratingBreakdown, payoutStats, earningsByDay, earningsByMonth] = await Promise.all([

    // Booking aggregations for this month
    Booking.aggregate([
      { $match: { provider: providerId, createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id:       null,
          total:     { $sum: 1 },
          earnings:  { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$providerEarning', 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          pending:   { $sum: { $cond: [{ $eq: ['$status', 'pending'] },   1, 0] } },
          avgResponseMs: {
            $avg: {
              $cond: [
                { $and: ['$acceptedAt', '$createdAt'] },
                { $subtract: ['$acceptedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]),

    // Review rating breakdown
    Review.aggregate([
      { $match: { provider: providerId, isVisible: true } },
      {
        $group: {
          _id:     '$rating',
          count:   { $sum: 1 }
        }
      }
    ]),

    // Payout stats
    Payout.aggregate([
      { $match: { provider: providerId } },
      {
        $group: {
          _id:      '$status',
          totalAmt: { $sum: '$amount' }
        }
      }
    ]),

    // Earnings last 7 days (daily)
    Booking.aggregate([
      {
        $match: {
          provider:    providerId,
          status:      'completed',
          completedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          earnings: { $sum: '$providerEarning' }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Earnings last 6 months (monthly)
    Booking.aggregate([
      {
        $match: {
          provider:    providerId,
          status:      'completed',
          completedAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$completedAt' }
          },
          earnings: { $sum: '$providerEarning' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const bStats = bookingStats[0] || { total: 0, earnings: 0, completed: 0, cancelled: 0, pending: 0, avgResponseMs: 0 };

  const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingBreakdown.forEach(({ _id, count }) => { ratingMap[_id] = count; });

  const payoutMap = { completed: 0, requested: 0, processing: 0 };
  payoutStats.forEach(({ _id, totalAmt }) => { payoutMap[_id] = totalAmt; });

  const statsPayload = {
    thisMonth: {
      totalBookings:     bStats.total,
      totalEarnings:     bStats.earnings,
      completedBookings: bStats.completed,
      cancelledBookings: bStats.cancelled,
      pendingBookings:   bStats.pending,
      completionRate:    bStats.total ? ((bStats.completed / bStats.total) * 100).toFixed(1) : '0.0',
      avgResponseTimeMin: bStats.avgResponseMs ? (bStats.avgResponseMs / 60000).toFixed(1) : null
    },
    ratingBreakdown: ratingMap,
    payouts: {
      totalPaidOut:   payoutMap.completed  || 0,
      pendingAmount:  (payoutMap.requested || 0) + (payoutMap.processing || 0)
    },
    charts: {
      earningsByDay,
      earningsByMonth
    }
  };

  return ApiResponse.success(res, 200, 'Provider stats fetched.', { stats: statsPayload });
});

// ─── 12. getTopProvidersByCategory ────────────────────────────────────────────
const getTopProvidersByCategory = asyncHandler(async (req, res) => {
  const { categoryId, lat, lng, limit: limitQ = 6 } = req.query;

  if (!lat || !lng) throw ApiError.badRequest('lat and lng are required.');

  const latF   = parseFloat(lat);
  const lngF   = parseFloat(lng);
  const latKey = latF.toFixed(3);
  const lngKey = lngF.toFixed(3);

  const cacheKey = `top_providers:${categoryId || 'all'}:${latKey}:${lngKey}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return ApiResponse.success(res, 200, 'Top providers fetched.', JSON.parse(cached));
  }

  const geoQuery = {
    isActive:                     true,
    isVerified:                   true,
    'availability.isAvailable':   true,
    ...(categoryId && mongoose.Types.ObjectId.isValid(categoryId)
      ? { category: new mongoose.Types.ObjectId(categoryId) }
      : {})
  };

  const providers = await Provider.aggregate([
    {
      $geoNear: {
        near:          { type: 'Point', coordinates: [lngF, latF] },
        distanceField: 'distance',
        maxDistance:   20000,
        spherical:     true,
        query:         geoQuery
      }
    },
    { $sort: { rank: -1 } },
    { $limit: parseInt(limitQ, 10) },
    {
      $lookup: {
        from:         'categories',
        localField:   'category',
        foreignField: '_id',
        as:           'category'
      }
    },
    { $unwind: { path: '$category', preserveNullAndEmpty: true } },
    {
      $lookup: {
        from:         'users',
        localField:   'userId',
        foreignField: '_id',
        as:           'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmpty: true } },
    {
      $project: {
        businessName:               1,
        profileImage:               1,
        'category.name':            1,
        'category.icon':            1,
        'category.slug':            1,
        'user.name':                1,
        'user.avatar':              1,
        'rating.average':           1,
        'rating.count':             1,
        'pricing.basePrice':        1,
        'pricing.priceUnit':        1,
        'availability.isAvailable': 1,
        isVerified:                 1,
        rank:                       1,
        distanceKm: { $divide: ['$distance', 1000] }
      }
    }
  ]);

  await redisClient.setEx(cacheKey, TOP_CACHE_TTL, JSON.stringify({ providers }));

  return ApiResponse.success(res, 200, 'Top providers fetched.', { providers });
});

module.exports = {
  searchProviders,
  getProviderById,
  getProviderStats,
  getTopProvidersByCategory
};
