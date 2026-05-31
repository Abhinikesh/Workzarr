class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
  }

  static success(res, statusCode, message, data = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, statusCode, message, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  static paginated(res, message, data, pagination) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        limit: pagination.limit
      }
    });
  }
}

module.exports = ApiResponse;
