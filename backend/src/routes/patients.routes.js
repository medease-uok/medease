const express = require('express');
const router = express.Router();
const { getAll, getById, getMe, updateById } = require('../controllers/patients.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { checkResourceAccess } = require('../middleware/abac');
const validate = require('../middleware/validate');
const { updatePatientValidation } = require('../validators/patients.validators');

router.use(authenticate);
router.use(resolveSubject);

router.get('/me', authorize('patient'), getMe);
router.get('/', authorize('doctor', 'nurse', 'admin'), getAll);
router.get('/:id', authorize('doctor', 'nurse', 'admin'), checkResourceAccess('patient'), getById);
router.patch('/:id', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient'), validate(updatePatientValidation), updateById);

module.exports = router;
