const db = require('../config/database');

async function auditLog({ userId, action, resourceType, resourceId = null, ip, success = true, details = null }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, ip, success, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = auditLog;
