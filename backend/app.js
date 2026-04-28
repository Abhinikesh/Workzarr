const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const maintenanceMiddleware = require('./middleware/maintenance.middleware');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// Webhook Controller (needs raw body)
const { handleWebhook } = require('./controllers/payment.controller');
const rawBodyMiddleware = require('./middleware/rawBody.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const providerRoutes = require('./routes/provider.routes');
const categoryRoutes = require('./routes/category.routes');
const serviceRoutes = require('./routes/service.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health.routes');

const app = express();

// 0. Health Check (Must be before limiters/auth)
app.use('/health', healthRoutes);

// 1. trust proxy (Essential for rate limiting behind Nginx/Load Balancer)
app.set('trust proxy', 1);

// 2. compression
app.use(compression());

// 3. helmet (Secure headers with custom CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.msg91.com"]
    }
  }
}));

// 4. cors
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 5. rawBody middleware (for /webhook ONLY - must be before express.json)
app.post('/api/v1/payments/webhook', rawBodyMiddleware, handleWebhook);

// 6. express.json (Body parser)
app.use(express.json({ limit: '10kb' }));

// 7. express.urlencoded
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 8. cookieParser
app.use(cookieParser(process.env.COOKIE_SECRET));

// 9. mongoSanitize (Security against NoSQL injection)
app.use(mongoSanitize());

// 10. hpp (Security against HTTP Parameter Pollution)
app.use(hpp());

// 11. morgan (HTTP request logging via Winston)
const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan('combined', { stream: morganStream }));

// 12. maintenanceMiddleware (Global gatekeeper)
app.use(maintenanceMiddleware);

// 13. globalLimiter (DDoS / Brute force protection)
app.use(globalLimiter);

// 14. Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// 15. 404 handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Can't find ${req.originalUrl} on this server!`));
});

// 16. Global errorHandler
app.use(errorHandler);

module.exports = app;
