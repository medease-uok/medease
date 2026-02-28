const express = require('express');
const router = express.Router();
const { register } = require('../controllers/auth.controller');
const { registerValidation } = require('../validators/auth.validators');
const validate = require('../middleware/validate');

router.post('/register', validate(registerValidation), register);

module.exports = router;
