const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', auditController.getAuditLogs);
router.get('/export', auditController.exportAuditLogs);

module.exports = router;
