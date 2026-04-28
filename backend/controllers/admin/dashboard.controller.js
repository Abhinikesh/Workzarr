const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const User = require('../../models/User');
const Provider = require('../../models/Provider');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const redisClient = require('../../config/redis');

// 1. getDashboardOverview
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:dashboard:overview';
  const cachedData = await redisClient.get(cacheKey);
  
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), 'Dashboard overview fetched (cached)'));
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - today.getDay());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // USERS
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const newUsersToday = await User.countDocuments({ role: 'customer', createdAt: { $gte: today } });
  const newUsersThisWeek = await User.countDocuments({ role: 'customer', createdAt: { $gte: thisWeek } });
  const newUsersThisMonth = await User.countDocuments({ role: 'customer', createdAt: { $gte: thisMonth } });
  const activeUsers = await User.countDocuments({ role: 'customer', lastLogin: { $gte: thirtyDaysAgo } });
  const blockedUsers = await User.countDocuments({ role: 'customer', isBlocked: true });

  const users = { totalUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth, activeUsers, blockedUsers };

  // PROVIDERS
  const totalProviders = await Provider.countDocuments();
  const verifiedProviders = await Provider.countDocuments({ isVerified: true });
  const pendingVerification = await Provider.countDocuments({ isVerified: false });
  const activeProviderIds = await Booking.distinct('provider', { createdAt: { $gte: thirtyDaysAgo } });
  const activeProviders = activeProviderIds.length;
  const premiumProviders = await Provider.countDocuments({ 'subscription.status': 'active' });
  const newProvidersThisMonth = await Provider.countDocuments({ createdAt: { $gte: thisMonth } });

  const providers = { totalProviders, verifiedProviders, pendingVerification, activeProviders, premiumProviders, newProvidersThisMonth };

  // BOOKINGS
  const totalBookings = await Booking.countDocuments();
  const bookingsToday = await Booking.countDocuments({ createdAt: { $gte: today } });
  const bookingsThisWeek = await Booking.countDocuments({ createdAt: { $gte: thisWeek } });
  const bookingsThisMonth = await Booking.countDocuments({ createdAt: { $gte: thisMonth } });
  const pendingBookings = await Booking.countDocuments({ status: 'pending' });
  const activeBookings = await Booking.countDocuments({ status: { $in: ['accepted', 'arriving', 'in_progress'] } });
  const completedBookings = await Booking.countDocuments({ status: 'completed' });
  const cancelledBookings = await Booking.countDocuments({ status: { $in: ['cancelled', 'no_show'] } });
  const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(2) : 0;

  const bookings = { totalBookings, bookingsToday, bookingsThisWeek, bookingsThisMonth, pendingBookings, activeBookings, completedBookings, cancelledBookings, completionRate };

  // REVENUE
  const revenueAggr = await Payment.aggregate([
    { $match: { status: 'captured' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$platformFee' },
        revenueToday: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, '$platformFee', 0] } },
        revenueThisWeek: { $sum: { $cond: [{ $gte: ['$createdAt', thisWeek] }, '$platformFee', 0] } },
        revenueThisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', thisMonth] }, '$platformFee', 0] } },
        totalRefunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } },
        netRevenue: { $sum: { $subtract: ['$platformFee', { $cond: [{ $eq: ['$status', 'refunded'] }, '$platformFee', 0] }] } }
      }
    }
  ]);

  const revData = revenueAggr[0] || { totalRevenue: 0, revenueToday: 0, revenueThisWeek: 0, revenueThisMonth: 0, totalRefunded: 0, netRevenue: 0 };
  
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const lastMonthRevAggr = await Payment.aggregate([
    { $match: { status: 'captured', createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
    { $group: { _id: null, revenue: { $sum: '$platformFee' } } }
  ]);
  const lastMonthRev = lastMonthRevAggr[0]?.revenue || 0;
  const revenueGrowth = lastMonthRev === 0 ? 100 : (((revData.revenueThisMonth - lastMonthRev) / lastMonthRev) * 100).toFixed(2);
  
  const revenue = { ...revData, revenueGrowth };

  // RECENT ACTIVITY
  const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(10)
    .populate('customer', 'name')
    .populate('provider', 'businessName')
    .populate('service', 'title')
    .select('bookingId customer provider service amount status createdAt');
    
  const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(10)
    .populate('customer', 'name')
    .populate('provider', 'businessName')
    .select('amount method status customer provider createdAt');
    
  const recentProviders = await Provider.find().sort({ createdAt: -1 }).limit(10)
    .populate('category', 'name')
    .select('businessName category town isVerified createdAt');

  const recentDisputes = []; 

  const recentActivity = { recentBookings, recentPayments, recentProviders, recentDisputes };

  // ALERTS
  const Review = require('../../models/Review');
  const failedPaymentsToday = await Payment.countDocuments({ status: 'failed', createdAt: { $gte: today } });
  const reportedReviews = await Review.countDocuments({ isVisible: false }); 
  const noShowsToday = await Booking.countDocuments({ status: 'no_show', createdAt: { $gte: today } });

  const alerts = {
    providersAwaitingVerification: pendingVerification,
    payoutsAwaitingProcessing: 0, 
    failedPaymentsToday,
    reportedReviews,
    noShowsToday
  };

  const dashboardData = { users, providers, bookings, revenue, recentActivity, alerts };

  await redisClient.setex(cacheKey, 300, JSON.stringify(dashboardData));

  res.status(200).json(new ApiResponse(200, dashboardData, 'Dashboard overview fetched'));
});

