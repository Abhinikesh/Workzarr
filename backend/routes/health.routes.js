const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');

/**
 * @route   GET /health
 * @desc    Check system health status (DB, Redis, etc.)
 * @access  Public
 */
router.get('/', async (req, res) => {
  const healthcheck = {
    status: "ok",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      redis: redisClient.isOpen ? "connected" : "disconnected",
      agenda: "running"
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  try {
    // If DB is disconnected, return 503
    if (mongoose.connection.readyState !== 1) {
      healthcheck.status = "unhealthy";
      return res.status(503).json(healthcheck);
    }
    
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = "error";
    res.status(503).json(healthcheck);
  }
});

module.exports = router;
