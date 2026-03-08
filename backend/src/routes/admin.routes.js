const express = require('express');
const router = express.Router();
const { getUsers, getPendingUsers, approveUser, rejectUser, getAuditLogs, getProfileChangeHistory } = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/users/pending', getPendingUsers);
router.patch('/users/:id/approve', approveUser);
router.delete('/users/:id/reject', rejectUser);
router.get('/audit-logs', getAuditLogs);
router.get('/profile-changes', getProfileChangeHistory);

module.exports = router;
