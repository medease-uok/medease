const express = require('express');
const router = express.Router();
const { getAll, getById, upload, remove } = require('../controllers/medicalDocuments.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { sensitiveDataLimiter } = require('../middleware/rateLimit');
const { documentUpload } = require('../middleware/upload');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', sensitiveDataLimiter, requirePermission('view_documents', 'view_own_documents'), getAll);
router.get('/:id', sensitiveDataLimiter, requirePermission('view_documents', 'view_own_documents'), getById);
router.post('/', documentUpload.single('file'), requirePermission('upload_document'), upload);
router.delete('/:id', requirePermission('delete_document', 'upload_document'), remove);

module.exports = router;
