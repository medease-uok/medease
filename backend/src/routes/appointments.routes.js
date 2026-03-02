const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/appointments.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', getAll);

module.exports = router;
