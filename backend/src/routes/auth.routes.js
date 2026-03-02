const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const verifyCaptcha = require('../middleware/verifyCaptcha');

router.post('/register', verifyCaptcha, validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);

module.exports = router;
