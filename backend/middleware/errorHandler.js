const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Render original error to Winston
  if (process.env.NODE_ENV !== 'test') {
    logger.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = ApiError.badRequest(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for field: ${field}`;
    error = ApiError.conflict(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest('Validation Error', errors);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token. Please log in again.');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Your token has expired. Please log in again.');
  }

  // Multer Error
  if (err.name === 'MulterError') {
    const message = `File upload error: ${err.message}`;
    error = ApiError.badRequest(message);
  }

  // Razorpay Error
  if (err.statusCode && err.error && err.error.code) {
    const message = `Payment Gateway Error: ${err.error.description || 'Transaction failed'}`;
    error = ApiError.badRequest(message);
  }

  // Handle ApiError
  if (error instanceof ApiError) {
    return ApiResponse.error(res, error.statusCode, error.message, error.errors);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
