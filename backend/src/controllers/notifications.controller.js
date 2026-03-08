const db = require('../config/database');
const AppError = require('../utils/AppError');

const mapNotification = (row) => ({
  id: row.id,
  recipientId: row.recipient_id,
  type: row.type,
  title: row.title,
  message: row.message,
  isRead: row.is_read,
  referenceId: row.reference_id,
  referenceType: row.reference_type,
  createdAt: row.created_at,
});

const getAll = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: result.rows.map(mapNotification),
    });
  } catch (err) {
    return next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE recipient_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: { count: result.rows[0].count },
    });
  } catch (err) {
    return next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND recipient_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found.', 404);
    }

    res.json({
      status: 'success',
      data: mapNotification(result.rows[0]),
    });
  } catch (err) {
    return next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = true
       WHERE recipient_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({ status: 'success', message: 'All notifications marked as read.' });
  } catch (err) {
    return next(err);
  }
};

const createNotification = async ({ recipientId, type, title, message, referenceId, referenceType }) => {
  try {
    await db.query(
      `INSERT INTO notifications (recipient_id, type, title, message, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recipientId, type, title, message || null, referenceId || null, referenceType || null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = { getAll, getUnreadCount, markAsRead, markAllAsRead, createNotification };
