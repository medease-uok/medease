const express = require('express');
const router = express.Router();
const { getAll, create } = require('../controllers/medicalRecords.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { sensitiveDataLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', sensitiveDataLimiter, requirePermission('view_medical_records', 'view_own_medical_records'), getAll);
router.post('/', requirePermission('create_medical_record'), create);

module.exports = router;
