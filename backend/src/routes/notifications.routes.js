const express = require('express');
const router = express.Router();
const { getAll, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notifications.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', getAll);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;
