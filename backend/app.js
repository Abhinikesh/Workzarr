const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// Import routes
const authRoutes = require('./routes/auth.routes');
const providerRoutes = require('./routes/provider.routes');
const categoryRoutes = require('./routes/category.routes');
const serviceRoutes = require('./routes/service.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// 1. helmet with custom CSP
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

// 2. cors
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 3. Webhook (Must be before express.json)
const rawBodyMiddleware = require('./middleware/rawBody.middleware');
const { handleWebhook } = require('./controllers/payment.controller');
app.post('/api/v1/payments/webhook', rawBodyMiddleware, handleWebhook);

// 4. express.json
app.use(express.json({ limit: '10kb' }));

// 4. express.urlencoded
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. morgan with Winston stream
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
app.use(morgan('combined', { stream: morganStream }));

// 6. globalLimiter
app.use(globalLimiter);

// 7. cookieParser
app.use(cookieParser(process.env.COOKIE_SECRET));

// 8. Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 9. 404 handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Can't find ${req.originalUrl} on this server!`));
});

// 10. Global errorHandler
app.use(errorHandler);

module.exports = app;
