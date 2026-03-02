module.exports = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: process.env.EMAIL_FROM || 'MedEase <noreply@medease.com>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  verificationTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  passwordResetTokenExpiry: 60 * 60 * 1000, // 1 hour in milliseconds
};
