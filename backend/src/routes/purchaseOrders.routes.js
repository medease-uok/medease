const express = require('express');
const router = express.Router();
const { getAllPurchaseOrders, updatePurchaseOrderStatus } = require('../controllers/purchaseOrders.controller');
const protect = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { apiLimiter } = require('../middleware/rateLimit');

router.use(protect);
router.use(apiLimiter);
  .route('/:id/status')
  .patch(authorize('admin', 'pharmacist', 'lab_technician'), updatePurchaseOrderStatus);

module.exports = router;
