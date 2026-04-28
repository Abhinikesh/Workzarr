const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Category = require('../../models/Category');
const Provider = require('../../models/Provider');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const { logAdminAction } = require('../../utils/adminHelpers');
const redisClient = require('../../config/redis');

exports.reorderCategories = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{ id, displayOrder }]
  if (!Array.isArray(order)) throw new ApiError(400, 'Order must be an array');

  const bulkOps = order.map(item => ({
    updateOne: {
      filter: { _id: item.id },
      update: { displayOrder: item.displayOrder }
    }
  }));

  await Category.bulkWrite(bulkOps);
  
  // Invalidate cache
  const keys = await redisClient.keys('categories:*');
  if (keys.length > 0) await redisClient.del(keys);

  await logAdminAction({
    adminId: req.user._id,
    action: 'REORDER_CATEGORIES',
    targetModel: 'Category',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, null, 'Categories reordered successfully'));
});

exports.getCategoryAnalytics = asyncHandler(async (req, res) => {
  const categories = await Category.find().select('name');
  
  const analytics = await Promise.all(categories.map(async (cat) => {
    const providers = await Provider.find({ category: cat._id });
    const providerIds = providers.map(p => p._id);
    
    const verifiedProviders = providers.filter(p => p.isVerified).length;
    
    const bookings = await Booking.aggregate([
      { $match: { provider: { $in: providerIds } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);
    
    const revenue = await Payment.aggregate([
      { $match: { provider: { $in: providerIds }, status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } }
    ]);
    
    const popularTownsAggr = await Provider.aggregate([
      { $match: { category: cat._id } },
      { $group: { _id: '$address.town', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    
    let totalRating = 0;
    let ratingCount = 0;
    providers.forEach(p => {
      if (p.stats && p.stats.rating > 0) {
        totalRating += p.stats.rating;
        ratingCount++;
      }
    });
    
    return {
      categoryId: cat._id,
      name: cat.name,
      providerCount: providers.length,
      verifiedProviders,
      totalBookings: bookings[0]?.total || 0,
      completedBookings: bookings[0]?.completed || 0,
      totalRevenue: revenue[0]?.total || 0,
      avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0,
      popularTowns: popularTownsAggr.map(t => t._id).filter(Boolean)
    };
  }));

  analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.status(200).json(new ApiResponse(200, analytics, 'Category analytics fetched'));
});
