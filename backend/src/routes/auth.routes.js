const express = require('express');
const router = express.Router();
const { register, login, verifyOtp } = require('../controllers/auth.controller');
const { registerValidation, loginValidation, verifyOtpValidation } = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const verifyCaptcha = require('../middleware/verifyCaptcha');

router.post('/register', verifyCaptcha, validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/verify-otp', validate(verifyOtpValidation), verifyOtp);

module.exports = router;
