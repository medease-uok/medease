module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
