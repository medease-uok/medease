const db = require('../config/database');
const AppError = require('../utils/AppError');
const auditLog = require('../utils/auditLog');
const { invalidatePolicyCache } = require('../utils/abac');

const VALID_RESOURCE_TYPES = ['appointment', 'medical_record', 'prescription', 'lab_report', 'patient'];
const VALID_EFFECTS = ['allow', 'deny'];

const getPolicies = async (req, res, next) => {
  try {
    const { resourceType } = req.query;
    let query = `SELECT id, name, description, resource_type, conditions, effect,
                        priority, is_active, created_at, updated_at
                 FROM abac_policies`;
    const params = [];

    if (resourceType) {
      query += ' WHERE resource_type = $1';
      params.push(resourceType);
    }

    query += ' ORDER BY resource_type, priority DESC, name';

    const result = await db.query(query, params);

    res.json({
      status: 'success',
      data: result.rows.map(mapPolicy),
    });
  } catch (err) {
    return next(err);
  }
};

const getPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, name, description, resource_type, conditions, effect,
              priority, is_active, created_at, updated_at
       FROM abac_policies WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Policy not found.', 404);
    }

    res.json({ status: 'success', data: mapPolicy(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const createPolicy = async (req, res, next) => {
  try {
    const { name, description, resourceType, conditions, effect, priority } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Policy name is required.', 400);
    }
    if (!resourceType || !VALID_RESOURCE_TYPES.includes(resourceType)) {
      throw new AppError(`Invalid resource type. Must be one of: ${VALID_RESOURCE_TYPES.join(', ')}`, 400);
    }
    if (!conditions || typeof conditions !== 'object') {
      throw new AppError('Conditions must be a valid JSON object.', 400);
    }
    if (effect && !VALID_EFFECTS.includes(effect)) {
      throw new AppError('Effect must be "allow" or "deny".', 400);
    }

    validateConditions(conditions);

    const result = await db.query(
      `INSERT INTO abac_policies (name, description, resource_type, conditions, effect, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, resource_type, conditions, effect, priority, is_active, created_at`,
      [
        name.trim(),
        description || null,
        resourceType,
        JSON.stringify(conditions),
        effect || 'allow',
        priority ?? 0,
      ]
    );

    await invalidatePolicyCache();

    await auditLog({
      userId: req.user.id,
      action: 'CREATE_ABAC_POLICY',
      resourceType: 'abac_policy',
      resourceId: result.rows[0].id,
      ip: req.ip,
    });

    res.status(201).json({ status: 'success', data: mapPolicy(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return next(new AppError('A policy with this name already exists.', 409));
    }
    return next(err);
  }
};

const updatePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, resourceType, conditions, effect, priority, isActive } = req.body;

    const existing = await db.query('SELECT id FROM abac_policies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Policy not found.', 404);
    }

    if (resourceType && !VALID_RESOURCE_TYPES.includes(resourceType)) {
      throw new AppError(`Invalid resource type. Must be one of: ${VALID_RESOURCE_TYPES.join(', ')}`, 400);
    }
    if (effect && !VALID_EFFECTS.includes(effect)) {
      throw new AppError('Effect must be "allow" or "deny".', 400);
    }
    if (conditions) {
      if (typeof conditions !== 'object') {
        throw new AppError('Conditions must be a valid JSON object.', 400);
      }
      validateConditions(conditions);
    }

    await db.query(
      `UPDATE abac_policies SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         resource_type = COALESCE($4, resource_type),
         conditions = COALESCE($5, conditions),
         effect = COALESCE($6, effect),
         priority = COALESCE($7, priority),
         is_active = COALESCE($8, is_active),
         updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        name?.trim() || null,
        description !== undefined ? description : null,
        resourceType || null,
        conditions ? JSON.stringify(conditions) : null,
        effect || null,
        priority ?? null,
        isActive !== undefined ? isActive : null,
      ]
    );

    await invalidatePolicyCache();

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_ABAC_POLICY',
      resourceType: 'abac_policy',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Policy updated successfully.' });
  } catch (err) {
    if (err.code === '23505') {
      return next(new AppError('A policy with this name already exists.', 409));
    }
    return next(err);
  }
};

const deletePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM abac_policies WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Policy not found.', 404);
    }

    await invalidatePolicyCache();

    await auditLog({
      userId: req.user.id,
      action: 'DELETE_ABAC_POLICY',
      resourceType: 'abac_policy',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Policy deleted successfully.' });
  } catch (err) {
    return next(err);
  }
};

function validateConditions(conditions) {
  if (conditions.any) {
    if (!Array.isArray(conditions.any)) throw new AppError('"any" must be an array.', 400);
    conditions.any.forEach(validateConditions);
    return;
  }
  if (conditions.all) {
    if (!Array.isArray(conditions.all)) throw new AppError('"all" must be an array.', 400);
    conditions.all.forEach(validateConditions);
    return;
  }
  const keys = Object.keys(conditions);
  if (keys.length === 0) throw new AppError('Empty condition object.', 400);

  const validOps = ['equals', 'not_equals', 'in', 'not_in', 'equals_ref', 'exists'];
  for (const key of keys) {
    const ops = conditions[key];
    if (typeof ops !== 'object' || Array.isArray(ops)) {
      throw new AppError(`Invalid operators for "${key}".`, 400);
    }
    for (const op of Object.keys(ops)) {
      if (!validOps.includes(op)) {
        throw new AppError(`Invalid operator "${op}". Must be one of: ${validOps.join(', ')}`, 400);
      }
    }
  }
}

function mapPolicy(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    resourceType: row.resource_type,
    conditions: row.conditions,
    effect: row.effect,
    priority: row.priority,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
};
