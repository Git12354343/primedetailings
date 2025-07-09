// middleware/security.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Account lockout tracking (use Redis in production)
const loginAttempts = new Map();
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;

// Account lockout middleware
const accountLockout = (req, res, next) => {
  const { email } = req.body;
  if (!email) return next();

  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  
  // Check if account is locked
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      success: false,
      message: `Account locked. Try again in ${remainingTime} minutes.`
    });
  }

  // Reset if lockout time has passed
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email);
  }

  req.loginAttempts = attempts;
  next();
};

// Track failed login attempts
const trackFailedLogin = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  attempts.count += 1;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_TIME;
  }

  loginAttempts.set(email, attempts);
};

// Clear login attempts on successful login
const clearLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Helmet security configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// API rate limiting
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Booking-specific rate limiting
const bookingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 bookings per hour per IP
  message: {
    success: false,
    message: 'Too many booking attempts. Please try again in an hour.'
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        obj[key] = obj[key].replace(/javascript:/gi, '');
        obj[key] = obj[key].replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log to console (use proper logging service in production)
    console.log(JSON.stringify(logData));
  });
  
  next();
};

module.exports = {
  corsOptions,
  helmetConfig,
  apiRateLimit,
  bookingRateLimit,
  accountLockout,
  trackFailedLogin,
  clearLoginAttempts,
  sanitizeInput,
  requestLogger
};