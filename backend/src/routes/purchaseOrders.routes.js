const express = require('express');
const router = express.Router();
const { getAllPurchaseOrders, updatePurchaseOrderStatus } = require('../controllers/purchaseOrders.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'pharmacist', 'lab_technician')); // Role check

router
  .route('/')
  .get(getAllPurchaseOrders);

router
  .route('/:id/status')
  .put(updatePurchaseOrderStatus);

module.exports = router;
