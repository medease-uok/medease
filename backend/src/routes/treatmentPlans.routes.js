const express = require('express')
const router = express.Router({ mergeParams: true })
const {
  getByPatientId, getById, create, update, remove,
  addItem, updateItem, removeItem,
} = require('../controllers/treatmentPlans.controller')
const { requirePermission } = require('../middleware/authorize')
const validate = require('../middleware/validate')
const {
  createTreatmentPlanValidation, updateTreatmentPlanValidation,
  createItemValidation, updateItemValidation,
} = require('../validators/treatmentPlans.validators')

router.get('/', requirePermission('view_treatment_plans', 'view_own_treatment_plans'), getByPatientId)
router.get('/:id', requirePermission('view_treatment_plans', 'view_own_treatment_plans'), getById)
router.post('/', requirePermission('create_treatment_plan'), validate(createTreatmentPlanValidation), create)
router.patch('/:id', requirePermission('edit_treatment_plan'), validate(updateTreatmentPlanValidation), update)
router.delete('/:id', requirePermission('delete_treatment_plan'), remove)

// Plan items
router.post('/:id/items', requirePermission('edit_treatment_plan'), validate(createItemValidation), addItem)
router.patch('/:id/items/:itemId', requirePermission('edit_treatment_plan'), validate(updateItemValidation), updateItem)
router.delete('/:id/items/:itemId', requirePermission('edit_treatment_plan'), removeItem)

module.exports = router
