const express = require('express');
const router = express.Router();
const { getAll, getById, create, createRecurring, cancelSeries, updateStatus, cancelAppointment, reschedule, markNoShow, massReschedule } = require('../controllers/appointments.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { sensitiveDataLimiter, apiLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', sensitiveDataLimiter, requirePermission('view_appointments', 'view_own_appointments'), getAll);
router.get('/:id', sensitiveDataLimiter, requirePermission('view_appointments', 'view_own_appointments'), getById);
router.post('/', apiLimiter, requirePermission('create_appointment'), create);
router.post('/recurring', apiLimiter, requirePermission('create_appointment'), createRecurring);
router.post('/:id/no-show', apiLimiter, requirePermission('update_appointment_status'), markNoShow);
router.patch('/series/:seriesId/cancel', apiLimiter, requirePermission('update_appointment_status', 'cancel_appointment'), cancelSeries);
router.patch('/:id/status', apiLimiter, requirePermission('update_appointment_status', 'cancel_appointment'), updateStatus);
router.delete('/:id', apiLimiter, requirePermission('update_appointment_status', 'cancel_appointment'), cancelAppointment);
router.put('/:id/reschedule', apiLimiter, requirePermission('reschedule_appointment'), reschedule);
router.post('/mass-reschedule', apiLimiter, requirePermission('reschedule_appointment'), massReschedule);

module.exports = router;
