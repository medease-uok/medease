const S3_REQUIRED = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
const missingS3 = S3_REQUIRED.filter((v) => !process.env[v]);
if (missingS3.length > 0) {
  console.warn(`Warning: Missing S3 environment variables: ${missingS3.join(', ')}. Profile image uploads will fail.`);
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  refreshTokenTTL: parseInt(process.env.REFRESH_TOKEN_TTL, 10) || 7 * 24 * 60 * 60,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  logLevel: process.env.LOG_LEVEL || 'debug',
  s3: {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION || 'eu-north-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '600', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
  },
};
