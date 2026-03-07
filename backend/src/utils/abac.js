const db = require('../config/database');
const redis = require('../config/redis');

const POLICY_CACHE_KEY = 'abac:policies';
const POLICY_CACHE_TTL = 300; // 5 minutes

/**
 * Load all active ABAC policies, cached in Redis.
 */
async function loadPolicies() {
  const cached = await redis.get(POLICY_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  try {
    const result = await db.query(
      `SELECT id, name, resource_type, conditions, effect, priority
       FROM abac_policies
       WHERE is_active = true
       ORDER BY priority DESC`
    );
    const policies = result.rows;
    await redis.set(POLICY_CACHE_KEY, JSON.stringify(policies), 'EX', POLICY_CACHE_TTL);
    return policies;
  } catch {
    return [];
  }
}

/**
 * Invalidate the cached policies (call after CRUD operations on abac_policies).
 */
async function invalidatePolicyCache() {
  await redis.del(POLICY_CACHE_KEY);
}

/**
 * Resolve a dotted attribute path against a context object.
 * e.g. resolveAttr('subject.patientId', { subject: { patientId: '123' } }) => '123'
 */
function resolveAttr(path, context) {
  const parts = path.split('.');
  let value = context;
  for (const part of parts) {
    if (value == null) return undefined;
    value = value[part];
  }
  return value;
}

/**
 * Evaluate a single condition against the context.
 *
 * Condition formats:
 *   { "subject.role": { "equals": "admin" } }
 *   { "resource.patient_id": { "equals_ref": "subject.patientId" } }
 *   { "any": [ ...conditions ] }
 *   { "all": [ ...conditions ] }
 */
function evaluateCondition(condition, context) {
  if (condition.any) {
    return condition.any.some((c) => evaluateCondition(c, context));
  }
  if (condition.all) {
    return condition.all.every((c) => evaluateCondition(c, context));
  }

  const entries = Object.entries(condition);
  if (entries.length === 0) return false;

  const [attrPath, operators] = entries[0];
  const attrValue = resolveAttr(attrPath, context);

  for (const [op, expected] of Object.entries(operators)) {
    switch (op) {
      case 'equals':
        if (String(attrValue) !== String(expected)) return false;
        break;
      case 'not_equals':
        if (String(attrValue) === String(expected)) return false;
        break;
      case 'in':
        if (!Array.isArray(expected) || !expected.map(String).includes(String(attrValue))) return false;
        break;
      case 'not_in':
        if (Array.isArray(expected) && expected.map(String).includes(String(attrValue))) return false;
        break;
      case 'equals_ref': {
        const refValue = resolveAttr(expected, context);
        if (attrValue == null || refValue == null || String(attrValue) !== String(refValue)) return false;
        break;
      }
      case 'exists':
        if (expected && attrValue == null) return false;
        if (!expected && attrValue != null) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

/**
 * Evaluate ABAC policies for a given resource type.
 *
 * @param {string} resourceType - e.g. 'appointment', 'medical_record'
 * @param {object} subject - subject attributes { id, role, patientId, doctorId, ... }
 * @param {object} resource - resource attributes from the database row
 * @returns {boolean} true if access is allowed
 */
async function evaluateAccess(resourceType, subject, resource) {
  const allPolicies = await loadPolicies();
  const policies = allPolicies.filter((p) => p.resource_type === resourceType);

  if (policies.length === 0) return true; // No policies = unrestricted

  const context = { subject, resource };

  // Check deny policies first (highest priority first, already sorted)
  const denyPolicies = policies.filter((p) => p.effect === 'deny');
  for (const policy of denyPolicies) {
    if (evaluateCondition(policy.conditions, context)) {
      return false;
    }
  }

  // Check allow policies — at least one must match
  const allowPolicies = policies.filter((p) => p.effect === 'allow');
  if (allowPolicies.length === 0) return true;

  return allowPolicies.some((policy) => evaluateCondition(policy.conditions, context));
}

/**
 * Build SQL WHERE clause fragments from ABAC policies for list filtering.
 * Returns { clause, params } that can be appended to a query.
 *
 * @param {string} resourceType - e.g. 'appointment'
 * @param {object} subject - subject attributes
 * @param {object} columnMap - maps resource attribute names to SQL column expressions
 *   e.g. { patient_id: 'a.patient_id', doctor_id: 'a.doctor_id' }
 * @param {number} paramOffset - starting $N index for query params
 */
async function buildAccessFilter(resourceType, subject, columnMap, paramOffset = 1) {
  const allPolicies = await loadPolicies();
  const policies = allPolicies.filter(
    (p) => p.resource_type === resourceType && p.effect === 'allow' && p.is_active !== false
  );

  if (policies.length === 0) return { clause: 'TRUE', params: [] };

  const orClauses = [];
  const params = [];

  for (const policy of policies) {
    const savedLength = params.length;
    const fragment = conditionToSQL(policy.conditions, subject, columnMap, params, paramOffset);
    if (fragment) {
      orClauses.push(fragment.sql);
    } else {
      params.length = savedLength; // rollback any orphaned params
    }
  }

  if (orClauses.length === 0) return { clause: 'FALSE', params: [] };

  return {
    clause: `(${orClauses.join(' OR ')})`,
    params,
  };
}

/**
 * Recursively convert a condition tree to SQL.
 */
function conditionToSQL(condition, subject, columnMap, params, paramOffset) {
  if (condition.any) {
    const parts = condition.any
      .map((c) => conditionToSQL(c, subject, columnMap, params, paramOffset))
      .filter(Boolean);
    if (parts.length === 0) return null;
    return { sql: `(${parts.map((p) => p.sql).join(' OR ')})` };
  }

  if (condition.all) {
    const savedLength = params.length;
    const parts = condition.all
      .map((c) => conditionToSQL(c, subject, columnMap, params, paramOffset));
    // In an AND block, if any condition is null (failed), the whole block fails
    if (parts.some((p) => p === null)) {
      params.length = savedLength; // rollback any params pushed by matched siblings
      return null;
    }
    return { sql: `(${parts.map((p) => p.sql).join(' AND ')})` };
  }

  const entries = Object.entries(condition);
  if (entries.length === 0) return null;

  const [attrPath, operators] = entries[0];

  // Subject-only conditions evaluate immediately
  if (attrPath.startsWith('subject.')) {
    const result = evaluateCondition(condition, { subject });
    return result ? { sql: 'TRUE' } : null;
  }

  // Resource attribute conditions become SQL
  if (attrPath.startsWith('resource.')) {
    const resourceField = attrPath.replace('resource.', '');
    const sqlCol = columnMap[resourceField];
    if (!sqlCol) return null;

    const [op, expected] = Object.entries(operators)[0];

    switch (op) {
      case 'equals': {
        const idx = paramOffset + params.length;
        params.push(expected);
        return { sql: `${sqlCol} = $${idx}` };
      }
      case 'equals_ref': {
        const refValue = resolveAttr(expected, { subject });
        if (refValue == null) return null;
        const idx = paramOffset + params.length;
        params.push(refValue);
        return { sql: `${sqlCol} = $${idx}` };
      }
      case 'in': {
        if (!Array.isArray(expected) || expected.length === 0) return null;
        const placeholders = expected.map((v) => {
          const idx = paramOffset + params.length;
          params.push(v);
          return `$${idx}`;
        });
        return { sql: `${sqlCol} IN (${placeholders.join(', ')})` };
      }
      case 'not_equals': {
        const idx = paramOffset + params.length;
        params.push(expected);
        return { sql: `${sqlCol} != $${idx}` };
      }
      case 'exists':
        return { sql: expected ? `${sqlCol} IS NOT NULL` : `${sqlCol} IS NULL` };
      default:
        return null;
    }
  }

  return null;
}

module.exports = {
  evaluateAccess,
  buildAccessFilter,
  loadPolicies,
  invalidatePolicyCache,
  evaluateCondition,
};
