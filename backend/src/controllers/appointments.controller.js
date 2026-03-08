const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');

const mapAppointment = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  scheduledAt: row.scheduled_at,
  status: row.status,
  notes: row.notes,
});

const getAll = async (req, res, next) => {
  try {
    const subject = {
      id: req.user.id,
      role: req.user.role,
      patientId: req.user.patientId,
      doctorId: req.user.doctorId,
    };

    const columnMap = {
      patient_id: 'a.patient_id',
      doctor_id: 'a.doctor_id',
      status: 'a.status',
    };

    const { clause, params } = await buildAccessFilter('appointment', subject, columnMap);

    const query = `
      SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY a.scheduled_at DESC`;

    const result = await db.query(query, params);
    res.json({ status: 'success', data: result.rows.map(mapAppointment) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { doctorId, scheduledAt, notes } = req.body;

    // Resolve patient ID: patients book for themselves, staff specify patientId
    let patientId = req.body.patientId;
    if (req.user.role === 'patient') {
      if (!req.user.patientId) throw new AppError('Patient profile not found.', 404);
      patientId = req.user.patientId;
    }
    if (!patientId || !doctorId || !scheduledAt) {
      throw new AppError('patientId, doctorId, and scheduledAt are required.', 400);
    }

    // Verify doctor exists
    const doctorCheck = await db.query(
      `SELECT d.id, u.id AS user_id, u.first_name, u.last_name
       FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [doctorId]
    );
    if (doctorCheck.rows.length === 0) throw new AppError('Doctor not found.', 404);
    const doctor = doctorCheck.rows[0];

    // Verify patient exists and get user_id for notification
    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    );
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const patient = patientCheck.rows[0];

    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patientId, doctorId, scheduledAt, notes || null]
    );

    const dateStr = new Date(scheduledAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    // Notify patient
    await createNotification({
      recipientId: patient.user_id,
      type: 'appointment_scheduled',
      title: 'Appointment Scheduled',
      message: `Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} is scheduled for ${dateStr}.`,
      referenceId: result.rows[0].id,
      referenceType: 'appointment',
    });

    // Notify doctor
    await createNotification({
      recipientId: doctor.user_id,
      type: 'appointment_scheduled',
      title: 'New Appointment',
      message: `Appointment with ${patient.first_name} ${patient.last_name} scheduled for ${dateStr}.`,
      referenceId: result.rows[0].id,
      referenceType: 'appointment',
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

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const result = await db.query(
      `UPDATE appointments SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, patient_id, doctor_id, status`,
      [status, id]
    );

    if (result.rows.length === 0) throw new AppError('Appointment not found.', 404);
    const appt = result.rows[0];

    // Get user IDs for notifications
    const patient = await db.query(
      `SELECT u.id AS user_id, u.first_name FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [appt.patient_id]
    );
    const doctor = await db.query(
      `SELECT u.id AS user_id, u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [appt.doctor_id]
    );

    if (status === 'confirmed' && patient.rows[0]) {
      await createNotification({
        recipientId: patient.rows[0].user_id,
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${doctor.rows[0]?.first_name} ${doctor.rows[0]?.last_name} has been confirmed.`,
        referenceId: id,
        referenceType: 'appointment',
      });
    }

    if (status === 'cancelled') {
      if (patient.rows[0]) {
        await createNotification({
          recipientId: patient.rows[0].user_id,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: 'Your appointment has been cancelled.',
          referenceId: id,
          referenceType: 'appointment',
        });
      }
      if (doctor.rows[0]) {
        await createNotification({
          recipientId: doctor.rows[0].user_id,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: `Appointment with ${patient.rows[0]?.first_name || 'a patient'} has been cancelled.`,
          referenceId: id,
          referenceType: 'appointment',
        });
      }
    }

    res.json({ status: 'success', data: { id: appt.id, status: appt.status } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, updateStatus };
