const express = require('express')
const router = express.Router({ mergeParams: true })
const { getByPatientId, getById, create, update, remove } = require('../controllers/vaccinations.controller')
const { requirePermission } = require('../middleware/authorize')
const { checkResourceAccess } = require('../middleware/abac')
const validate = require('../middleware/validate')
const { createVaccinationValidation, updateVaccinationValidation } = require('../validators/vaccinations.validators')

router.get('/', checkResourceAccess('patient', 'patientId'), getByPatientId)
router.get('/:id', checkResourceAccess('patient', 'patientId'), getById)
router.post('/', requirePermission('create_vaccination'), checkResourceAccess('patient', 'patientId'), validate(createVaccinationValidation), create)
router.patch('/:id', requirePermission('edit_vaccination'), checkResourceAccess('patient', 'patientId'), validate(updateVaccinationValidation), update)
router.delete('/:id', requirePermission('delete_vaccination'), checkResourceAccess('patient', 'patientId'), remove)

module.exports = router
