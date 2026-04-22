class ApiResponse {
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
