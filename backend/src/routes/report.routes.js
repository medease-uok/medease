const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { exportLimiter } = require('../middleware/rateLimit');

// Apply rate limiting and authentication
router.use(exportLimiter);
router.use(authenticate);

// Enforce admin access for all report routes
router.use(authorize('admin'));

router.get('/inventory-status', reportController.getInventoryStatusReport);
router.get('/monthly-usage', reportController.getMonthlyUsageReport);
router.get('/appointment-summary', reportController.getAppointmentSummaryReport);
router.get('/supplier-orders', reportController.getSupplierOrderReport);

module.exports = router;
