const db = require('../config/database');
const AppError = require('../utils/AppError');
const { canAccessPatient, assertPatientAccess } = require('../utils/patientAccess');

const getByPatientId = async (req, res, next) => {
  try {
    // lgtm [js/sensitive-get-query] - patientId is a UUID resource identifier, not a secret; RESTful API design with authorization checks
    const { patientId } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s allergies.', 403);
    }

    const result = await db.query(
      `SELECT id, patient_id, allergen, severity, reaction, noted_at, created_at
       FROM patient_allergies
       WHERE patient_id = $1
       ORDER BY severity DESC, allergen`,
      [patientId]
    );
    res.json({ status: 'success', data: result.rows.map(mapAllergy) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { allergen, severity, reaction, notedAt } = req.body;

    await assertPatientAccess(req.user, patientId);

    const result = await db.query(
      `INSERT INTO patient_allergies (patient_id, allergen, severity, reaction, noted_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, patient_id, allergen, severity, reaction, noted_at, created_at`,
      [patientId, allergen, severity, reaction || null, notedAt || null]
    );

    res.status(201).json({ status: 'success', data: mapAllergy(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;
    const { allergen, severity, reaction, notedAt } = req.body;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s allergies.', 403);
    }

    const result = await db.query(
      `UPDATE patient_allergies
       SET allergen = COALESCE($1, allergen),
           severity = COALESCE($2, severity),
           reaction = COALESCE($3, reaction),
           noted_at = COALESCE($4, noted_at)
       WHERE id = $5 AND patient_id = $6
       RETURNING id, patient_id, allergen, severity, reaction, noted_at, created_at`,
      [allergen, severity, reaction, notedAt, id, patientId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Allergy record not found.', 404);
    }

    res.json({ status: 'success', data: mapAllergy(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { patientId, id } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      throw new AppError('You do not have access to this patient\'s allergies.', 403);
    }

    const result = await db.query(
      'DELETE FROM patient_allergies WHERE id = $1 AND patient_id = $2 RETURNING id',
      [id, patientId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Allergy record not found.', 404);
    }

    res.json({ status: 'success', message: 'Allergy removed.' });
  } catch (err) {
    return next(err);
  }
};

function mapAllergy(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    allergen: row.allergen,
    severity: row.severity,
    reaction: row.reaction,
    notedAt: row.noted_at,
    createdAt: row.created_at,
  };
}

module.exports = { getByPatientId, create, update, remove };
