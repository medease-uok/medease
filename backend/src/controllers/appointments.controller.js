const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');
const { SLOT_DURATION_MINUTES } = require('../utils/scheduleHelpers');
const { sendAppointmentConfirmationEmail } = require('../utils/emailService');

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

    const sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC';

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
      ORDER BY a.scheduled_at ${sortOrder}`;

    const result = await db.query(query, params);

    await auditLog({ userId: req.user.id, action: 'VIEW_APPOINTMENTS', resourceType: 'appointment', ip: req.ip });

    res.json({ status: 'success', data: result.rows.map(mapAppointment) });
  } catch (err) {
    return next(err);
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      throw new AppError('Invalid appointment ID format.', 400);
    }

    const result = await db.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.status, a.notes,
              a.created_at, a.updated_at,
              pu.first_name || ' ' || pu.last_name AS patient_name,
              'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
              d.specialization, d.department
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Appointment not found.', 404);
    }

    const row = result.rows[0];

    // Access check: patient can only view own appointments
    if (req.user.role === 'patient') {
      const patientResult = await db.query(
        'SELECT id FROM patients WHERE user_id = $1', [req.user.id]
      );
      const patientId = patientResult.rows[0]?.id;
      if (row.patient_id !== patientId) {
        throw new AppError('You do not have permission to view this appointment.', 403);
      }
    }

    // Access check: doctor can only view appointments where they are assigned
    if (req.user.role === 'doctor') {
      const doctorResult = await db.query(
        'SELECT id FROM doctors WHERE user_id = $1', [req.user.id]
      );
      const doctorId = doctorResult.rows[0]?.id;
      if (row.doctor_id !== doctorId) {
        throw new AppError('You do not have permission to view this appointment.', 403);
      }
    }

    await auditLog({ userId: req.user.id, action: 'VIEW_APPOINTMENT', resourceType: 'appointment', resourceId: id, ip: req.ip });

    res.json({
      status: 'success',
      data: {
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        patientName: row.patient_name,
        doctorName: row.doctor_name,
        specialization: row.specialization,
        department: row.department,
        scheduledAt: row.scheduled_at,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { doctorId, scheduledAt, notes } = req.body;

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

    const [doctorCheck, patientCheck] = await Promise.all([
      db.query(
        `SELECT d.id, d.specialization, u.id AS user_id, u.first_name, u.last_name
         FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
        [doctorId]
      ),
      db.query(
        `SELECT p.id, u.id AS user_id, u.first_name, u.last_name, u.email
         FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [patientId]
      ),
    ]);
    if (doctorCheck.rows.length === 0) throw new AppError('Doctor not found.', 404);
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const doctor = doctorCheck.rows[0];
    const patient = patientCheck.rows[0];

    // Slot validation: verify doctor has an active schedule and time is on a valid slot boundary
    const apptDate = new Date(scheduledAt);
    // Use UTC consistently for both day-of-week and time extraction
    const dayOfWeek = apptDate.getUTCDay();
    const apptHours = apptDate.getUTCHours();
    const apptMinutes = apptDate.getUTCMinutes();
    const apptTotalMinutes = apptHours * 60 + apptMinutes;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Slot validation inside transaction to prevent race conditions
      const scheduleResult = await client.query(
        `SELECT start_time, end_time, is_active
         FROM doctor_schedules
         WHERE doctor_id = $1 AND day_of_week = $2`,
        [doctorId, dayOfWeek]
      );

      if (scheduleResult.rows.length === 0 || !scheduleResult.rows[0].is_active) {
        throw new AppError('Doctor is not available on this day.', 400);
      }

      const schedule = scheduleResult.rows[0];

      const [schStartH, schStartM] = schedule.start_time.slice(0, 5).split(':').map(Number);
      const [schEndH, schEndM] = schedule.end_time.slice(0, 5).split(':').map(Number);
      const schedStartMinutes = schStartH * 60 + schStartM;
      const schedEndMinutes = schEndH * 60 + schEndM;

      // Must be within schedule hours and on a slot boundary
      if (apptTotalMinutes < schedStartMinutes || apptTotalMinutes + SLOT_DURATION_MINUTES > schedEndMinutes) {
        throw new AppError('Appointment time is outside the doctor\'s schedule hours.', 400);
      }

      if ((apptTotalMinutes - schedStartMinutes) % SLOT_DURATION_MINUTES !== 0) {
        throw new AppError(`Appointment time must be on a ${SLOT_DURATION_MINUTES}-minute slot boundary.`, 400);
      }

      const result = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, notes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [patientId, doctorId, scheduledAt, notes || null]
      );

      await auditLog({ userId: req.user.id, action: 'CREATE_APPOINTMENT', resourceType: 'appointment', resourceId: result.rows[0].id, ip: req.ip, details: { patientId, doctorId } });

      await client.query('COMMIT');

      const dateStr = new Date(scheduledAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });

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

      // Send confirmation email to patient (fire-and-forget)
      sendAppointmentConfirmationEmail(patient.email, {
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        specialization: doctor.specialization || '',
        scheduledAt,
        appointmentId: result.rows[0].id,
      }).catch(() => {});

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

    const validStatuses = ['in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
    }

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

    const userId = req.user.id;
    const isOwner = userId === appt.patient_user_id || userId === appt.doctor_user_id;
    if (!isOwner && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this appointment.', 403);
    }

    if (req.user.role === 'patient' && status !== 'cancelled') {
      throw new AppError('Patients can only cancel appointments.', 403);
    }

    // Doctors must attach a medical record before completing an appointment
    if (status === 'completed') {
      const recordCheck = await db.query(
        `SELECT id FROM medical_records
         WHERE patient_id = $1 AND doctor_id = $2
           AND created_at::date = (SELECT scheduled_at::date FROM appointments WHERE id = $3)`,
        [appt.patient_id, appt.doctor_id, id]
      );
      if (recordCheck.rows.length === 0) {
        throw new AppError(
          'Cannot complete appointment without a medical record. Please add a medical record for this patient first.',
          400
        );
      }
    }

    const result = await db.query(
      `UPDATE appointments SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );

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

    await auditLog({ userId: req.user.id, action: 'UPDATE_APPOINTMENT_STATUS', resourceType: 'appointment', resourceId: id, ip: req.ip, details: { status, previousStatus: appt.status } });

    res.json({ status: 'success', data: { id: result.rows[0].id, status: result.rows[0].status } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, create, updateStatus };
