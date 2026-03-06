const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/appointments.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', requirePermission('view_appointments', 'view_own_appointments'), getAll);

module.exports = router;
