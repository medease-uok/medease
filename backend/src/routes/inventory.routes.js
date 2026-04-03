const express = require('express');
const router = express.Router();
const { getAllInventory, getInventoryById, addInventory, updateInventory, deleteInventory, getInventoryReport } = require('../controllers/inventory.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { apiLimiter, exportLimiter } = require('../middleware/rateLimit');

// Apply rate limiting before authentication to protect auth layer from DoS
router.use(apiLimiter);

router.use(authenticate);

router.get('/', authorize('admin', 'doctor', 'nurse', 'lab_technician', 'pharmacist'), getAllInventory);

// WARNING: Route ordering dependency
// /report MUST come before /:id, otherwise 'report' will be captured as an :id parameter
// exportLimiter used here because report generation is an expensive operation (more restrictive than apiLimiter)
router.get('/report', exportLimiter, authorize('admin'), getInventoryReport);

router.get('/:id', authorize('admin', 'doctor', 'nurse', 'lab_technician', 'pharmacist'), getInventoryById);
router.post('/', authorize('admin'), addInventory);
router.put('/:id', authorize('admin'), updateInventory);
router.delete('/:id', authorize('admin'), deleteInventory);

module.exports = router;
