const express = require('express')
const router = express.Router()
const { getAll, create, updateStatus } = require('../controllers/prescriptions.controller')
const authenticate = require('../middleware/authenticate')
const { requirePermission } = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')
const { sensitiveDataLimiter, apiLimiter } = require('../middleware/rateLimit')
const { prescriptionImageUpload } = require('../middleware/upload')

// Apply rate limiting before authentication to protect auth layer from DoS
router.use(apiLimiter)

router.use(authenticate)
router.use(resolveSubject)

router.get('/', sensitiveDataLimiter, requirePermission('view_prescriptions', 'view_own_prescriptions'), getAll)
router.post('/', requirePermission('create_prescription'), prescriptionImageUpload.single('image'), create)
router.patch('/:id/status', requirePermission('dispense_prescription', 'cancel_prescription'), updateStatus)

module.exports = router
