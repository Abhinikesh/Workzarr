const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Category = require('../../models/Category');
const Provider = require('../../models/Provider');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const { logAdminAction } = require('../../utils/adminHelpers');
const redisClient = require('../../config/redis');

// GET /admin/categories — list all categories (active + inactive)
exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const [providerCount, bookingCount] = await Promise.all([
        Provider.countDocuments({ category: cat._id }),
        Booking.countDocuments({ category: cat._id })
      ]);
      return {
        ...cat,
        stats: { providerCount, bookingCount }
      };
    })
  );

  // data.data is the array directly so CategoriesPage.jsx can do setCategories(data.data)
  return res.status(200).json({ success: true, message: 'Categories fetched', data: withCounts });
});

// PATCH /admin/categories/:id/status — toggle isActive
exports.toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');

  category.isActive = !category.isActive;
  await category.save();

  // Invalidate public cache
  await redisClient.del('all_categories').catch(() => {});

  await logAdminAction({
    adminId: req.user._id,
    action: category.isActive ? 'ENABLE_CATEGORY' : 'DISABLE_CATEGORY',
    targetModel: 'Category',
    targetId: category._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, category, `Category ${category.isActive ? 'enabled' : 'disabled'}`));
});

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
      { $match: { payee: { $in: providerIds }, status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ]);
    
    const popularTownsAggr = await Provider.aggregate([
      { $match: { category: cat._id } },
      { $group: { _id: '$location.town', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    
    let totalRating = 0;
    let ratingCount = 0;
    providers.forEach(p => {
      if (p.rating && p.rating.average > 0) {
        totalRating += p.rating.average;
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
