require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('redis');
const app = require('./app');
const logger = require('./utils/logger');
const redisClient = require('./config/redis');
const { startAgenda, stopAgenda } = require('./jobs/providerRankJob');

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
let server;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

const startServer = async () => {
  // 1. Connect MongoDB
  await connectDB();
  
  // 2. Connect Redis (if not already connected by config)
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Redis Connected.');
  }

  // 3. Start Agenda Jobs
  await startAgenda();

  // 4. Start Server
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on SIGTERM / SIGINT
const forceShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await stopAgenda();
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed.');
      if (redisClient.isOpen) {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      }
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => forceShutdown('SIGTERM'));
process.on('SIGINT', () => forceShutdown('SIGINT'));
