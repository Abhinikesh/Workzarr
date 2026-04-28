const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Settings = require('../../models/Settings');
const { logAdminAction } = require('../../utils/adminHelpers');
const { getIo } = require('../../socket/socket');
const redisClient = require('../../config/redis');

exports.getPlatformSettings = asyncHandler(async (req, res) => {
  let settings = await redisClient.get('platform:settings');
  
  if (!settings) {
    const config = await Settings.getConfig();
    settings = config.value;
    await redisClient.setex('platform:settings', 3600, JSON.stringify(settings));
  } else {
    settings = JSON.parse(settings);
  }

  res.status(200).json(new ApiResponse(200, settings, 'Platform settings fetched'));
});

exports.updatePlatformSettings = asyncHandler(async (req, res) => {
  if (req.user.role !== 'superAdmin') {
    throw new ApiError(403, 'Only super admins can modify platform settings');
  }

  const { updates, password } = req.body;
  if (!updates) throw new ApiError(400, 'Updates object is required');

  const User = require('../../models/User');
  const admin = await User.findById(req.user._id).select('+password');
  if (!(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid admin password');
  }

  const oldConfig = await Settings.getConfig();
  const oldMaintenance = oldConfig.value.app?.maintenanceMode;
  
  const newConfig = await Settings.updateConfig(updates, req.user._id);
  const newMaintenance = newConfig.value.app?.maintenanceMode;

  await redisClient.setex('platform:settings', 3600, JSON.stringify(newConfig.value));

  if (oldMaintenance !== newMaintenance && newMaintenance === true) {
    await redisClient.set('app:maintenance', 'true');
    await redisClient.set('app:maintenance:expectedAt', updates.app?.maintenanceMessage || 'Soon');
    getIo().emit('app:maintenance', { message: updates.app?.maintenanceMessage || 'App is under maintenance' });
  } else if (oldMaintenance !== newMaintenance && newMaintenance === false) {
    await redisClient.del('app:maintenance');
    await redisClient.del('app:maintenance:expectedAt');
    getIo().emit('app:maintenance_over', { message: 'Maintenance is complete' });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'UPDATE_SETTINGS',
    targetModel: 'Settings',
    previousValue: oldConfig.value,
    newValue: newConfig.value,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, newConfig.value, 'Platform settings updated'));
});

exports.toggleMaintenanceMode = asyncHandler(async (req, res) => {
  if (req.user.role !== 'superAdmin') {
    throw new ApiError(403, 'Only super admins can modify platform settings');
  }

  const { message, expectedDuration, password } = req.body;

  const User = require('../../models/User');
  const admin = await User.findById(req.user._id).select('+password');
  if (!(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid admin password');
  }

  const config = await Settings.getConfig();
  const currentMode = config.value.app?.maintenanceMode || false;
  const newMode = !currentMode;

  const updates = {
    app: {
      maintenanceMode: newMode,
      maintenanceMessage: message || (newMode ? 'App is under maintenance' : '')
    }
  };

  await Settings.updateConfig(updates, req.user._id);
  await redisClient.setex('platform:settings', 3600, JSON.stringify((await Settings.getConfig()).value));

  if (newMode) {
    await redisClient.set('app:maintenance', 'true');
    await redisClient.set('app:maintenance:expectedAt', expectedDuration || 'Soon');
    getIo().emit('app:maintenance', { message: updates.app.maintenanceMessage, expectedDuration });
  } else {
    await redisClient.del('app:maintenance');
    await redisClient.del('app:maintenance:expectedAt');
    getIo().emit('app:maintenance_over', { message: 'Maintenance is complete' });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'TOGGLE_MAINTENANCE',
    targetModel: 'Settings',
    newValue: newMode,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json(new ApiResponse(200, { maintenanceMode: newMode }, `Maintenance mode ${newMode ? 'enabled' : 'disabled'}`));
});
