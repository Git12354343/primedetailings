// backend/middleware/enhanced-middleware.js

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { body, validationResult, param, query } = require('express-validator');

// Enhanced error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err.stack);

  // Default error
  let error = {
    success: false,
    message: 'Something went wrong!',
    statusCode: 500
  };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    error.message = `${field} already exists`;
    error.statusCode = 400;
  }

  if (err.code === 'P2025') {
    error.message = 'Record not found';
    error.statusCode = 404;
  }

  // Custom error
  if (err.statusCode) {
    error.statusCode = err.statusCode;
    error.message = err.message;
  }

  res.status(error.statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? error.message : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    message
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limit
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limit for sensitive endpoints
const strictLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many attempts, please try again later'
);

// SMS rate limit
const smsLimiter = createRateLimit(
  60 * 1000, // 1 minute
  3, // limit each IP to 3 SMS requests per minute
  'Too many SMS requests, please wait before requesting another code'
);

// Login rate limit
const loginLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 login attempts per 15 minutes
  'Too many login attempts, please try again later'
);

// Security middleware
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
      },
    },
  }),
  compression(),
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  })
];

// Logging middleware
const loggingMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
);

// Request validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules
const validationRules = {
  // Booking validation
  createBooking: [
    body('firstName')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name can only contain letters and spaces'),
    
    body('phone')
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('vehicleType')
      .isIn(['Car', 'SUV', 'Truck', 'Van', 'Motorcycle'])
      .withMessage('Invalid vehicle type'),
    
    body('make')
      .isLength({ min: 1, max: 50 })
      .withMessage('Vehicle make is required'),
    
    body('model')
      .isLength({ min: 1, max: 50 })
      .withMessage('Vehicle model is required'),
    
    body('year')
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid vehicle year'),
    
    body('services')
      .isArray({ min: 1 })
      .withMessage('At least one service must be selected'),
    
    body('date')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          throw new Error('Date cannot be in the past');
        }
        return true;
      }),
    
    body('time')
      .matches(/^(0?[8-9]|1[0-7]):(00|30) (AM|PM)$/)
      .withMessage('Time must be during business hours (8 AM - 5 PM)')
  ],

  // SMS verification
  verifyBooking: [
    body('bookingId')
      .isInt()
      .withMessage('Invalid booking ID'),
    
    body('verificationCode')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
      .isNumeric()
      .withMessage('Verification code must contain only numbers')
  ],

  // Contact form validation
  createContact: [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('subject')
      .isLength({ min: 1, max: 200 })
      .withMessage('Subject is required and must be less than 200 characters'),
    
    body('message')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Message must be between 10 and 1000 characters')
  ],

  // Auth validation
  loginDetailer: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],

  // Admin validation
  assignBooking: [
    body('bookingId')
      .isInt()
      .withMessage('Invalid booking ID'),
    
    body('detailerId')
      .isInt()
      .withMessage('Invalid detailer ID')
  ],

  // Route parameter validation
  bookingId: [
    param('bookingId')
      .isInt()
      .withMessage('Invalid booking ID')
  ],

  // Query parameter validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attacks from string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      });
    }
  };

  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);

  next();
};

// Request logging middleware for debugging
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
};

// Response time middleware
const responseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Health check middleware
const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
};

// Not found middleware
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  generalLimiter,
  strictLimiter,
  smsLimiter,
  loginLimiter,
  securityMiddleware,
  loggingMiddleware,
  validateRequest,
  validationRules,
  sanitizeInput,
  requestLogger,
  responseTime,
  healthCheck,
  notFound
};