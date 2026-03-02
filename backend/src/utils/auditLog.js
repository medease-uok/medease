const db = require('../config/database');

async function auditLog({ userId, action, resourceType, resourceId = null, ip, success = true }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, resourceType, resourceId, ip, success]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = auditLog;
