// Step 1: Load dotenv FIRST
require('dotenv').config();

// Step 2: Import logger
const logger = require('./utils/logger');

// Step 3: Import db connection
const mongoose = require('mongoose');

// Step 4: Import redis connection
const redisClient = require('./config/redis');

// Step 5: Import app
const app = require('./app');

// Step 6: Import socket
const http = require('http');
const { initializeSocket } = require('./socket/socket');

// Step 7: Import agenda jobs
const { startAgenda, stopAgenda } = require('./jobs/providerRankJob');
const { agenda: bookingAgenda } = require('./jobs/bookingJobs');
const payoutQueue = require('./jobs/payoutQueue');

// Global configuration
const PORT = process.env.PORT || 5000;
let server;

/**
 * Step 8: Connect DB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

/**
 * Main Server Initialization Flow
 */
const startServer = async () => {
  try {
    // 8. Connect DB
    await connectDB();
    
    // 9. Redis connects automatically on import in Step 4
    logger.info('Redis connection initialized.');

    // 10. Start HTTP server
    server = http.createServer(app);
    
    // 11. Initialize socket on server
    initializeSocket(server);

    // 12. Start agenda jobs
    await startAgenda();
    await bookingAgenda.start();
    
    // Define background tasks
    bookingAgenda.define('daily-payout-batch', async (job) => {
      await payoutQueue.queueDailyBatch();
    });
    await bookingAgenda.every('0 10 * * *', 'daily-payout-batch');
    
    logger.info('Background workers & Job schedulers active.');

    // Finalize server listening
    server.listen(PORT, () => {
      logger.info(`LocalServe API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

  } catch (error) {
    logger.error('CRITICAL ERROR DURING INITIALIZATION:', error);
    process.exit(1);
  }
};

// Start the process
startServer();

// --- Error Handling & Graceful Shutdown ---

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

const forceShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await stopAgenda();
      await bookingAgenda.stop();
      await mongoose.connection.close(false);
      logger.info('System resources released. Goodbye.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => forceShutdown('SIGTERM'));
process.on('SIGINT', () => forceShutdown('SIGINT'));
