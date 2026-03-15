const express = require('express')
const router = express.Router()
const { getSchedule, upsertSchedule, getAvailableSlots } = require('../controllers/schedules.controller')
const authenticate = require('../middleware/authenticate')
const authorize = require('../middleware/authorize')
const { requirePermission } = require('../middleware/authorize')
const validate = require('../middleware/validate')
const {
  upsertScheduleValidation,
  getDoctorIdValidation,
  getSlotsValidation,
} = require('../validators/schedules.validators')

router.use(authenticate)

// Get a doctor's weekly schedule
router.get(
  '/:doctorId',
  getDoctorIdValidation,
  validate,
  requirePermission('view_doctor_slots'),
  getSchedule
)

// Update a doctor's schedule (doctor=own, admin=any)
router.put(
  '/:doctorId',
  upsertScheduleValidation,
  validate,
  authorize('doctor', 'admin'),
  upsertSchedule
)

// Get available slots for a specific date
router.get(
  '/:doctorId/slots',
  getSlotsValidation,
  validate,
  requirePermission('view_doctor_slots', 'create_appointment'),
  getAvailableSlots
)

module.exports = router
