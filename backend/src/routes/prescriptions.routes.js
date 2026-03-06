const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/prescriptions.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', requirePermission('view_prescriptions', 'view_own_prescriptions'), getAll);

module.exports = router;
