const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');

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

    auditLog({ userId: req.user.id, action: 'VIEW_APPOINTMENTS', resourceType: 'appointment', ip: req.ip });

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
    } else if (!['doctor', 'nurse', 'admin'].includes(req.user.role)) {
      throw new AppError('You do not have permission to create appointments.', 403);
    }
    if (!patientId || !doctorId || !scheduledAt) {
      throw new AppError('patientId, doctorId, and scheduledAt are required.', 400);
    }

    // Verify doctor and patient exist in parallel
    const [doctorCheck, patientCheck] = await Promise.all([
      db.query(
        `SELECT d.id, u.id AS user_id, u.first_name, u.last_name
         FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
        [doctorId]
      ),
      db.query(
        `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
         FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [patientId]
      ),
    ]);
    if (doctorCheck.rows.length === 0) throw new AppError('Doctor not found.', 404);
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const doctor = doctorCheck.rows[0];
    const patient = patientCheck.rows[0];

    // Use transaction for insert + notifications
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, notes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [patientId, doctorId, scheduledAt, notes || null]
      );

      await client.query('COMMIT');

      const dateStr = new Date(scheduledAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });

      // Fire-and-forget notifications (already swallows errors internally)
      createNotification({
        recipientId: patient.user_id,
        type: 'appointment_scheduled',
        title: 'Appointment Scheduled',
        message: `Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} is scheduled for ${dateStr}.`,
        referenceId: result.rows[0].id,
        referenceType: 'appointment',
      });
      createNotification({
        recipientId: doctor.user_id,
        type: 'appointment_scheduled',
        title: 'New Appointment',
        message: `Appointment with ${patient.first_name} ${patient.last_name} scheduled for ${dateStr}.`,
        referenceId: result.rows[0].id,
        referenceType: 'appointment',
      });

      auditLog({ userId: req.user.id, action: 'CREATE_APPOINTMENT', resourceType: 'appointment', resourceId: result.rows[0].id, ip: req.ip, details: { patientId, doctorId } });

      res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
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

    // Fetch appointment first to verify ownership
    const existing = await db.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status,
              p.user_id AS patient_user_id, d.user_id AS doctor_user_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );
    if (existing.rows.length === 0) throw new AppError('Appointment not found.', 404);
    const appt = existing.rows[0];

    // Ownership check: only the patient, doctor, or admin can update
    const userId = req.user.id;
    const isOwner = userId === appt.patient_user_id || userId === appt.doctor_user_id;
    if (!isOwner && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this appointment.', 403);
    }

    // Patients can only cancel their own appointments
    if (req.user.role === 'patient' && status !== 'cancelled') {
      throw new AppError('Patients can only cancel appointments.', 403);
    }

    const result = await db.query(
      `UPDATE appointments SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );

    // Get names for notifications (parallel)
    const [patientInfo, doctorInfo] = await Promise.all([
      db.query(
        `SELECT u.id AS user_id, u.first_name FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [appt.patient_id]
      ),
      db.query(
        `SELECT u.id AS user_id, u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
        [appt.doctor_id]
      ),
    ]);

    const patient = patientInfo.rows[0];
    const doctor = doctorInfo.rows[0];

    if (status === 'confirmed' && patient) {
      createNotification({
        recipientId: patient.user_id,
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${doctor?.first_name} ${doctor?.last_name} has been confirmed.`,
        referenceId: id,
        referenceType: 'appointment',
      });
    }

    if (status === 'cancelled') {
      if (patient) {
        createNotification({
          recipientId: patient.user_id,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: 'Your appointment has been cancelled.',
          referenceId: id,
          referenceType: 'appointment',
        });
      }
      if (doctor) {
        createNotification({
          recipientId: doctor.user_id,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: `Appointment with ${patient?.first_name || 'a patient'} has been cancelled.`,
          referenceId: id,
          referenceType: 'appointment',
        });
      }
    }

    auditLog({ userId: req.user.id, action: 'UPDATE_APPOINTMENT_STATUS', resourceType: 'appointment', resourceId: id, ip: req.ip, details: { status, previousStatus: appt.status } });

    res.json({ status: 'success', data: { id: result.rows[0].id, status: result.rows[0].status } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, updateStatus };
