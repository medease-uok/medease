const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');
const { isRefillEligible } = require('../utils/refillEligibility');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapPrescription = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  medication: row.medication,
  dosage: row.dosage,
  frequency: row.frequency,
  duration: row.duration,
  status: row.status,
  createdAt: row.created_at,
  pendingRefill: row.pending_refill ?? false,
});

const getAll = async (req, res, next) => {
  try {
    const subject = {
      id: req.user.id,
      role: req.user.role,
      patientId: req.user.patientId,
      doctorId: req.user.doctorId,
      pharmacistId: req.user.pharmacistId,
    };

    const columnMap = {
      patient_id: 'rx.patient_id',
      doctor_id: 'rx.doctor_id',
      status: 'rx.status',
    };

    const { clause, params } = await buildAccessFilter('prescription', subject, columnMap);

    const query = `
      SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage,
             rx.frequency, rx.duration, rx.status, rx.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
             EXISTS (
               SELECT 1 FROM prescription_refill_requests rr
               WHERE rr.prescription_id = rx.id AND rr.status = 'pending'
             ) AS pending_refill
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON rx.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY rx.created_at DESC`;

    const result = await db.query(query, params);

    const data = result.rows.map((row) => ({
      ...mapPrescription(row),
      refillEligible: ['active', 'expired'].includes(row.status) && isRefillEligible(row.created_at, row.duration),
    }));

    await auditLog({ userId: req.user.id, action: 'VIEW_PRESCRIPTIONS', resourceType: 'prescription', ip: req.ip });

    res.json({ status: 'success', data });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId, medication, dosage, frequency, duration, chronicConditionId } = req.body;

    if (!patientId || !medication || !dosage || !frequency) {
      throw new AppError('patientId, medication, dosage, and frequency are required.', 400);
    }

    const doctorId = req.user.doctorId;
    if (!doctorId) throw new AppError('Only doctors can create prescriptions.', 403);

    const [patientCheck, doctorInfo] = await Promise.all([
      db.query(
        `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
         FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [patientId]
      ),
      db.query(
        `SELECT u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
        [doctorId]
      ),
    ]);
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const patient = patientCheck.rows[0];
    const docName = doctorInfo.rows[0]
      ? `Dr. ${doctorInfo.rows[0].first_name} ${doctorInfo.rows[0].last_name}`
      : 'Your doctor';

    let validConditionId = null;
    if (chronicConditionId) {
      if (!UUID_RE.test(chronicConditionId)) {
        throw new AppError('chronicConditionId must be a valid UUID.', 400);
      }
      const ccCheck = await db.query(
        'SELECT id FROM chronic_conditions WHERE id = $1 AND patient_id = $2',
        [chronicConditionId, patientId]
      );
      if (ccCheck.rowCount === 0) {
        throw new AppError('Chronic condition not found for this patient.', 400);
      }
      validConditionId = chronicConditionId;
    }

    const result = await db.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration, chronic_condition_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [patientId, doctorId, medication, dosage, frequency, duration || null, validConditionId]
    );

    createNotification({
      recipientId: patient.user_id,
      type: 'prescription_created',
      title: 'New Prescription',
      message: `${docName} prescribed ${medication} (${dosage}, ${frequency}).`,
      referenceId: result.rows[0].id,
      referenceType: 'prescription',
    });

    await auditLog({ userId: req.user.id, action: 'CREATE_PRESCRIPTION', resourceType: 'prescription', resourceId: result.rows[0].id, ip: req.ip, details: { patientId, medication } });

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (err) {
    return next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['dispensed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const existing = await db.query(
      `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication,
              d.user_id AS doctor_user_id
       FROM prescriptions rx
       LEFT JOIN doctors d ON rx.doctor_id = d.id
       WHERE rx.id = $1`,
      [id]
    );
    if (existing.rows.length === 0) throw new AppError('Prescription not found.', 404);
    const rx = existing.rows[0];

    const userId = req.user.id;
    const isDoctor = userId === rx.doctor_user_id;
    if (!isDoctor && !['pharmacist', 'admin'].includes(req.user.role)) {
      throw new AppError('You do not have permission to update this prescription.', 403);
    }

    const result = await db.query(
      `UPDATE prescriptions SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, id]
    );

    const patient = await db.query(
      `SELECT u.id AS user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [rx.patient_id]
    );

    if (patient.rows[0]) {
      const notifType = status === 'dispensed' ? 'prescription_dispensed' : 'system';
      const title = status === 'dispensed' ? 'Prescription Dispensed' : 'Prescription Cancelled';
      const verb = status === 'dispensed' ? 'dispensed' : 'cancelled';

      createNotification({
        recipientId: patient.rows[0].user_id,
        type: notifType,
        title,
        message: `Your prescription for ${rx.medication} has been ${verb}.`,
        referenceId: id,
        referenceType: 'prescription',
      });
    }

    await auditLog({ userId: req.user.id, action: 'UPDATE_PRESCRIPTION_STATUS', resourceType: 'prescription', resourceId: id, ip: req.ip, details: { status, medication: rx.medication } });

    res.json({ status: 'success', data: { id: result.rows[0].id, status: result.rows[0].status } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, updateStatus };
