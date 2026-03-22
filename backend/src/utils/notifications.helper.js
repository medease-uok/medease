const pool = require('../config/database');

async function notifyAdmins(title, message, referenceId) {
  try {
    const { rows: admins } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
    if (admins.length > 0) {
      const adminIds = admins.map(a => a.id);
      await pool.query(
        `INSERT INTO notifications (recipient_id, type, title, message, reference_id, reference_type)
         SELECT unnest($1::uuid[]), 'system', $2, $3, $4, 'inventory'
         ON CONFLICT DO NOTHING`,
        [adminIds, title, message, referenceId]
      );
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
}

module.exports = { notifyAdmins };
