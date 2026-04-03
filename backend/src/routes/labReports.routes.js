const express = require('express');
const router = express.Router();
const { getAll, create, update, getDownloadUrl } = require('../controllers/labReports.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const resolveSubject = require('../middleware/resolveSubject');
const { sensitiveDataLimiter, apiLimiter } = require('../middleware/rateLimit');
const { labReportUpload } = require('../middleware/upload');
const { validateUploadedFile } = require('../middleware/fileValidation');

router.use(authenticate);
router.use(resolveSubject);

router.get('/', sensitiveDataLimiter, requirePermission('view_lab_reports', 'view_own_lab_reports'), getAll);
router.get('/:id/download-url', sensitiveDataLimiter, requirePermission('view_lab_reports', 'view_own_lab_reports'), getDownloadUrl);
router.post(
  '/',
  apiLimiter,
  labReportUpload.single('file'),
  validateUploadedFile,
  requirePermission('create_lab_report'),
  create
);
router.patch('/:id', requirePermission('edit_lab_report'), update);

module.exports = router;
