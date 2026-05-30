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

  const latF = parseFloat(lat);
  const lngF = parseFloat(lng);

  if (isNaN(latF) || isNaN(lngF)) {
    throw ApiError.badRequest('Valid lat and lng coordinates are required.');
  }

  const latKey  = latF.toFixed(3);
  const lngKey  = lngF.toFixed(3);
  const pageNum  = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip     = (pageNum - 1) * limitNum;

  const cacheKey = `search:${latKey}:${lngKey}:${radius}:${categoryId || 'all'}:${sortBy}:${pageNum}`;

  // ── 1. Try Redis cache (failure-safe) ──────────────────────────────────────
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Search cache hit', { cacheKey });
      const payload = JSON.parse(cached);
      return ApiResponse.paginated(
        res, 'Providers fetched.',
        { providers: payload.providers || [] },
        payload.pagination
      );
    }
  } catch (cacheReadErr) {
    logger.warn('Redis cache read failed, proceeding without cache', { error: cacheReadErr.message });
  }

  // ── 2. Build base match query ──────────────────────────────────────────────
  const baseQuery = {
    isActive:   true,
    isVerified: true,
    ...(categoryId && mongoose.Types.ObjectId.isValid(categoryId)
      ? { category: new mongoose.Types.ObjectId(categoryId) }
      : {}),
    ...(isAvailable !== undefined
      ? { 'availability.isAvailable': isAvailable === true || isAvailable === 'true' }
      : {}),
    ...(minRating ? { 'rating.average': { $gte: parseFloat(minRating) } } : {}),
    ...(maxPrice  ? { 'pricing.basePrice': { $lte: parseFloat(maxPrice) } } : {})
  };

  let providers = [];
  let total     = 0;

  // ── 3. Geo aggregation (with fallback) ────────────────────────────────────
  const geoSortStage = (() => {
    switch (sortBy) {
      case 'rating':   return { relevanceScore: -1, 'rating.average': -1 };
      case 'price':    return { 'pricing.basePrice': 1, relevanceScore: -1 };
      case 'distance': return { distance: 1 };
      default:         return { relevanceScore: -1 };
    }
  })();

  try {
    const geoPipeline = [
      {
        $geoNear: {
          near:          { type: 'Point', coordinates: [lngF, latF] },
          distanceField: 'distance',
          maxDistance:   parseFloat(radius) * 1000,
          spherical:     true,
          query:         baseQuery
        }
      },
      // ── Lookup category ──
      {
        $lookup: {
          from:         'categories',
          localField:   'category',
          foreignField: '_id',
          as:           'category'
        }
      },
      // preserveNullAndEmptyArrays keeps providers whose category doc was deleted
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      // ── Lookup user ──
      {
        $lookup: {
          from:         'users',
          localField:   'userId',
          foreignField: '_id',
          as:           'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      // ── Compute relevanceScore & distanceKm ──
      {
        $addFields: {
          distanceKm: { $divide: ['$distance', 1000] },
          relevanceScore: {
            $add: [
              { $multiply: [{ $ifNull: ['$rating.average',      0] }, 20]  },
              { $multiply: [{ $ifNull: ['$stats.completedJobs', 0] }, 0.1] },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$subscription.plan',     'premium'] },
                      { $eq: ['$subscription.isActive', true]      }
                    ]
                  },
                  30, 0
                ]
              },
              { $cond: [{ $eq: ['$isVerified', true] }, 20, 0] },
              {
                $multiply: [
                  { $max: [{ $subtract: [50, { $divide: ['$distance', 1000] }] }, 0] },
                  0.5
                ]
              }
            ]
          }
        }
      },
      { $sort: geoSortStage },
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

    const [result] = await Provider.aggregate(geoPipeline);
    total     = result?.metadata?.[0]?.total ?? 0;
    providers = result?.providers ?? [];

  } catch (geoErr) {
    // ── Fallback: plain .find() when $geoNear fails (e.g. index not ready) ──
    logger.warn('Geo search failed — falling back to basic query', { error: geoErr.message });

    const fallbackSort = sortBy === 'price'  ? { 'pricing.basePrice': 1 }
                       : sortBy === 'rating' ? { 'rating.average': -1 }
                       : { rank: -1 };

    [providers, total] = await Promise.all([
      Provider.find(baseQuery)
        .sort(fallbackSort)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name icon slug')
        .populate('userId',   'name avatar')
        .select('businessName profileImage category userId rating pricing availability isVerified subscription rank')
        .lean(),
      Provider.countDocuments(baseQuery)
    ]);

    // Normalise shape to match geo pipeline output
    providers = providers.map(p => ({ ...p, user: p.userId, distanceKm: null }));
  }

  const pagination = {
    currentPage: pageNum,
    totalPages:  Math.ceil(total / limitNum) || 0,
    totalItems:  total,
    limit:       limitNum
  };

  // ── 4. Cache result (failure-safe) ────────────────────────────────────────
  try {
    await redisClient.set(
      cacheKey,
      JSON.stringify({ providers, pagination }),
      'EX', SEARCH_CACHE_TTL
    );
  } catch (cacheWriteErr) {
    logger.warn('Redis cache write failed', { error: cacheWriteErr.message });
  }

  return ApiResponse.paginated(res, 'Providers fetched.', { providers }, pagination);
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

  await redisClient.set(cacheKey, JSON.stringify(payload), 'EX', PROVIDER_CACHE_TTL);

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
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from:         'users',
        localField:   'userId',
        foreignField: '_id',
        as:           'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
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

  await redisClient.set(cacheKey, JSON.stringify({ providers }), 'EX', TOP_CACHE_TTL);

  return ApiResponse.success(res, 200, 'Top providers fetched.', { providers });
});

module.exports = {
  searchProviders,
  getProviderById,
  getProviderStats,
  getTopProvidersByCategory
};
