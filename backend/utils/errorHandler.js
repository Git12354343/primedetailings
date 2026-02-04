/**
 * Centralized Error Handling
 * Standardizes error responses across the API
 */

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error types for consistency
 */
const ErrorTypes = {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    status: 401
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    status: 401
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Your session has expired. Please login again',
    status: 401
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'You do not have permission to perform this action',
    status: 403
  },

  // Not Found (404)
  BOOKING_NOT_FOUND: {
    code: 'BOOKING_NOT_FOUND',
    message: 'Booking not found',
    status: 404
  },
  SERVICE_NOT_FOUND: {
    code: 'SERVICE_NOT_FOUND',
    message: 'Service not found',
    status: 404
  },
  DETAILER_NOT_FOUND: {
    code: 'DETAILER_NOT_FOUND',
    message: 'Detailer not found',
    status: 404
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    status: 404
  },

  // Validation Errors (400)
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    status: 400
  },
  INVALID_PHONE: {
    code: 'INVALID_PHONE',
    message: 'Invalid phone number format',
    status: 400
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format',
    status: 400
  },
  INVALID_DATE: {
    code: 'INVALID_DATE',
    message: 'Invalid date format or date in the past',
    status: 400
  },
  MISSING_REQUIRED_FIELDS: {
    code: 'MISSING_REQUIRED_FIELDS',
    message: 'Required fields are missing',
    status: 400
  },

  // Business Logic Errors (400)
  INVALID_VERIFICATION_CODE: {
    code: 'INVALID_VERIFICATION_CODE',
    message: 'Invalid or expired verification code',
    status: 400
  },
  BOOKING_ALREADY_EXISTS: {
    code: 'BOOKING_ALREADY_EXISTS',
    message: 'A booking already exists for this time slot',
    status: 400
  },
  TIME_SLOT_UNAVAILABLE: {
    code: 'TIME_SLOT_UNAVAILABLE',
    message: 'Selected time slot is not available',
    status: 400
  },
  DETAILER_NOT_AVAILABLE: {
    code: 'DETAILER_NOT_AVAILABLE',
    message: 'Detailer is not available for this booking',
    status: 400
  },
  INVALID_STATUS_TRANSITION: {
    code: 'INVALID_STATUS_TRANSITION',
    message: 'Invalid status transition',
    status: 400
  },
  DETAILER_NOT_ASSIGNED: {
    code: 'DETAILER_NOT_ASSIGNED',
    message: 'Detailer must be assigned first',
    status: 400
  },
  BOOKING_ALREADY_COMPLETED: {
    code: 'BOOKING_ALREADY_COMPLETED',
    message: 'Cannot modify a completed booking',
    status: 400
  },
  BOOKING_ALREADY_CANCELED: {
    code: 'BOOKING_ALREADY_CANCELED',
    message: 'Cannot modify a canceled booking',
    status: 400
  },
  CANCELLATION_DEADLINE_PASSED: {
    code: 'CANCELLATION_DEADLINE_PASSED',
    message: 'Cancellation deadline has passed',
    status: 400
  },

  // Conflict (409)
  DUPLICATE_ENTRY: {
    code: 'DUPLICATE_ENTRY',
    message: 'A record with this information already exists',
    status: 409
  },

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later',
    status: 429
  },
  SMS_LIMIT_EXCEEDED: {
    code: 'SMS_LIMIT_EXCEEDED',
    message: 'Too many SMS requests. Please try again later',
    status: 429
  },

  // Server Errors (500)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred. Please try again',
    status: 500
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    status: 500
  },
  SMS_SERVICE_ERROR: {
    code: 'SMS_SERVICE_ERROR',
    message: 'Failed to send SMS. Please try again',
    status: 500
  },
  EMAIL_SERVICE_ERROR: {
    code: 'EMAIL_SERVICE_ERROR',
    message: 'Failed to send email. Please try again',
    status: 500
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'External service unavailable',
    status: 500
  }
};

/**
 * Create a standardized error response
 * @param {string} errorType - Error type from ErrorTypes
 * @param {string} customMessage - Optional custom message
 * @param {object} details - Optional additional details
 */
function createError(errorType, customMessage = null, details = null) {
  const error = ErrorTypes[errorType] || ErrorTypes.INTERNAL_ERROR;
  
  return new AppError(
    customMessage || error.message,
    error.status,
    error.code
  );
}

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {object} additionalInfo - Optional additional information
 */
function formatErrorResponse(error, additionalInfo = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const response = {
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      status: error.statusCode || 500,
      ...additionalInfo
    }
  };

  // Include stack trace in development
  if (!isProduction && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    code: err.code,
    message: err.message,
    status: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Prisma errors
  if (err.code?.startsWith('P')) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      return res.status(409).json(formatErrorResponse(
        createError('DUPLICATE_ENTRY', 'This record already exists')
      ));
    }
    if (err.code === 'P2025') {
      // Record not found
      return res.status(404).json(formatErrorResponse(
        createError('RESOURCE_NOT_FOUND')
      ));
    }
    // Other Prisma errors
    return res.status(500).json(formatErrorResponse(
      createError('DATABASE_ERROR')
    ));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(formatErrorResponse(
      createError('UNAUTHORIZED', 'Invalid token')
    ));
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(formatErrorResponse(
      createError('TOKEN_EXPIRED')
    ));
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(formatErrorResponse(
      createError('VALIDATION_ERROR', err.message, { 
        fields: err.errors 
      })
    ));
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const response = formatErrorResponse(err);
  
  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper to catch errors in async routes
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(404).json(formatErrorResponse(
    createError('RESOURCE_NOT_FOUND', `Route ${req.originalUrl} not found`)
  ));
}

module.exports = {
  AppError,
  ErrorTypes,
  createError,
  formatErrorResponse,
  errorHandler,
  asyncHandler,
  notFoundHandler
};