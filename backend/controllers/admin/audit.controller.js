const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const AdminAudit = require('../../models/AdminAudit');

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { adminId, action, targetModel, targetId, startDate, endDate, ipAddress, page = 1, limit = 50 } = req.query;
  const query = {};

  if (adminId) query.adminId = adminId;
  if (action) query.action = action;
  if (targetModel) query.targetModel = targetModel;
  if (targetId) query.targetId = targetId;
  if (ipAddress) query.ipAddress = ipAddress;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const logs = await AdminAudit.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('adminId', 'name email');

  const total = await AdminAudit.countDocuments(query);

  res.status(200).json(new ApiResponse(200, { logs, total, page: parseInt(page), pages: Math.ceil(total / limit) }, 'Audit logs fetched'));
});

exports.getAdminActivitySummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = {};
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const summary = await AdminAudit.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$adminId',
        totalActions: { $sum: 1 },
        actions: { $push: '$action' },
        lastActive: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'adminInfo'
      }
    },
    { $unwind: '$adminInfo' },
    {
      $project: {
        adminName: '$adminInfo.name',
        adminEmail: '$adminInfo.email',
        totalActions: 1,
        actions: 1,
        lastActive: 1
      }
    }
  ]);

  const formattedSummary = summary.map(s => {
    const actionBreakdown = s.actions.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    
    return {
      adminId: s._id,
      adminName: s.adminName,
      adminEmail: s.adminEmail,
      totalActions: s.totalActions,
      actionBreakdown,
      lastActive: s.lastActive
    };
  });

  res.status(200).json(new ApiResponse(200, formattedSummary, 'Admin activity summary fetched'));
});
