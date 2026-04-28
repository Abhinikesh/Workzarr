const redisClient = require('../config/redis');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('./asyncHandler');

const maintenanceMiddleware = asyncHandler(async (req, res, next) => {
  // Always allow webhook and auth
  if (req.originalUrl.startsWith('/api/v1/auth') || req.originalUrl.startsWith('/api/v1/payments/webhook')) {
    return next();
  }

  const isMaintenance = await redisClient.get('app:maintenance');
  if (isMaintenance === 'true') {
    let isAdmin = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded.role === 'admin' || decoded.role === 'superAdmin') {
          isAdmin = true;
        }
      } catch (err) {
        // Ignore token errors here, handle in auth
      }
    }

    if (!isAdmin) {
      return res.status(503).json({
        success: false,
        message: "App is currently under maintenance. Please try again later.",
        expectedAt: await redisClient.get('app:maintenance:expectedAt') || "Soon"
      });
    }
  }

  next();
});

module.exports = maintenanceMiddleware;