// 2. getRevenueChart
exports.getRevenueChart = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;
  const now = new Date();
  let start = new Date();
  let groupByFormat = '%Y-%m-%d';

  if (period === '7d') start.setDate(now.getDate() - 7);
  else if (period === '30d') start.setDate(now.getDate() - 30);
  else if (period === '90d') start.setDate(now.getDate() - 90);
  else if (period === '12m') {
    start.setMonth(now.getMonth() - 12);
    groupByFormat = '%Y-%m';
  } else if (period === 'custom' && startDate && endDate) {
    start = new Date(startDate);
  }

  const chartData = await Payment.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] } },
        commission: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$platformFee', 0] } },
        bookings: { $addToSet: '$booking' },
        refunds: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } }
      }
    },
    {
      $project: {
        date: '$_id',
        revenue: 1,
        commission: 1,
        bookings: { $size: '$bookings' },
        refunds: 1,
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  const totalRevenue = chartData.reduce((acc, curr) => acc + curr.commission, 0);
  const avgDailyRevenue = totalRevenue / (chartData.length || 1);
  const peakDay = chartData.reduce((prev, current) => (prev.commission > current.commission) ? prev : current, { commission: 0 });

  const diffTime = Math.abs(now - start);
  const prevStart = new Date(start.getTime() - diffTime);
  const prevData = await Payment.aggregate([
    { $match: { createdAt: { $gte: prevStart, $lt: start }, status: 'captured' } },
    { $group: { _id: null, revenue: { $sum: '$platformFee' } } }
  ]);
  const prevRevenue = prevData[0]?.revenue || 0;
  const growthVsPrevPeriod = prevRevenue === 0 ? (totalRevenue > 0 ? 100 : 0) : (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2);

  res.status(200).json(new ApiResponse(200, { chartData, summary: { totalRevenue, avgDailyRevenue, peakDay, growthVsPrevPeriod } }, 'Revenue chart fetched'));
});

// 3. getBookingChart
exports.getBookingChart = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const now = new Date();
  let start = new Date();
  let groupByFormat = '%Y-%m-%d';

  if (period === '7d') start.setDate(now.getDate() - 7);
  else if (period === '30d') start.setDate(now.getDate() - 30);
  else if (period === '90d') start.setDate(now.getDate() - 90);
  else if (period === '12m') {
    start.setMonth(now.getMonth() - 12);
    groupByFormat = '%Y-%m';
  }

  const chartData = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
      }
    },
    { $project: { date: '$_id', total: 1, completed: 1, cancelled: 1, pending: 1, _id: 0 } },
    { $sort: { date: 1 } }
  ]);

  const categoryBreakdown = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceInfo' } },
    { $unwind: '$serviceInfo' },
    { $lookup: { from: 'categories', localField: 'serviceInfo.category', foreignField: '_id', as: 'categoryInfo' } },
    { $unwind: '$categoryInfo' },
    { $group: { _id: '$categoryInfo.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const statusTotal = await Booking.countDocuments({ createdAt: { $gte: start } });
  const statuses = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const statusDistribution = {};
  statuses.forEach(s => {
    statusDistribution[s._id] = ((s.count / (statusTotal || 1)) * 100).toFixed(2) + '%';
  });

  const peakHours = await Booking.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json(new ApiResponse(200, { chartData, categoryBreakdown, statusDistribution, peakHours }, 'Booking chart fetched'));
});

// 4. getGeographicAnalytics
exports.getGeographicAnalytics = asyncHandler(async (req, res) => {
  const towns = await Provider.aggregate([
    {
      $group: {
        _id: '$address.town',
        district: { $first: '$address.district' },
        state: { $first: '$address.state' },
        totalProviders: { $sum: 1 },
        providers: { $push: '$_id' }
      }
    }
  ]);

  const usersByTown = await User.aggregate([
    { $match: { role: 'customer' } },
    { $group: { _id: '$address.town', totalUsers: { $sum: 1 } } }
  ]);

  const userTownMap = {};
  usersByTown.forEach(u => userTownMap[u._id] = u.totalUsers);

  const paymentsByProvider = await Payment.aggregate([
    { $match: { status: 'captured' } },
    { $group: { _id: '$provider', totalRevenue: { $sum: '$platformFee' } } }
  ]);
  const paymentMap = {};
  paymentsByProvider.forEach(p => paymentMap[p._id.toString()] = p.totalRevenue);

  const bookingsByProvider = await Booking.aggregate([
    { $group: { _id: '$provider', count: { $sum: 1 } } }
  ]);
  const bookingMap = {};
  bookingsByProvider.forEach(b => bookingMap[b._id.toString()] = b.count);

  const categoriesByTown = await Provider.aggregate([
    { $group: { _id: { town: '$address.town', category: '$category' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $group: { _id: '$_id.town', topCategory: { $first: '$_id.category' } } },
    { $lookup: { from: 'categories', localField: 'topCategory', foreignField: '_id', as: 'categoryInfo' } },
    { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }
  ]);
  const topCatMap = {};
  categoriesByTown.forEach(c => topCatMap[c._id] = c.categoryInfo?.name || 'Unknown');

  let analytics = towns.map(t => {
    let townRevenue = 0;
    let townBookings = 0;
    t.providers.forEach(pid => {
      townRevenue += paymentMap[pid.toString()] || 0;
      townBookings += bookingMap[pid.toString()] || 0;
    });

    return {
      town: t._id,
      district: t.district,
      state: t.state,
      totalUsers: userTownMap[t._id] || 0,
      totalProviders: t.totalProviders,
      totalBookings: townBookings,
      totalRevenue: townRevenue,
      topCategory: topCatMap[t._id] || 'Unknown'
    };
  });

  analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  const underservedAreas = analytics.filter(a => a.totalUsers > 0 && a.totalProviders < 5);

  res.status(200).json(new ApiResponse(200, { topAreas: analytics.slice(0, 20), underservedAreas }, 'Geographic analytics fetched'));
});
