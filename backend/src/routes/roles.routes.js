const express = require('express');
const router = express.Router();
const {
  getRoles, getRole, createRole, updateRole, deleteRole,
  getPermissions, assignRoleToUser, removeRoleFromUser, getUserRoles,
} = require('../controllers/roles.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/permissions', getPermissions);

router.get('/', getRoles);
router.get('/:id', getRole);
router.post('/', createRole);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);

router.get('/users/:id/roles', getUserRoles);
router.post('/users/:id/roles', assignRoleToUser);
router.delete('/users/:id/roles/:roleId', removeRoleFromUser);

module.exports = router;
