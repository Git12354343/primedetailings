// middleware/security.js
const helmet = require('helmet');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOCKOUT_TIME_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;

// Account lockout middleware — DB-backed, survives restarts
const accountLockout = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next();

  try {
    const record = await prisma.loginAttempt.findUnique({ where: { email } });

    if (record && record.lockedUntil && new Date() < record.lockedUntil) {
      const remainingTime = Math.ceil((record.lockedUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Account locked. Try again in ${remainingTime} minutes.`
      });
    }

    // Auto-clear expired lockout
    if (record && record.lockedUntil && new Date() >= record.lockedUntil) {
      await prisma.loginAttempt.delete({ where: { email } }).catch(() => {});
    }

    next();
  } catch (err) {
    console.error('accountLockout error:', err);
    next(); // fail open — don't block login on DB error
  }
};

// Track failed login attempt
const trackFailedLogin = async (email) => {
  try {
    const record = await prisma.loginAttempt.findUnique({ where: { email } });
    const count = (record?.count || 0) + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_TIME_MS) : null;

    await prisma.loginAttempt.upsert({
      where: { email },
      update: { count, lockedUntil, updatedAt: new Date() },
      create: { email, count, lockedUntil },
    });
  } catch (err) {
    console.error('trackFailedLogin error:', err);
  }
};

// Clear on successful login
const clearLoginAttempts = async (email) => {
  try {
    await prisma.loginAttempt.delete({ where: { email } });
  } catch {
    // Record may not exist — that's fine
  }
};

// CORS configuration — origin driven by env var, no hardcoded domains
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        `https://www.${(process.env.FRONTEND_URL || '').replace(/^https?:\/\//, '')}`
      ].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret']
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

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
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
    console.log(JSON.stringify({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    }));
  });
  next();
};

module.exports = {
  corsOptions,
  helmetConfig,
  accountLockout,
  trackFailedLogin,
  clearLoginAttempts,
  sanitizeInput,
  requestLogger
};
