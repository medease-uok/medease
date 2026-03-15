const express = require('express');
const router = express.Router();
const { getStats, getActivity, getDoctorDashboard, getPatientQueue } = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/activity', getActivity);
router.get('/doctor', authorize('doctor'), getDoctorDashboard);
router.get('/queue', authorize('doctor', 'nurse', 'admin'), getPatientQueue);

module.exports = router;
