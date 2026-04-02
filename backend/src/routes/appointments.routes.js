const express = require('express');
const router = express.Router();
const { getAll, getById, create, createRecurring, cancelSeries, updateStatus, reschedule } = require('../controllers/appointments.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', requirePermission('view_appointments', 'view_own_appointments'), getAll);
router.get('/:id', requirePermission('view_appointments', 'view_own_appointments'), getById);
router.post('/', requirePermission('create_appointment'), create);
router.post('/recurring', requirePermission('create_appointment'), createRecurring);
router.patch('/series/:seriesId/cancel', requirePermission('update_appointment_status', 'cancel_appointment'), cancelSeries);
router.patch('/:id/status', requirePermission('update_appointment_status', 'cancel_appointment'), updateStatus);
router.put('/:id/reschedule', requirePermission('reschedule_appointment'), reschedule);

module.exports = router;
