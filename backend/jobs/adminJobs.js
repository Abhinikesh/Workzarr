const Agenda = require('agenda');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { generateAdminReport, sendAdminAlert } = require('../utils/adminHelpers');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Payment = require('../models/Payment');
const User = require('../models/User');

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/localserve', collection: 'agendaJobs' },
  processEvery: '1 minute'
});

// 1. generate-daily-report
agenda.define('generate-daily-report', async (job) => {
  try {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 1);
    
    const report = await generateAdminReport(start, end);
    const dateStr = start.toISOString().split('T')[0];
    
    await redisClient.setex(`admin:daily_report:${dateStr}`, 7 * 24 * 60 * 60, JSON.stringify(report)); // Cache for 7 days
    
    // Find admins
    const admins = await User.find({ role: { $in: ['admin', 'superAdmin'] } }).select('email');
    const adminEmails = admins.map(a => a.email).filter(Boolean);
    
    if (adminEmails.length > 0) {
      logger.info(`Generated daily report and sent to ${adminEmails.length} admins.`);
    }
    logger.info(`Daily report generated for ${dateStr}`);
  } catch (error) {
    logger.error(`generate-daily-report failed: ${error.message}`);
  }
});

// 2. weekly-platform-summary
agenda.define('weekly-platform-summary', async (job) => {
  try {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    
    const report = await generateAdminReport(start, end);
    logger.info('Weekly platform summary generated.');
  } catch (error) {
    logger.error(`weekly-platform-summary failed: ${error.message}`);
  }
});

// 3. flag-suspicious-activity
agenda.define('flag-suspicious-activity', async (job) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // 3+ no shows in 7 days
    const badProviders = await Provider.find({ 'stats.noShows': { $gte: 3 }, updatedAt: { $gte: oneWeekAgo } });
    for (const p of badProviders) {
      await sendAdminAlert('SUSPICIOUS_PROVIDER', { providerId: p._id, reason: 'Excessive no-shows' });
    }
    
    // Failed payments
    const failedPayments = await Payment.aggregate([
      { $match: { status: 'failed', createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: '$customer', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } }
    ]);
    
    for (const fp of failedPayments) {
      await sendAdminAlert('SUSPICIOUS_USER', { userId: fp._id, reason: 'Multiple failed payments in 24h' });
    }
    
    logger.info('flag-suspicious-activity completed.');
  } catch (error) {
    logger.error(`flag-suspicious-activity failed: ${error.message}`);
  }
});

// 4. cleanup-expired-data
agenda.define('cleanup-expired-data', async (job) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // OTPs
    const OTP = require('../models/OTP');
    await OTP.deleteMany({ createdAt: { $lt: oneDayAgo } });
    
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
    
    logger.info('cleanup-expired-data completed.');
  } catch (error) {
    logger.error(`cleanup-expired-data failed: ${error.message}`);
  }
});

exports.startAdminJobs = async () => {
  await agenda.start();
  await agenda.every('0 6 * * *', 'generate-daily-report', {}, { timezone: 'Asia/Kolkata' });
  await agenda.every('0 7 * * 1', 'weekly-platform-summary', {}, { timezone: 'Asia/Kolkata' });
  await agenda.every('0 * * * *', 'flag-suspicious-activity', {}, { timezone: 'Asia/Kolkata' });
  await agenda.every('0 3 * * 0', 'cleanup-expired-data', {}, { timezone: 'Asia/Kolkata' });
  logger.info('Admin Agenda jobs scheduled.');
};

exports.adminAgenda = agenda;
