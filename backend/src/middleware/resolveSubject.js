const db = require('../config/database');
const redis = require('../config/redis');

const SUBJECT_CACHE_TTL = 300; // 5 minutes

/**
 * Middleware that resolves the authenticated user's profile IDs
 * (patientId, doctorId, nurseId, pharmacistId) and attaches them
 * to req.user for ABAC policy evaluation.
 *
 * Results are cached in Redis per user.
 */
const resolveSubject = async (req, res, next) => {
  if (!req.user) return next();

  const cacheKey = `subject:${req.user.id}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    Object.assign(req.user, JSON.parse(cached));
    return next();
  }

  const profileMap = {
    patient: { table: 'patients', field: 'patientId' },
    doctor: { table: 'doctors', field: 'doctorId' },
    nurse: { table: 'nurses', field: 'nurseId' },
    pharmacist: { table: 'pharmacists', field: 'pharmacistId' },
  };

  const attrs = {};
  const mapping = profileMap[req.user.role];

  if (mapping) {
    try {
      const result = await db.query(
        `SELECT id FROM ${mapping.table} WHERE user_id = $1 LIMIT 1`,
        [req.user.id]
      );
      if (result.rows.length > 0) {
        attrs[mapping.field] = result.rows[0].id;
      }
    } catch {
      // Profile table may not exist yet — skip
    }
  }

  await redis.set(cacheKey, JSON.stringify(attrs), 'EX', SUBJECT_CACHE_TTL);
  Object.assign(req.user, attrs);
  next();
};

/**
 * Invalidate a user's cached subject attributes.
 */
async function invalidateSubjectCache(userId) {
  await redis.del(`subject:${userId}`);
}

module.exports = resolveSubject;
module.exports.invalidateSubjectCache = invalidateSubjectCache;
