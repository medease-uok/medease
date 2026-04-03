const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const authorize = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')
const { getAll, create, cancel } = require('../controllers/waitlist.controller')
const { apiLimiter } = require('../middleware/rateLimit')

// Apply rate limiting before authentication to protect auth layer from DoS
router.use(apiLimiter)

// All routes require authentication
router.use(authenticate, resolveSubject)

// GET /waitlist — patient sees own, doctor/nurse/admin see all
router.get('/', authorize('patient', 'doctor', 'nurse', 'admin'), getAll)

// POST /waitlist — join a waitlist (patient books for themselves; staff can supply patientId)
router.post('/', authorize('patient', 'doctor', 'nurse', 'admin'), create)

// DELETE /waitlist/:id — cancel entry (ownership enforced in controller)
router.delete('/:id', authorize('patient', 'doctor', 'admin'), cancel)

module.exports = router
