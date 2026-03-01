const express = require('express');
const router = express.Router();
const { getAll, getById, getMe } = require('../controllers/patients.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

router.get('/me', authorize('patient'), getMe);
router.get('/', authorize('doctor', 'nurse', 'admin'), getAll);
router.get('/:id', authorize('doctor', 'nurse', 'admin'), getById);

module.exports = router;
