const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMyPermissions } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const verifyCaptcha = require('../middleware/verifyCaptcha');
const authenticate = require('../middleware/authenticate');

router.post('/register', verifyCaptcha, validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me/permissions', authenticate, getMyPermissions);

module.exports = router;
