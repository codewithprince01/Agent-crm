/**
 * Standard API Response Handler
 * Provides consistent response format across all endpoints
 */

class ResponseHandler {
  /**
   * Success response
   */
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      ...(data && { data }),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   */
  static error(res, message, errors = null, statusCode = 400) {
    const response = {
      success: false,
      message,
      ...(errors && { errors }),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  static created(res, message, data = null) {
    return this.success(res, message, data, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Unauthorized response (401)
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, null, 401);
  }

  /**
   * Forbidden response (403)
   */
  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, null, 403);
  }

  /**
   * Not found response (404)
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, null, 404);
  }

  /**
   * Validation error response (422)
   */
  static validationError(res, errors) {
    return this.error(res, 'Validation failed', errors, 422);
  }

  /**
   * Internal server error (500)
   */
  static serverError(res, message = 'Internal server error', error = null) {
    const response = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && error && { error: error.message, stack: error.stack }),
    };
    return res.status(500).json(response);
  }

  /**
   * Paginated response
   */
  static paginated(res, message, data, pagination) {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        totalItems: pagination.totalItems || 0,
        totalPages: Math.ceil((pagination.totalItems || 0) / (pagination.limit || 10)),
      },
    };
    return res.status(200).json(response);
  }
}

module.exports = ResponseHandler;
