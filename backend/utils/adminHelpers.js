const AdminAudit = require('../models/AdminAudit');
const logger = require('./logger');
const redisClient = require('../config/redis');
const { getIo } = require('../socket/socket');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Payment = require('../models/Payment');

exports.logAdminAction = async ({ adminId, action, targetModel, targetId, previousValue, newValue, ipAddress, userAgent, reason }) => {
  try {
    const audit = await AdminAudit.create({
      adminId,
      action,
      targetModel,
      targetId,
      previousValue,
      newValue,
      ipAddress,
      userAgent,
      reason
    });
    logger.info(`ADMIN_ACTION: ${action} by ${adminId} on ${targetModel} ${targetId}`);
    return audit;
  } catch (err) {
    logger.error(`Failed to log admin action: ${err.message}`);
  }
};

exports.sendAdminAlert = async (alertType, data) => {
  try {
    const alert = {
      type: alertType,
      data,
      timestamp: new Date().toISOString(),
      id: require('crypto').randomUUID(),
      read: false
    };
    
    // Push to Redis list
    await redisClient.lpush('admin:alerts', JSON.stringify(alert));
    // Keep max 100 alerts
    await redisClient.ltrim('admin:alerts', 0, 99);
    
    // Emit socket to all admins
    try {
      getIo().to('admin_room').emit('admin:new_alert', alert);
    } catch (e) {
      // socket might not be initialized
    }
  } catch (err) {
    logger.error(`Failed to send admin alert: ${err.message}`);
  }
};

exports.getAdminAlerts = async () => {
  try {
    const alertsStr = await redisClient.lrange('admin:alerts', 0, -1);
    const alerts = alertsStr.map(a => JSON.parse(a));
    // Return last 20 unread alerts
    return alerts.filter(a => !a.read).slice(0, 20);
  } catch (err) {
    logger.error(`Failed to get admin alerts: ${err.message}`);
    return [];
  }
};

exports.markAlertRead = async (alertId) => {
  try {
    const alertsStr = await redisClient.lrange('admin:alerts', 0, -1);
    let indexToUpdate = -1;
    const alerts = alertsStr.map((a, idx) => {
      const parsed = JSON.parse(a);
      if (parsed.id === alertId) {
        indexToUpdate = idx;
        parsed.read = true;
      }
      return parsed;
    });
    
    if (indexToUpdate !== -1) {
      await redisClient.lset('admin:alerts', indexToUpdate, JSON.stringify(alerts[indexToUpdate]));
    }
    return true;
  } catch (err) {
    logger.error(`Failed to mark alert read: ${err.message}`);
    return false;
  }
};

exports.calculatePlatformHealth = async () => {
  try {
    const bookings = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          noShows: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } }
        }
      }
    ]);
    
    const providers = await Provider.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);
    
    const payments = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] } }
        }
      }
    ]);

    const totalBookings = bookings[0]?.total || 1;
    const completedBookings = bookings[0]?.completed || 0;
    const completionRate = completedBookings / totalBookings;
    
    const totalProviders = providers[0]?.total || 1;
    const activeProviders = providers[0]?.active || 0;
    const providerAvailability = activeProviders / totalProviders;
    
    const totalPayments = payments[0]?.total || 1;
    const successfulPayments = payments[0]?.successful || 0;
    const paymentSuccessRate = successfulPayments / totalPayments;
    
    // Response time is a dummy metric for now, assuming 1.0 (perfect)
    const responseTime = 1.0; 
    
    const healthScore = Math.round(
      (completionRate * 40) +
      (providerAvailability * 30) +
      (paymentSuccessRate * 20) +
      (responseTime * 10)
    );
    
    return Math.min(100, Math.max(0, healthScore));
  } catch (err) {
    logger.error(`Failed to calculate platform health: ${err.message}`);
    return 0;
  }
};

exports.exportDataToCSV = (data, filename) => {
  if (!data || !data.length) return Buffer.from('');
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => {
    return headers.map(header => {
      let val = obj[header] === null || obj[header] === undefined ? '' : obj[header];
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""');
        if (val.includes(',') || val.includes('\\n') || val.includes('"')) {
          val = `"${val}"`;
        }
      }
      return val;
    }).join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  return Buffer.from(csvContent, 'utf-8');
};

exports.generateAdminReport = async (startDate, endDate) => {
  // Comprehensive report object
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const bookings = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
  const completed = await Booking.countDocuments({ status: 'completed', createdAt: { $gte: start, $lte: end } });
  const newUsers = await require('../models/User').countDocuments({ role: 'customer', createdAt: { $gte: start, $lte: end } });
  const newProviders = await Provider.countDocuments({ createdAt: { $gte: start, $lte: end } });
  
  const revenueAggr = await Payment.aggregate([
    { $match: { status: 'captured', createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, totalRevenue: { $sum: '$platformFee' } } }
  ]);
  
  return {
    period: { start, end },
    bookings,
    completedBookings: completed,
    completionRate: bookings > 0 ? ((completed / bookings) * 100).toFixed(2) + '%' : '0%',
    newUsers,
    newProviders,
    revenue: revenueAggr[0]?.totalRevenue || 0
  };
};
