const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');
const config = require('../config');

// In development, use much higher limits to avoid blocking during testing
const isDev = config.nodeEnv === 'development';

const sensitiveDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:sensitive:',
  }),
  message: {
    status: 'error',
    message: 'Too many requests to sensitive data. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:auth:',
  }),
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again later.',
  },
});

const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 50 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:export:',
  }),
  message: {
    status: 'error',
    message: 'Too many export requests. Please try again later.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 2000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:api:',
  }),
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.',
  },
});

module.exports = { sensitiveDataLimiter, authLimiter, exportLimiter, apiLimiter };
