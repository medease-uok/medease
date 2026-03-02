const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators/auth.validators');
const validate = require('../middleware/validate');

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);

module.exports = router;
