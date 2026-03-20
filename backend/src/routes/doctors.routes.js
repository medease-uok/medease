const express = require('express');
const router = express.Router();
const { getAll, getById, getStatistics, getAssignedPatients } = require('../controllers/doctors.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');

router.use(authenticate);
router.use(resolveSubject);

router.get('/statistics', authorize('admin'), getStatistics);
router.get('/me/patients', authorize('doctor'), getAssignedPatients);
router.get('/', requirePermission('view_patients', 'view_appointments', 'view_own_appointments'), getAll);
router.get('/:id', requirePermission('view_patients', 'view_appointments', 'view_own_appointments'), getById);

module.exports = router;
