const express = require('express');
const router = express.Router({ mergeParams: true });
const { getByPatientId, create, update, remove } = require('../controllers/allergies.controller');
const { requirePermission } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createAllergyValidation, updateAllergyValidation } = require('../validators/allergies.validators');

router.get('/', getByPatientId);
router.post('/', requirePermission('edit_patient', 'edit_own_profile'), validate(createAllergyValidation), create);
router.patch('/:id', requirePermission('edit_patient', 'edit_own_profile'), validate(updateAllergyValidation), update);
router.delete('/:id', requirePermission('edit_patient', 'edit_own_profile'), remove);

module.exports = router;
