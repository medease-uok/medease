const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');

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
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON rx.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY rx.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ status: 'success', data: result.rows.map(mapPrescription) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId, medication, dosage, frequency, duration } = req.body;

    if (!patientId || !medication || !dosage || !frequency) {
      throw new AppError('patientId, medication, dosage, and frequency are required.', 400);
    }

    const doctorId = req.user.doctorId;
    if (!doctorId) throw new AppError('Only doctors can create prescriptions.', 403);

    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    );
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const patient = patientCheck.rows[0];

    const result = await db.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [patientId, doctorId, medication, dosage, frequency, duration || null]
    );

    // Get doctor name for notification
    const doctorInfo = await db.query(
      `SELECT u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [doctorId]
    );
    const docName = doctorInfo.rows[0]
      ? `Dr. ${doctorInfo.rows[0].first_name} ${doctorInfo.rows[0].last_name}`
      : 'Your doctor';

    await createNotification({
      recipientId: patient.user_id,
      type: 'prescription_created',
      title: 'New Prescription',
      message: `${docName} prescribed ${medication} (${dosage}, ${frequency}).`,
      referenceId: result.rows[0].id,
      referenceType: 'prescription',
    });

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

    const result = await db.query(
      `UPDATE prescriptions SET status = $1 WHERE id = $2 RETURNING id, patient_id, medication, status`,
      [status, id]
    );
    if (result.rows.length === 0) throw new AppError('Prescription not found.', 404);
    const rx = result.rows[0];

    const patient = await db.query(
      `SELECT u.id AS user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [rx.patient_id]
    );

    if (patient.rows[0]) {
      const notifType = status === 'dispensed' ? 'prescription_dispensed' : 'system';
      const title = status === 'dispensed' ? 'Prescription Dispensed' : 'Prescription Cancelled';
      const verb = status === 'dispensed' ? 'dispensed' : 'cancelled';

      await createNotification({
        recipientId: patient.rows[0].user_id,
        type: notifType,
        title,
        message: `Your prescription for ${rx.medication} has been ${verb}.`,
        referenceId: id,
        referenceType: 'prescription',
      });
    }

    res.json({ status: 'success', data: { id: rx.id, status: rx.status } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, updateStatus };
