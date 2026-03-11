const db = require('../config/database');
const AppError = require('../utils/AppError');
const { canAccessPatient, assertPatientAccess } = require('../utils/patientAccess');
const auditLog = require('../utils/auditLog');

const CONDITION_COLUMNS = `c.id, c.patient_id, c.diagnosed_by, c.condition_name,
  c.severity, c.diagnosed_date, c.resolved_date, c.treatment,
  c.medications, c.status, c.notes, c.created_at, c.updated_at`;

const CONDITION_SELECT = `
  SELECT ${CONDITION_COLUMNS},
         u.first_name || ' ' || u.last_name AS diagnosed_by_name
  FROM chronic_conditions c
  LEFT JOIN users u ON u.id = c.diagnosed_by`;

function mapCondition(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    diagnosedBy: row.diagnosed_by,
    diagnosedByName: row.diagnosed_by_name || null,
    conditionName: row.condition_name,
    severity: row.severity,
    diagnosedDate: row.diagnosed_date,
    resolvedDate: row.resolved_date,
    treatment: row.treatment,
    medications: row.medications,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const getByPatientId = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    await assertPatientAccess(req.user, patientId);

    const result = await db.query(
      `${CONDITION_SELECT}
       WHERE c.patient_id = $1
       ORDER BY c.status = 'active' DESC, c.diagnosed_date DESC NULLS LAST, c.created_at DESC`,
      [patientId]
    );

    res.json({ status: 'success', data: result.rows.map(mapCondition) });
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s chronic condition records.', 403);
    }

    const result = await db.query(
      `${CONDITION_SELECT}
       WHERE c.id = $1 AND c.patient_id = $2`,
      [id, patientId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Chronic condition record not found.', 404);
    }

    res.json({ status: 'success', data: mapCondition(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const {
      conditionName, severity, diagnosedDate, resolvedDate,
      treatment, medications, status, notes,
    } = req.body;

    await assertPatientAccess(req.user, patientId);

    const diagnosedBy = req.user.role !== 'patient' ? req.user.id : null;

    const result = await db.query(
      `WITH inserted AS (
         INSERT INTO chronic_conditions
           (patient_id, diagnosed_by, condition_name, severity, diagnosed_date,
            resolved_date, treatment, medications, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *
       )
       SELECT ${CONDITION_COLUMNS.replace(/c\./g, 'i.')},
              u.first_name || ' ' || u.last_name AS diagnosed_by_name
       FROM inserted i
       LEFT JOIN users u ON u.id = i.diagnosed_by`,
      [
        patientId, diagnosedBy, conditionName, severity ?? 'moderate',
        diagnosedDate ?? null, resolvedDate ?? null,
        treatment ?? null, medications ?? null,
        status ?? 'active', notes ?? null,
      ]
    );

    await auditLog({
      userId: req.user.id,
      action: 'CREATE_CHRONIC_CONDITION',
      resourceType: 'chronic_condition',
      resourceId: result.rows[0].id,
      ip: req.ip,
    });

    res.status(201).json({ status: 'success', data: mapCondition(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s chronic condition records.', 403);
    }

    const fields = [];
    const values = [];
    const body = req.body;

    if ('conditionName' in body) { values.push(body.conditionName); fields.push(`condition_name = $${values.length}`); }
    if ('severity' in body) { values.push(body.severity); fields.push(`severity = $${values.length}`); }
    if ('diagnosedDate' in body) { values.push(body.diagnosedDate ?? null); fields.push(`diagnosed_date = $${values.length}`); }
    if ('resolvedDate' in body) { values.push(body.resolvedDate ?? null); fields.push(`resolved_date = $${values.length}`); }
    if ('treatment' in body) { values.push(body.treatment ?? null); fields.push(`treatment = $${values.length}`); }
    if ('medications' in body) { values.push(body.medications ?? null); fields.push(`medications = $${values.length}`); }
    if ('status' in body) { values.push(body.status); fields.push(`status = $${values.length}`); }
    if ('notes' in body) { values.push(body.notes ?? null); fields.push(`notes = $${values.length}`); }

    if (fields.length === 0) {
      throw new AppError('No valid fields provided for update.', 400);
    }

    fields.push('updated_at = NOW()');
    const idIdx = values.length + 1;
    const patientIdx = values.length + 2;
    values.push(id, patientId);

    const result = await db.query(
      `WITH updated AS (
         UPDATE chronic_conditions
         SET ${fields.join(', ')}
         WHERE id = $${idIdx} AND patient_id = $${patientIdx}
         RETURNING *
       )
       SELECT ${CONDITION_COLUMNS.replace(/c\./g, 'up.')},
              u.first_name || ' ' || u.last_name AS diagnosed_by_name
       FROM updated up
       LEFT JOIN users u ON u.id = up.diagnosed_by`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Chronic condition record not found.', 404);
    }

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_CHRONIC_CONDITION',
      resourceType: 'chronic_condition',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', data: mapCondition(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s chronic condition records.', 403);
    }

    const result = await db.query(
      'DELETE FROM chronic_conditions WHERE id = $1 AND patient_id = $2 RETURNING id',
      [id, patientId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Chronic condition record not found.', 404);
    }

    await auditLog({
      userId: req.user.id,
      action: 'DELETE_CHRONIC_CONDITION',
      resourceType: 'chronic_condition',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Chronic condition record removed.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getByPatientId, getById, create, update, remove };
