const express = require('express')
const router = express.Router()
const { getAll, create, updateStatus } = require('../controllers/labTestRequests.controller')
const authenticate = require('../middleware/authenticate')
const { requirePermission } = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')

router.use(authenticate)
router.use(resolveSubject)

router.get('/', requirePermission('view_lab_requests'), getAll)
router.post('/', requirePermission('request_lab_test'), create)
router.patch('/:id', requirePermission('update_lab_request', 'request_lab_test'), updateStatus)

module.exports = router
