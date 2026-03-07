const express = require('express');
const router = express.Router({ mergeParams: true });
const { getByPatientId, create, update, remove } = require('../controllers/allergies.controller');
const { requirePermission } = require('../middleware/authorize');
const { checkResourceAccess } = require('../middleware/abac');
const validate = require('../middleware/validate');
const { createAllergyValidation, updateAllergyValidation } = require('../validators/allergies.validators');

router.get('/', checkResourceAccess('patient', 'patientId'), getByPatientId);
router.post('/', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient', 'patientId'), validate(createAllergyValidation), create);
router.patch('/:id', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient', 'patientId'), validate(updateAllergyValidation), update);
router.delete('/:id', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient', 'patientId'), remove);

module.exports = router;
