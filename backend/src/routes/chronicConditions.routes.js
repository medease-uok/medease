const express = require('express');
const router = express.Router({ mergeParams: true });
const { getByPatientId, getById, create, update, remove } = require('../controllers/chronicConditions.controller');
const { requirePermission } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createChronicConditionValidation, updateChronicConditionValidation } = require('../validators/chronicConditions.validators');

router.get('/', getByPatientId);
router.get('/:id', getById);
router.post('/', requirePermission('create_chronic_condition'), validate(createChronicConditionValidation), create);
router.patch('/:id', requirePermission('edit_chronic_condition'), validate(updateChronicConditionValidation), update);
router.delete('/:id', requirePermission('delete_chronic_condition'), remove);

module.exports = router;
