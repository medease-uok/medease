const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for sensitive medical data endpoints.
 * 30 requests per minute per IP.
 */
const sensitiveDataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests to sensitive data. Please try again later.',
  },
});

/**
 * Rate limiter for authentication endpoints.
 * 10 requests per minute per IP.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = { sensitiveDataLimiter, authLimiter };
