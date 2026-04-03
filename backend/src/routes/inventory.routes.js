const express = require('express');
const router = express.Router();
const { getAllInventory, getInventoryById, addInventory, updateInventory, deleteInventory, getInventoryReport } = require('../controllers/inventory.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { apiLimiter, exportLimiter } = require('../middleware/rateLimit');

router.use(authenticate);

router.get('/', apiLimiter, authorize('admin', 'doctor', 'nurse', 'lab_technician', 'pharmacist'), getAllInventory);

// WARNING: Route ordering dependency
// /report MUST come before /:id, otherwise 'report' will be captured as an :id parameter
// exportLimiter used here because report generation is an expensive operation
router.get('/report', exportLimiter, authorize('admin'), getInventoryReport);

router.get('/:id', apiLimiter, authorize('admin', 'doctor', 'nurse', 'lab_technician', 'pharmacist'), getInventoryById);
router.post('/', apiLimiter, authorize('admin'), addInventory);
router.put('/:id', apiLimiter, authorize('admin'), updateInventory);
router.delete('/:id', apiLimiter, authorize('admin'), deleteInventory);

module.exports = router;
