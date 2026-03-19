const express = require('express')
const router = express.Router()
const { getAll, getDoctorStats, getOverviewStats, create } = require('../controllers/patientFeedback.controller')
const authenticate = require('../middleware/authenticate')
const { requirePermission } = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')

router.use(authenticate)
router.use(resolveSubject)

router.get('/', requirePermission('view_feedback', 'view_own_feedback', 'view_doctor_feedback'), getAll)
router.get('/overview', requirePermission('view_feedback'), getOverviewStats)
router.get('/doctor/:doctorId', requirePermission('view_feedback', 'view_doctor_feedback'), getDoctorStats)
router.post('/', requirePermission('submit_feedback'), create)

module.exports = router
