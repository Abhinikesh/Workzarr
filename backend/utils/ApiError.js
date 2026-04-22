class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.isOperational = isOperational;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg, errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Not Found') {
    return new ApiError(404, msg);
  }

  static conflict(msg) {
    return new ApiError(409, msg);
  }

  static tooManyRequests(msg = 'Too Many Requests') {
    return new ApiError(429, msg);
  }

  static internal(msg = 'Internal Server Error', errors = []) {
    return new ApiError(500, msg, errors, false);
  }
}

module.exports = ApiError;
