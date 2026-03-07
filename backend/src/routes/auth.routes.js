const express = require('express');
const router = express.Router();
const {
  register, login, verifyOtp, verifyEmail, resendVerification,
  forgotPassword, verifyResetOtp, resetPassword,
} = require('../controllers/auth.controller');
const {
  registerValidation, loginValidation, verifyOtpValidation,
  forgotPasswordValidation, verifyResetOtpValidation, resetPasswordValidation,
} = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const verifyCaptcha = require('../middleware/verifyCaptcha');

router.post('/register', verifyCaptcha, validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/verify-otp', validate(verifyOtpValidation), verifyOtp);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/verify-reset-otp', validate(verifyResetOtpValidation), verifyResetOtp);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);

module.exports = router;
