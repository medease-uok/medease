const express = require('express')
const router = express.Router({ mergeParams: true })
const { getByPatientId, getById, create, update, remove } = require('../controllers/vaccinations.controller')
const { requirePermission } = require('../middleware/authorize')
const validate = require('../middleware/validate')
const { createVaccinationValidation, updateVaccinationValidation } = require('../validators/vaccinations.validators')

router.get('/', getByPatientId)
router.get('/:id', getById)
router.post('/', requirePermission('create_vaccination'), validate(createVaccinationValidation), create)
router.patch('/:id', requirePermission('edit_vaccination'), validate(updateVaccinationValidation), update)
router.delete('/:id', requirePermission('delete_vaccination'), remove)

module.exports = router
