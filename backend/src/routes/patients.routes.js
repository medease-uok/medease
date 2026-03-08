const express = require('express');
const router = express.Router();
const { getAll, getById, getMe, getHistory, getMyHistory, getPrescriptions, updateById, uploadProfileImage, deleteProfileImage } = require('../controllers/patients.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { checkResourceAccess } = require('../middleware/abac');
const validate = require('../middleware/validate');
const { updatePatientValidation, getPrescriptionsValidation } = require('../validators/patients.validators');
const { upload } = require('../middleware/upload');
const allergiesRoutes = require('./allergies.routes');
const { sensitiveDataLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(resolveSubject);

router.use('/:patientId/allergies', allergiesRoutes);

router.get('/me', authorize('patient'), getMe);
router.get('/me/history', authorize('patient'), getMyHistory);
router.get('/', authorize('doctor', 'nurse', 'admin'), sensitiveDataLimiter, getAll);
router.get('/:id', authorize('doctor', 'nurse', 'admin'), sensitiveDataLimiter, checkResourceAccess('patient'), getById);
router.get('/:id/history', authorize('doctor', 'nurse', 'admin', 'patient'), sensitiveDataLimiter, checkResourceAccess('patient'), getHistory);
router.get('/:id/prescriptions', authorize('doctor', 'nurse', 'admin', 'patient'), sensitiveDataLimiter, checkResourceAccess('patient'), validate(getPrescriptionsValidation), getPrescriptions);
router.patch('/:id', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient'), validate(updatePatientValidation), updateById);
router.post('/:id/profile-image', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient'), upload.single('profileImage'), uploadProfileImage);
router.delete('/:id/profile-image', requirePermission('edit_patient', 'edit_own_profile'), checkResourceAccess('patient'), deleteProfileImage);

module.exports = router;
