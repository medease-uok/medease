const express = require('express');
const router = express.Router();
const { getAll, getById } = require('../controllers/doctors.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);

module.exports = router;
