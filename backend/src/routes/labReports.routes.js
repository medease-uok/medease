const express = require('express');
const router = express.Router();
const { getAll, create, update } = require('../controllers/labReports.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', requirePermission('view_lab_reports', 'view_own_lab_reports'), getAll);
router.post('/', requirePermission('create_lab_report'), create);
router.patch('/:id', requirePermission('edit_lab_report'), update);

module.exports = router;
