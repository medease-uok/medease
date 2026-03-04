const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/labReports.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', getAll);

module.exports = router;
