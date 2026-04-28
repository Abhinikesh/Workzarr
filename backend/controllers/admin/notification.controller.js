const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { logAdminAction } = require('../../utils/adminHelpers');
const { adminAgenda } = require('../../jobs/adminJobs');
const redisClient = require('../../config/redis');

exports.sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { title, body, targetAudience, towns, userIds, channels, scheduleAt, data } = req.body;
  if (!title || !body || !targetAudience || !channels) {
    throw new ApiError(400, 'Required fields missing');
  }

  let query = {};
  if (targetAudience === 'customers') query.role = 'customer';
  if (targetAudience === 'providers') query.role = 'provider';
  if (targetAudience === 'specific_towns' && towns) query['address.town'] = { $in: towns };
  if (targetAudience === 'specific_users' && userIds) query._id = { $in: userIds };
  
  const estimatedReach = await User.countDocuments(query);

  const broadcastId = require('crypto').randomUUID();

  const broadcastRecord = {
    title, body, targetAudience, channels, estimatedReach,
    sentBy: req.user._id,
    status: scheduleAt && new Date(scheduleAt) > new Date() ? 'scheduled' : 'queued',
    createdAt: new Date()
  };

  await redisClient.set(`broadcast:${broadcastId}`, JSON.stringify(broadcastRecord));

  if (broadcastRecord.status === 'scheduled') {
    await adminAgenda.schedule(new Date(scheduleAt), 'send-broadcast', { broadcastId, query, payload: { title, body, data }, channels });
    res.status(200).json(new ApiResponse(200, { broadcastId, scheduled: true, estimatedReach }, 'Broadcast scheduled'));
  } else {
    await adminAgenda.now('send-broadcast', { broadcastId, query, payload: { title, body, data }, channels });
    res.status(200).json(new ApiResponse(200, { broadcastId, scheduled: false, estimatedReach }, 'Broadcast queued for delivery'));
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'SEND_BROADCAST',
    targetModel: 'Notification',
    targetId: broadcastId,
    reason: targetAudience,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
});

exports.getBroadcastHistory = asyncHandler(async (req, res) => {
  const keys = await redisClient.keys('broadcast:*');
  const broadcasts = [];
  for (const k of keys) {
    if (k.split(':').length === 2) { 
      const data = await redisClient.get(k);
      if (data) broadcasts.push(JSON.parse(data));
    }
  }

  broadcasts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.status(200).json(new ApiResponse(200, broadcasts, 'Broadcast history fetched'));
});

exports.getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: '$type',
        totalSent: { $sum: 1 },
        totalRead: { $sum: { $cond: ['$isRead', 1, 0] } }
      }
    }
  ]);
  res.status(200).json(new ApiResponse(200, stats, 'Notification stats fetched'));
});

exports.cancelScheduledBroadcast = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const jobs = await adminAgenda.jobs({ name: 'send-broadcast', 'data.broadcastId': id });
  if (jobs.length > 0) {
    await jobs[0].remove();
    const data = await redisClient.get(`broadcast:${id}`);
    if (data) {
      const parsed = JSON.parse(data);
      parsed.status = 'cancelled';
      await redisClient.set(`broadcast:${id}`, JSON.stringify(parsed));
    }
    
    await logAdminAction({
      adminId: req.user._id,
      action: 'CANCEL_BROADCAST',
      targetModel: 'Notification',
      targetId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(new ApiResponse(200, null, 'Broadcast cancelled'));
  } else {
    throw new ApiError(404, 'Scheduled broadcast not found');
  }
});
