const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { requireAuth, authorizeRoles } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/roles');

// All supplier routes are protected and restricted to Admin only as requested
router.use(requireAuth);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', supplierController.addSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
