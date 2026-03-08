const express = require('express');
const router = express.Router();
const {
  register, login, verifyOtp, verifyEmail, resendVerification,
  forgotPassword, verifyResetOtp, resetPassword,
  refresh, logout, getMyPermissions,
} = require('../controllers/auth.controller');
const {
  registerValidation, loginValidation, verifyOtpValidation,
  forgotPasswordValidation, verifyResetOtpValidation, resetPasswordValidation,
} = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const verifyCaptcha = require('../middleware/verifyCaptcha');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', verifyCaptcha, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/verify-otp', authLimiter, validate(verifyOtpValidation), verifyOtp);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/forgot-password', authLimiter, validate(forgotPasswordValidation), forgotPassword);
router.post('/verify-reset-otp', authLimiter, validate(verifyResetOtpValidation), verifyResetOtp);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me/permissions', authenticate, getMyPermissions);

module.exports = router;
