const rateLimit = require('express-rate-limit');

const sensitiveDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests to sensitive data. Please try again later.',
  },
});

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
