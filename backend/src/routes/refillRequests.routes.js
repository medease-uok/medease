const express = require('express');
const router = express.Router();
const { getAll, create, respond } = require('../controllers/refillRequests.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { sensitiveDataLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', sensitiveDataLimiter, requirePermission('view_refill_requests', 'view_own_refill_requests'), getAll);
router.post('/', requirePermission('request_refill'), create);
router.patch('/:id/respond', requirePermission('respond_refill_request'), respond);

module.exports = router;
