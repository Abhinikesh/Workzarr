// Step 1: Load dotenv FIRST — before anything else
require('dotenv').config();

// Step 2: Import logger
const logger = require('./utils/logger');

// Step 3: Import db connection
const mongoose = require('mongoose');

// Step 4: Import redis connection
const redisClient = require('./config/redis');

// Step 5: Import app
const app = require('./app');

// Step 6: HTTP + Socket
const http = require('http');
const { initializeSocket } = require('./socket/socket');

// Step 7: Background jobs
const { startAgenda, stopAgenda } = require('./jobs/providerRankJob');
const { agenda: bookingAgenda } = require('./jobs/bookingJobs');
const payoutQueue = require('./jobs/payoutQueue');

const PORT = process.env.PORT || 5000;
let server;

// ─────────────────────────────────────────────────────────────────────────────
// EADDRINUSE — Port already in use
// Fix: run  lsof -ti:5000 | xargs kill -9  then restart
// ─────────────────────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Run: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// Connect to MongoDB
// ─────────────────────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Server Initialization
// ─────────────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    logger.info('Redis connection initialized.');

    server = http.createServer(app);
    initializeSocket(server);

    // Start background job schedulers
    await startAgenda();
    await bookingAgenda.start();

    bookingAgenda.define('daily-payout-batch', async () => {
      await payoutQueue.queueDailyBatch();
    });
    await bookingAgenda.every('0 10 * * *', 'daily-payout-batch');

    logger.info('Background workers & Job schedulers active.');

    server.listen(PORT, () => {
      logger.info(`✅ Backend API running on http://localhost:${PORT}  [${process.env.NODE_ENV}]`);
      logger.info(`   Frontend  → http://localhost:3000`);
      logger.info(`   Admin     → http://localhost:3001`);
    });

    // Handle listen errors (e.g., EADDRINUSE) before uncaughtException fires
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use.`);
        logger.error(`   Fix: run  lsof -ti:${PORT} | xargs kill -9  then restart.`);
        process.exit(1);
      }
      throw err;
    });

  } catch (error) {
    logger.error('CRITICAL ERROR DURING INITIALIZATION:', error);
    process.exit(1);
  }
};

startServer();

// ─────────────────────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────────────────────
const forceShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await stopAgenda();
      await bookingAgenda.stop();
      await mongoose.connection.close(false);
      logger.info('All resources released. Goodbye.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => forceShutdown('SIGTERM'));
process.on('SIGINT',  () => forceShutdown('SIGINT'));
