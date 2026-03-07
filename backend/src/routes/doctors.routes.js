const express = require('express');
const router = express.Router();
const { getAll, getById } = require('../controllers/doctors.controller');
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', requirePermission('view_patients', 'view_appointments', 'view_own_appointments'), getAll);
router.get('/:id', requirePermission('view_patients', 'view_appointments', 'view_own_appointments'), getById);

module.exports = router;
