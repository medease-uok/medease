const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// Restricted to Admin and medical staff
router.get('/summary', authorize('admin', 'doctor', 'nurse'), statisticsController.getSystemSummary);

// Restricted to Admin and pharmacists
router.get('/inventory', authorize('admin', 'pharmacist'), statisticsController.getInventoryStats);

// Restricted to Admin and doctors
router.get('/appointments', authorize('admin', 'doctor'), statisticsController.getAppointmentTrends);

// Restricted to Admin only
router.get('/user-activity', authorize('admin'), statisticsController.getUserActivityStats);

module.exports = router;
