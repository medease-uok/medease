const express = require('express');
const router = express.Router();
const { getStats, getActivity, getDoctorDashboard } = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/activity', getActivity);
router.get('/doctor', getDoctorDashboard);

module.exports = router;
