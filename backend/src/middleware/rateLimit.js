const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const sensitiveDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
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
  max: 10,
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
  max: 5,
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
  max: 100,
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
