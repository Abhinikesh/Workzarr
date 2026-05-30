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

// Category seeder — runs once on startup if collection is empty
const seedCategories = async () => {
  try {
    const Category = require('./models/Category');
    const count = await Category.countDocuments();
    if (count > 0) return;

    const defaults = [
      { name: 'Electrician',     slug: 'electrician',     icon: '⚡', displayOrder: 1 },
      { name: 'Plumber',         slug: 'plumber',         icon: '🔧', displayOrder: 2 },
      { name: 'Carpenter',       slug: 'carpenter',       icon: '🪚', displayOrder: 3 },
      { name: 'AC Repair',       slug: 'ac-repair',       icon: '❄️', displayOrder: 4 },
      { name: 'Tutor',           slug: 'tutor',           icon: '📚', displayOrder: 5 },
      { name: 'Computer Repair', slug: 'computer-repair', icon: '💻', displayOrder: 6 },
      { name: 'Painter',         slug: 'painter',         icon: '🖌️', displayOrder: 7 },
      { name: 'Mechanic',        slug: 'mechanic',        icon: '🔩', displayOrder: 8 },
    ];

    let seeded = 0;
    for (const c of defaults) {
      try {
        await Category.create({ ...c, isActive: true });
        seeded++;
      } catch (e) {
        if (e.code !== 11000) throw e; // rethrow non-duplicate errors
      }
    }
    if (seeded > 0) logger.info(`✅ Seeded ${seeded} default categories.`);
  } catch (err) {
    logger.warn('Category seeding skipped:', err.message);
  }
};

let server;

// ─────────────────────────────────────────────────────────────────────────────
// Port busy / EADDRINUSE automatic cleanup helper
// ─────────────────────────────────────────────────────────────────────────────
const killPortProcess = (port) => {
  try {
    const { execSync } = require('child_process');
    logger.warn(`⚠️ Port ${port} is occupied. Scanning for active processes...`);
    const pidsStr = execSync(`lsof -t -i:${port}`).toString().trim();
    if (pidsStr) {
      const pids = pidsStr.split('\n').map(p => p.trim()).filter(Boolean);
      let killedAny = false;
      pids.forEach((pid) => {
        const pidNum = Number(pid);
        if (pidNum && pidNum !== process.pid) {
          logger.warn(`👉 Automatically killing conflicting process ${pidNum} listening on port ${port}...`);
          try {
            process.kill(pidNum, 'SIGKILL');
            killedAny = true;
          } catch (killErr) {
            logger.error(`❌ Failed to kill process ${pidNum}:`, killErr.message);
          }
        }
      });
      return killedAny;
    }
  } catch (err) {
    // execSync will throw if lsof finds no processes
    logger.info(`Port ${port} scan completed. No foreign active process found.`);
  }
  return false;
};

process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.warn(`⚠️ Port ${PORT} is already in use. Attempting automatic process cleanup...`);
    const cleared = killPortProcess(PORT);
    if (cleared) {
      logger.info(`🔄 Conflicting process cleared. Retrying server startup in 1.5 seconds...`);
      setTimeout(() => {
        startServer();
      }, 1500);
      return;
    }
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
    // Automatically attempt process cleanup before DB / initialization starts
    killPortProcess(PORT);

    await connectDB();
    await seedCategories();

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
        logger.error(`❌ Port ${PORT} is still occupied. Attempting secondary process cleanup...`);
        const cleared = killPortProcess(PORT);
        if (cleared) {
          logger.info(`🔄 Conflicting process cleared. Retrying server.listen on port ${PORT} in 1.5 seconds...`);
          setTimeout(() => {
            server.listen(PORT);
          }, 1500);
          return;
        }
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
