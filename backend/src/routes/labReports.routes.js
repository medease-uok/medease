const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/labReports.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', requirePermission('view_lab_reports', 'view_own_lab_reports'), getAll);

module.exports = router;
