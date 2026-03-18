const express = require('express')
const router = express.Router()
const { getAll, getById, create, update, remove } = require('../controllers/prescriptionTemplates.controller')
const authenticate = require('../middleware/authenticate')
const { requirePermission } = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')

router.use(authenticate)
router.use(resolveSubject)

router.get('/', requirePermission('create_prescription'), getAll)
router.get('/:id', requirePermission('create_prescription'), getById)
router.post('/', requirePermission('create_prescription'), create)
router.put('/:id', requirePermission('create_prescription'), update)
router.delete('/:id', requirePermission('create_prescription'), remove)

module.exports = router
