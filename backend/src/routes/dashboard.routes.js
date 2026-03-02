const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/stats', getStats);

module.exports = router;
