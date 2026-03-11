const express = require('express');
const router = express.Router();
const { getAll, getById, getMe, getHistory, getMyHistory, getPrescriptions, updateById, uploadProfileImage, deleteProfileImage, exportMedicalPdf, exportMyMedicalPdf } = require('../controllers/patients.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const validate = require('../middleware/validate');
const { updatePatientValidation, getPrescriptionsValidation } = require('../validators/patients.validators');
const { upload } = require('../middleware/upload');
const allergiesRoutes = require('./allergies.routes');
const vaccinationsRoutes = require('./vaccinations.routes');
const { sensitiveDataLimiter, exportLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(resolveSubject);

router.use('/:patientId/allergies', allergiesRoutes);
router.use('/:patientId/vaccinations', vaccinationsRoutes);

router.get('/me', authorize('patient'), getMe);
router.get('/me/history', authorize('patient'), getMyHistory);
router.get('/me/export-pdf', authorize('patient'), exportLimiter, exportMyMedicalPdf);
router.get('/', authorize('doctor', 'nurse', 'admin'), sensitiveDataLimiter, getAll);
router.get('/:id', authorize('doctor', 'nurse', 'admin'), sensitiveDataLimiter, getById);
router.get('/:id/history', authorize('doctor', 'nurse', 'admin', 'patient'), sensitiveDataLimiter, getHistory);
router.get('/:id/prescriptions', authorize('doctor', 'nurse', 'admin', 'patient'), sensitiveDataLimiter, validate(getPrescriptionsValidation), getPrescriptions);
router.get('/:id/export-pdf', authorize('doctor', 'nurse', 'admin', 'patient'), exportLimiter, exportMedicalPdf);
router.patch('/:id', requirePermission('edit_patient', 'edit_own_profile'), validate(updatePatientValidation), updateById);
router.post('/:id/profile-image', requirePermission('edit_patient', 'edit_own_profile'), upload.single('profileImage'), uploadProfileImage);
router.delete('/:id/profile-image', requirePermission('edit_patient', 'edit_own_profile'), deleteProfileImage);

module.exports = router;
