const db = require('../config/database');
const AppError = require('../utils/AppError');
const { canAccessPatient, assertPatientAccess } = require('../utils/patientAccess');
const auditLog = require('../utils/auditLog');

const VACCINATION_COLUMNS = `v.id, v.patient_id, v.administered_by, v.vaccine_name,
  v.dose_number, v.lot_number, v.manufacturer, v.site,
  v.scheduled_date, v.administered_date, v.next_dose_date,
  v.status, v.notes, v.created_at, v.updated_at`;

const VACCINATION_SELECT = `
  SELECT ${VACCINATION_COLUMNS},
         u.first_name || ' ' || u.last_name AS administered_by_name
  FROM vaccinations v
  LEFT JOIN users u ON u.id = v.administered_by`;

function mapVaccination(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    administeredBy: row.administered_by,
    administeredByName: row.administered_by_name || null,
    vaccineName: row.vaccine_name,
    doseNumber: row.dose_number,
    lotNumber: row.lot_number,
    manufacturer: row.manufacturer,
    site: row.site,
    scheduledDate: row.scheduled_date,
    administeredDate: row.administered_date,
    nextDoseDate: row.next_dose_date,
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
      `${VACCINATION_SELECT}
       WHERE v.patient_id = $1
       ORDER BY COALESCE(v.administered_date, v.scheduled_date) DESC, v.created_at DESC`,
      [patientId]
    );

    res.json({ status: 'success', data: result.rows.map(mapVaccination) });
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403);
    }

    const result = await db.query(
      `${VACCINATION_SELECT}
       WHERE v.id = $1 AND v.patient_id = $2`,
      [id, patientId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Vaccination record not found.', 404);
    }

    res.json({ status: 'success', data: mapVaccination(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const {
      vaccineName, doseNumber, lotNumber, manufacturer, site,
      scheduledDate, administeredDate, nextDoseDate, status, notes,
    } = req.body;

    // Auth checked before existence to prevent patient ID enumeration
    await assertPatientAccess(req.user, patientId);

    const administeredBy = req.user.role !== 'patient' ? req.user.id : null;

    const result = await db.query(
      `WITH inserted AS (
         INSERT INTO vaccinations
           (patient_id, administered_by, vaccine_name, dose_number, lot_number,
            manufacturer, site, scheduled_date, administered_date, next_dose_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *
       )
       SELECT ${VACCINATION_COLUMNS.replace(/v\./g, 'i.')},
              u.first_name || ' ' || u.last_name AS administered_by_name
       FROM inserted i
       LEFT JOIN users u ON u.id = i.administered_by`,
      [
        patientId, administeredBy, vaccineName, doseNumber ?? 1,
        lotNumber ?? null, manufacturer ?? null, site ?? null,
        scheduledDate ?? null, administeredDate ?? null, nextDoseDate ?? null,
        status ?? 'scheduled', notes ?? null,
      ]
    );

    await auditLog({
      userId: req.user.id,
      action: 'CREATE_VACCINATION',
      resourceType: 'vaccination',
      resourceId: result.rows[0].id,
      ip: req.ip,
    });

    res.status(201).json({ status: 'success', data: mapVaccination(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403);
    }

    // Build SET clauses only for fields present in the request body
    const fields = [];
    const values = [];
    const body = req.body;

    if ('vaccineName' in body) { values.push(body.vaccineName); fields.push(`vaccine_name = $${values.length}`); }
    if ('doseNumber' in body) { values.push(body.doseNumber); fields.push(`dose_number = $${values.length}`); }
    if ('lotNumber' in body) { values.push(body.lotNumber ?? null); fields.push(`lot_number = $${values.length}`); }
    if ('manufacturer' in body) { values.push(body.manufacturer ?? null); fields.push(`manufacturer = $${values.length}`); }
    if ('site' in body) { values.push(body.site ?? null); fields.push(`site = $${values.length}`); }
    if ('scheduledDate' in body) { values.push(body.scheduledDate ?? null); fields.push(`scheduled_date = $${values.length}`); }
    if ('administeredDate' in body) { values.push(body.administeredDate ?? null); fields.push(`administered_date = $${values.length}`); }
    if ('nextDoseDate' in body) { values.push(body.nextDoseDate ?? null); fields.push(`next_dose_date = $${values.length}`); }
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
         UPDATE vaccinations
         SET ${fields.join(', ')}
         WHERE id = $${idIdx} AND patient_id = $${patientIdx}
         RETURNING *
       )
       SELECT ${VACCINATION_COLUMNS.replace(/v\./g, 'up.')},
              u.first_name || ' ' || u.last_name AS administered_by_name
       FROM updated up
       LEFT JOIN users u ON u.id = up.administered_by`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Vaccination record not found.', 404);
    }

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_VACCINATION',
      resourceType: 'vaccination',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', data: mapVaccination(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s vaccination records.', 403);
    }

    const result = await db.query(
      'DELETE FROM vaccinations WHERE id = $1 AND patient_id = $2 RETURNING id',
      [id, patientId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Vaccination record not found.', 404);
    }

    await auditLog({
      userId: req.user.id,
      action: 'DELETE_VACCINATION',
      resourceType: 'vaccination',
      resourceId: id,
      ip: req.ip,
    });

    res.json({ status: 'success', message: 'Vaccination record removed.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getByPatientId, getById, create, update, remove };
