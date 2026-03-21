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
  reminders: (() => {
    const raw = (process.env.REMINDER_HOURS_BEFORE || '24,1').split(',');
    const parsed = raw.map((h) => parseInt(h.trim(), 10));
    const valid = parsed.filter((h) => !isNaN(h) && h > 0);
    if (valid.length < raw.length) {
      console.warn(`[Config] Some REMINDER_HOURS_BEFORE values were invalid and ignored: "${process.env.REMINDER_HOURS_BEFORE}"`);
    }
    return {
      enabled: process.env.REMINDER_ENABLED !== 'false',
      hoursBefore: valid,
      cronSchedule: process.env.REMINDER_CRON_SCHEDULE || '*/5 * * * *',
    };
  })(),
};
