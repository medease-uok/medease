const AppError = require('../utils/AppError');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return next(new AppError('CAPTCHA verification is required.', 400));
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.CLOUDFLARE_SECRET_KEY,
        response: captchaToken,
        remoteip: req.ip,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return next(new AppError('CAPTCHA verification failed. Please try again.', 400));
    }

    next();
  } catch (err) {
    return next(new AppError('CAPTCHA verification service unavailable.', 503));
  }
};

module.exports = verifyCaptcha;
