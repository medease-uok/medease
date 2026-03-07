const express = require('express');
const router = express.Router();
const {
  getPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy,
} = require('../controllers/abac.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getPolicies);
router.get('/:id', getPolicy);
router.post('/', createPolicy);
router.patch('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

module.exports = router;
