const express = require('express');
const router = express.Router();
const { getAllPurchaseOrders, updatePurchaseOrderStatus } = require('../controllers/purchaseOrders.controller');
const protect = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const rateLimit = require('express-rate-limit');

const purchaseOrdersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for these routes
});

router.use(protect);
router.use(authorize('admin', 'pharmacist', 'lab_technician')); // Role check
router.use(purchaseOrdersLimiter);

router
  .route('/')
  .get(getAllPurchaseOrders);

router
  .route('/:id/status')
  .put(updatePurchaseOrderStatus);

module.exports = router;
