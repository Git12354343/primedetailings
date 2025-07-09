// middleware/validation.js
const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Booking validation rules
const validateBooking = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be 2-100 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be 2-100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('phoneNumber')
    .matches(/^\+?[\d\s\-\(\)]{10,20}$/)
    .withMessage('Valid phone number is required'),
  
  body('vehicleType')
    .isIn(['Sedan', 'SUV', 'Truck', 'Coupe'])
    .withMessage('Invalid vehicle type'),
  
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service must be selected'),
  
  body('date')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (value < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
  
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time format required (HH:MM)'),
  
  handleValidationErrors
];

// Service validation rules
const validateService = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be 2-100 characters'),
  
  body('pricing')
    .isObject()
    .custom((pricing) => {
      const requiredTypes = ['Sedan', 'SUV', 'Truck', 'Coupe'];
      for (const type of requiredTypes) {
        if (!pricing[type] || pricing[type] <= 0) {
          throw new Error(`Valid pricing required for ${type}`);
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Add-on validation rules
const validateAddOn = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Add-on name must be 2-100 characters'),
  
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),
  
  body('category')
    .optional()
    .isIn(['ENHANCEMENT', 'PROTECTION', 'CLEANING', 'RESTORATION'])
    .withMessage('Invalid category'),
  
  handleValidationErrors
];

// Auth validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  
  handleValidationErrors
];

const validateBookingId = [
  param('bookingId')
    .isInt({ min: 1 })
    .withMessage('Valid booking ID is required'),
  
  handleValidationErrors
];

// Status update validation
const validateStatus = [
  body('status')
    .isIn(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const bookingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 bookings per hour per IP
  message: {
    success: false,
    message: 'Too many booking attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },
  skipSuccessfulRequests: true,
});

module.exports = {
  validateBooking,
  validateService,
  validateAddOn,
  validateLogin,
  validateId,
  validateBookingId,
  validateStatus,
  bookingRateLimit,
  loginRateLimit,
  handleValidationErrors
};