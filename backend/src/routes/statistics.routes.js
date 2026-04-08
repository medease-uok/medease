const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { sensitiveDataLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(authorize('admin'));
router.use(sensitiveDataLimiter);

// Admin only access for all statistics
router.get('/summary', statisticsController.getSystemSummary);
router.get('/inventory', statisticsController.getInventoryStats);
router.get('/appointments', statisticsController.getAppointmentTrends);
router.get('/user-activity', statisticsController.getUserActivityStats);

module.exports = router;
