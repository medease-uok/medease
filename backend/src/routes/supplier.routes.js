const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { apiLimiter } = require('../middleware/rateLimit');

// Apply rate limiting before authentication to protect auth layer from DoS
router.use(apiLimiter);

// All supplier routes are protected and restricted to Admin only as requested
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', supplierController.addSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
