const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { apiLimiter } = require('../middleware/rateLimit');

// All supplier routes are protected and restricted to Admin only as requested
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', apiLimiter, supplierController.getAllSuppliers);
router.get('/:id', apiLimiter, supplierController.getSupplierById);
router.post('/', apiLimiter, supplierController.addSupplier);
router.put('/:id', apiLimiter, supplierController.updateSupplier);
router.delete('/:id', apiLimiter, supplierController.deleteSupplier);

module.exports = router;
