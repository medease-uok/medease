const express = require('express');
const router = express.Router();
const { getStats, getActivity } = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/activity', getActivity);

module.exports = router;
