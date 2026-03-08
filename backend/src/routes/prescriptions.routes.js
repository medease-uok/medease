const express = require('express');
const router = express.Router();
const { getAll, create, updateStatus } = require('../controllers/prescriptions.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', requirePermission('view_prescriptions', 'view_own_prescriptions'), getAll);
router.post('/', requirePermission('create_prescription'), create);
router.patch('/:id/status', requirePermission('dispense_prescription', 'cancel_prescription'), updateStatus);

module.exports = router;
