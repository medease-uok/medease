const { randomUUID } = require('crypto');
const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');
const { SLOT_DURATION_MINUTES, CLINIC_TIMEZONE, clinicLocalTime } = require('../utils/scheduleHelpers');
const { sendAppointmentConfirmationEmail } = require('../utils/emailService');
const { notifyWaitlistOnCancellation } = require('./waitlist.controller');
const { APPOINTMENT_STATUS, UPDATEABLE_STATUSES, INACTIVE_STATUSES } = require('../constants/appointmentStatus');

const mapAppointment = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  scheduledAt: row.scheduled_at,
  status: row.status,
  notes: row.notes,
  seriesId: row.series_id || null,
  recurrencePattern: row.recurrence_pattern || null,
  recurrenceEndDate: row.recurrence_end_date || null,
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
             a.series_id, a.recurrence_pattern, a.recurrence_end_date,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY
        CASE a.status
          WHEN 'in_progress' THEN 0
          WHEN 'scheduled' THEN 1
          WHEN 'completed' THEN 2
          WHEN 'cancelled' THEN 3
          WHEN 'no_show' THEN 4
        END,
        a.scheduled_at DESC`;

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
              a.created_at, a.updated_at, a.series_id, a.recurrence_pattern, a.recurrence_end_date,
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

    if (req.user.role === 'patient') {
      const patientResult = await db.query(
        'SELECT id FROM patients WHERE user_id = $1', [req.user.id]
      );
      const patientId = patientResult.rows[0]?.id;
      if (row.patient_id !== patientId) {
        throw new AppError('You do not have permission to view this appointment.', 403);
      }
    }

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
        seriesId: row.series_id || null,
        recurrencePattern: row.recurrence_pattern || null,
        recurrenceEndDate: row.recurrence_end_date || null,
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

    const apptDate = new Date(scheduledAt);
    const { dayOfWeek, totalMinutes: apptTotalMinutes } = clinicLocalTime(apptDate);

    let appointmentId;
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

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

      appointmentId = result.rows[0]?.id;
      if (!appointmentId) throw new AppError('Appointment insert returned no ID.', 500);

      await auditLog({ userId: req.user.id, action: 'CREATE_APPOINTMENT', resourceType: 'appointment', resourceId: appointmentId, ip: req.ip, details: { patientId, doctorId } });

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    const dateStr = new Date(scheduledAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      timeZone: CLINIC_TIMEZONE,
    });

    createNotification({
      recipientId: patient.user_id,
      type: 'appointment_scheduled',
      title: 'Appointment Scheduled',
      message: `Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} is scheduled for ${dateStr}.`,
      referenceId: appointmentId,
      referenceType: 'appointment',
    }).catch((err) => {
      console.error('Failed to send notification to patient', { appointmentId, error: err.message });
    });
    createNotification({
      recipientId: doctor.user_id,
      type: 'appointment_scheduled',
      title: 'New Appointment',
      message: `Appointment with ${patient.first_name} ${patient.last_name} scheduled for ${dateStr}.`,
      referenceId: appointmentId,
      referenceType: 'appointment',
    }).catch((err) => {
      console.error('Failed to send notification to doctor', { appointmentId, error: err.message });
    });

    if (patient.email) {
      sendAppointmentConfirmationEmail(patient.email, {
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        specialization: doctor.specialization || '',
        scheduledAt,
        appointmentId,
      }).catch((err) => {
        console.error('Failed to send appointment confirmation email', {
          appointmentId,
          error: err.message,
        });
      });
    }

    res.status(201).json({ status: 'success', data: { id: appointmentId } });
  } catch (err) {
    return next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!UPDATEABLE_STATUSES.includes(status)) {
      throw new AppError(`status must be one of: ${UPDATEABLE_STATUSES.join(', ')}`, 400);
    }

    const existing = await db.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status, a.scheduled_at,
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

    if (req.user.role === 'patient' && status !== APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError('Patients can only cancel appointments.', 403);
    }

    // Doctors must attach a medical record before completing an appointment
    if (status === APPOINTMENT_STATUS.COMPLETED) {
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

    if (status === APPOINTMENT_STATUS.CANCELLED) {
      if (patient) {
        createNotification({
          recipientId: patient.user_id,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: 'Your appointment has been cancelled.',
          referenceId: id,
          referenceType: 'appointment',
        }).catch((err) => {
          console.error('Failed to send cancel notification to patient', { id, error: err.message });
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
        }).catch((err) => {
          console.error('Failed to send cancel notification to doctor', { id, error: err.message });
        });
      }

      // Notify the first pending waitlist entry for this doctor+date
      notifyWaitlistOnCancellation(appt.doctor_id, appt.scheduled_at).catch((err) => {
        console.error('Failed to notify waitlist on cancellation', { id, error: err.message });
      });
    }

    await auditLog({ userId: req.user.id, action: 'UPDATE_APPOINTMENT_STATUS', resourceType: 'appointment', resourceId: id, ip: req.ip, details: { status, previousStatus: appt.status } });

    res.json({ status: 'success', data: { id: result.rows[0].id, status: result.rows[0].status } });
  } catch (err) {
    return next(err);
  }
};

/**
 * Compute the next occurrence date for a recurrence pattern.
 * originalDayOfMonth is needed for monthly to handle 31→Feb→28 correctly.
 * Returns a new Date object or null for unknown patterns.
 */
function nextOccurrence(currentDate, pattern, originalDayOfMonth) {
  const next = new Date(currentDate);
  switch (pattern) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'biweekly':
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case 'monthly': {
      next.setUTCMonth(next.getUTCMonth() + 1);
      const daysInMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(originalDayOfMonth, daysInMonth));
      break;
    }
    default:
      return null;
  }
  return next;
}

const MAX_RECURRING_APPOINTMENTS = 52; // safety cap

const createRecurring = async (req, res, next) => {
  try {
    const { doctorId, scheduledAt, notes, recurrencePattern, recurrenceEndDate } = req.body;

    // Validate all required fields upfront before any async work
    if (!doctorId || !scheduledAt || !recurrencePattern || !recurrenceEndDate) {
      throw new AppError('doctorId, scheduledAt, recurrencePattern, and recurrenceEndDate are required.', 400);
    }

    const validPatterns = ['daily', 'weekly', 'biweekly', 'monthly'];
    if (!validPatterns.includes(recurrencePattern)) {
      throw new AppError(`recurrencePattern must be one of: ${validPatterns.join(', ')}`, 400);
    }

    const endDate = new Date(recurrenceEndDate);
    const startDate = new Date(scheduledAt);
    if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
      throw new AppError('Invalid date format.', 400);
    }
    if (endDate <= startDate) {
      throw new AppError('recurrenceEndDate must be after scheduledAt.', 400);
    }

    let patientId = req.body.patientId;
    if (req.user.role === 'patient') {
      if (!req.user.patientId) throw new AppError('Patient profile not found.', 404);
      patientId = req.user.patientId;
    } else if (!['doctor', 'nurse', 'admin'].includes(req.user.role)) {
      throw new AppError('You do not have permission to create appointments.', 403);
    }
    if (!patientId) {
      throw new AppError('patientId is required.', 400);
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

    // Generate all occurrence dates, tracking original day for monthly rollover
    const originalDayOfMonth = startDate.getUTCDate();
    const dates = [startDate];
    let current = startDate;
    while (dates.length < MAX_RECURRING_APPOINTMENTS) {
      const next = nextOccurrence(current, recurrencePattern, originalDayOfMonth);
      if (!next || next > endDate) break;
      dates.push(next);
      current = next;
    }

    if (dates.length < 2) {
      throw new AppError('Recurrence settings produce only one appointment. Adjust the end date or pattern.', 400);
    }

    const seriesId = randomUUID();

    const client = await db.getClient();
    const appointmentIds = [];
    const skippedDates = [];

    try {
      await client.query('BEGIN');

      // Batch: fetch doctor schedule once for all days
      const scheduleResult = await client.query(
        `SELECT day_of_week, start_time, end_time, is_active
         FROM doctor_schedules WHERE doctor_id = $1`,
        [doctorId]
      );
      const scheduleMap = Object.fromEntries(
        scheduleResult.rows.map((r) => [r.day_of_week, r])
      );

      const dateStrings = dates.map((d) => d.toISOString());
      const conflictResult = await client.query(
        `SELECT scheduled_at FROM appointments
         WHERE doctor_id = $1
           AND scheduled_at = ANY($2::timestamptz[])
           AND status NOT IN ('cancelled', 'no_show')`,
        [doctorId, dateStrings]
      );
      const conflictSet = new Set(
        conflictResult.rows.map((r) => new Date(r.scheduled_at).toISOString())
      );

      for (const date of dates) {
        const dayOfWeek = date.getUTCDay();
        const apptHours = date.getUTCHours();
        const apptMinutes = date.getUTCMinutes();
        const apptTotalMinutes = apptHours * 60 + apptMinutes;
        const dateISO = date.toISOString();

        // Check doctor schedule for this day (from cached map)
        const schedule = scheduleMap[dayOfWeek];
        if (!schedule || !schedule.is_active) {
          skippedDates.push(dateISO);
          continue;
        }

        const [schStartH, schStartM] = schedule.start_time.slice(0, 5).split(':').map(Number);
        const [schEndH, schEndM] = schedule.end_time.slice(0, 5).split(':').map(Number);
        const schedStartMinutes = schStartH * 60 + schStartM;
        const schedEndMinutes = schEndH * 60 + schEndM;

        if (apptTotalMinutes < schedStartMinutes || apptTotalMinutes + SLOT_DURATION_MINUTES > schedEndMinutes) {
          skippedDates.push(dateISO);
          continue;
        }

        if ((apptTotalMinutes - schedStartMinutes) % SLOT_DURATION_MINUTES !== 0) {
          skippedDates.push(dateISO);
          continue;
        }

        if (conflictSet.has(dateISO)) {
          skippedDates.push(dateISO);
          continue;
        }

        const result = await client.query(
          `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, notes, series_id, recurrence_pattern, recurrence_end_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [patientId, doctorId, dateISO, notes || null, seriesId, recurrencePattern, recurrenceEndDate]
        );

        appointmentIds.push(result.rows[0].id);
      }

      if (appointmentIds.length === 0) {
        throw new AppError('No valid slots found for the recurring schedule. All dates were unavailable or conflicting.', 400);
      }

      await auditLog({
        userId: req.user.id,
        action: 'CREATE_RECURRING_APPOINTMENTS',
        resourceType: 'appointment',
        resourceId: seriesId,
        ip: req.ip,
        details: { patientId, doctorId, recurrencePattern, count: appointmentIds.length },
      });

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Notifications after commit (with .catch() to prevent unhandled rejections)
    const countStr = `${appointmentIds.length} recurring appointment${appointmentIds.length > 1 ? 's' : ''}`;
    createNotification({
      recipientId: patient.user_id,
      type: 'appointment_scheduled',
      title: 'Recurring Appointments Scheduled',
      message: `${countStr} with Dr. ${doctor.first_name} ${doctor.last_name} have been scheduled.`,
      referenceId: appointmentIds[0],
      referenceType: 'appointment',
    }).catch((err) => {
      console.error('Failed to send recurring notification to patient', { seriesId, error: err.message });
    });
    createNotification({
      recipientId: doctor.user_id,
      type: 'appointment_scheduled',
      title: 'New Recurring Appointments',
      message: `${countStr} with ${patient.first_name} ${patient.last_name} have been scheduled.`,
      referenceId: appointmentIds[0],
      referenceType: 'appointment',
    }).catch((err) => {
      console.error('Failed to send recurring notification to doctor', { seriesId, error: err.message });
    });

    if (patient.email) {
      sendAppointmentConfirmationEmail(patient.email, {
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        specialization: doctor.specialization || '',
        scheduledAt,
        appointmentId: appointmentIds[0],
      }).catch((err) => {
        console.error('Failed to send recurring appointment confirmation email', {
          seriesId,
          error: err.message,
        });
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        seriesId,
        appointmentIds,
        totalCreated: appointmentIds.length,
        skippedDates,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const cancelSeries = async (req, res, next) => {
  try {
    const { seriesId } = req.params;

    if (!UUID_REGEX.test(seriesId)) {
      throw new AppError('Invalid series ID format.', 400);
    }

    const seriesResult = await db.query(
      `SELECT a.id, a.patient_id, a.doctor_id,
              p.user_id AS patient_user_id,
              pu.first_name AS patient_first_name,
              d.user_id AS doctor_user_id,
              du.first_name AS doctor_first_name, du.last_name AS doctor_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE a.series_id = $1
       LIMIT 1`,
      [seriesId]
    );

    if (seriesResult.rows.length === 0) {
      throw new AppError('Appointment series not found.', 404);
    }

    const appt = seriesResult.rows[0];
    const userId = req.user.id;
    const isOwner = userId === appt.patient_user_id || userId === appt.doctor_user_id;
    if (!isOwner && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to cancel this series.', 403);
    }

    const result = await db.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
       WHERE series_id = $1
         AND status = 'scheduled'
         AND scheduled_at > NOW()
       RETURNING id, scheduled_at`,
      [seriesId]
    );

    const cancelledCount = result.rows.length;

    if (cancelledCount > 0) {
      createNotification({
        recipientId: appt.patient_user_id,
        type: 'appointment_cancelled',
        title: 'Recurring Appointments Cancelled',
        message: `${cancelledCount} upcoming appointment${cancelledCount > 1 ? 's' : ''} have been cancelled.`,
        referenceId: seriesId,
        referenceType: 'appointment',
      }).catch((err) => {
        console.error('Failed to send cancel notification to patient', { seriesId, error: err.message });
      });
      createNotification({
        recipientId: appt.doctor_user_id,
        type: 'appointment_cancelled',
        title: 'Recurring Appointments Cancelled',
        message: `${cancelledCount} upcoming appointment${cancelledCount > 1 ? 's' : ''} with ${appt.patient_first_name} have been cancelled.`,
        referenceId: seriesId,
        referenceType: 'appointment',
      }).catch((err) => {
        console.error('Failed to send cancel notification to doctor', { seriesId, error: err.message });
      });
    }

    for (const row of result.rows) {
      notifyWaitlistOnCancellation(appt.doctor_id, row.scheduled_at).catch((err) => {
        console.error('Failed to notify waitlist on series cancellation', { seriesId, error: err.message });
      });
    }

    await auditLog({
      userId: req.user.id,
      action: 'CANCEL_APPOINTMENT_SERIES',
      resourceType: 'appointment',
      resourceId: seriesId,
      ip: req.ip,
      details: { cancelledCount },
    });

    res.json({
      status: 'success',
      data: {
        seriesId,
        cancelledCount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /appointments/:id/reschedule
 * Move a scheduled appointment to a new time slot (same doctor).
 * - Patient: own appointments only
 * - Doctor: appointments assigned to them only
 * - Nurse / Admin: any appointment
 * The old slot is freed → waitlist is notified.
 */
const reschedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!UUID_REGEX.test(id)) {
      throw new AppError('Invalid appointment ID format.', 400);
    }
    if (!scheduledAt) {
      throw new AppError('scheduledAt is required.', 400);
    }

    // Validate ISO 8601 format to prevent ambiguous date strings
    const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!ISO_8601_REGEX.test(scheduledAt)) {
      throw new AppError('scheduledAt must be an ISO 8601 UTC datetime string (e.g., 2026-03-25T08:00:00Z).', 400);
    }

    const newDate = new Date(scheduledAt);
    if (isNaN(newDate.getTime())) {
      throw new AppError('Invalid scheduledAt date.', 400);
    }

    const now = new Date();
    if (newDate <= now) {
      throw new AppError('scheduledAt must be in the future.', 400);
    }

    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (newDate > oneYearFromNow) {
      throw new AppError('scheduledAt cannot be more than 1 year in the future.', 400);
    }

    const client = await db.getClient();
    let appt;
    let previousScheduledAt;
    let committedScheduledAt;

    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `SELECT a.id, a.patient_id, a.doctor_id, a.status, a.scheduled_at,
                p.user_id AS patient_user_id,
                pu.first_name AS patient_first_name, pu.last_name AS patient_last_name,
                d.user_id AS doctor_user_id, d.department AS doctor_department,
                du.first_name AS doctor_first_name, du.last_name AS doctor_last_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users pu ON p.user_id = pu.id
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE a.id = $1
         FOR UPDATE`,
        [id]
      );

      if (existing.rows.length === 0) throw new AppError('Appointment not found.', 404);
      appt = existing.rows[0];

      if (req.user.role === 'patient' && req.user.patientId !== appt.patient_id) {
        throw new AppError('You do not have permission to reschedule this appointment.', 403);
      }
      if (req.user.role === 'doctor' && req.user.doctorId !== appt.doctor_id) {
        throw new AppError('You do not have permission to reschedule this appointment.', 403);
      }
      if (req.user.role === 'nurse') {
        // Nurses can only reschedule appointments for doctors in their department
        const nurseDeptResult = await client.query(
          'SELECT department FROM nurses WHERE user_id = $1',
          [req.user.id]
        );
        if (nurseDeptResult.rows.length === 0) {
          throw new AppError('Nurse profile not found.', 404);
        }
        const nurseDepartment = nurseDeptResult.rows[0].department;
        if (nurseDepartment !== appt.doctor_department) {
          throw new AppError('You can only reschedule appointments for doctors in your department.', 403);
        }
      }

      if (appt.status !== APPOINTMENT_STATUS.SCHEDULED) {
        throw new AppError('Cannot reschedule an appointment that is not in scheduled status.', 400);
      }

      if (new Date(appt.scheduled_at).toISOString() === newDate.toISOString()) {
        throw new AppError('New time is the same as the current scheduled time.', 400);
      }

      const { dayOfWeek, totalMinutes: apptTotalMinutes } = clinicLocalTime(newDate);

      const scheduleResult = await client.query(
        `SELECT start_time, end_time, is_active
         FROM doctor_schedules
         WHERE doctor_id = $1 AND day_of_week = $2`,
        [appt.doctor_id, dayOfWeek]
      );

      if (scheduleResult.rows.length === 0 || !scheduleResult.rows[0].is_active) {
        throw new AppError('Doctor is not available on this day.', 400);
      }

      const schedule = scheduleResult.rows[0];
      const [schStartH, schStartM] = schedule.start_time.slice(0, 5).split(':').map(Number);
      const [schEndH, schEndM] = schedule.end_time.slice(0, 5).split(':').map(Number);
      const schedStartMinutes = schStartH * 60 + schStartM;
      const schedEndMinutes = schEndH * 60 + schEndM;

      if (apptTotalMinutes < schedStartMinutes || apptTotalMinutes + SLOT_DURATION_MINUTES > schedEndMinutes) {
        throw new AppError("Appointment time is outside the doctor's schedule hours.", 400);
      }
      if ((apptTotalMinutes - schedStartMinutes) % SLOT_DURATION_MINUTES !== 0) {
        throw new AppError(`Appointment time must be on a ${SLOT_DURATION_MINUTES}-minute slot boundary.`, 400);
      }

      // Check for conflict at the new slot (exclude the current appointment)
      const conflictResult = await client.query(
        `SELECT id FROM appointments
         WHERE doctor_id = $1
           AND scheduled_at = $2
           AND status NOT IN ('cancelled', 'no_show')
           AND id != $3`,
        [appt.doctor_id, newDate.toISOString(), id]
      );
      if (conflictResult.rows.length > 0) {
        throw new AppError('The selected time slot is already booked.', 409);
      }

      previousScheduledAt = appt.scheduled_at;

      const updateResult = await client.query(
        `UPDATE appointments SET scheduled_at = $1, updated_at = NOW() WHERE id = $2 RETURNING scheduled_at`,
        [newDate, id]
      );
      committedScheduledAt = updateResult.rows[0].scheduled_at;

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Audit after release to keep the transaction short and avoid holding locks.
    // Note: FOR UPDATE only locks rows in the target table (appointments), not JOINed tables.
    auditLog({
      userId: req.user.id,
      action: 'RESCHEDULE_APPOINTMENT',
      resourceType: 'appointment',
      resourceId: id,
      ip: req.ip,
      details: { previousScheduledAt, newScheduledAt: newDate.toISOString() },
    }).catch((err) => {
      console.error('AUDIT LOG FAILURE — reschedule', { appointmentId: id, userId: req.user.id, error: err.message });
    });

    const newDateTimeStr = new Date(committedScheduledAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZone: CLINIC_TIMEZONE,
    });

    createNotification({
      recipientId: appt.patient_user_id,
      type: 'appointment_rescheduled',
      title: 'Appointment Rescheduled',
      message: `Your appointment with Dr. ${appt.doctor_first_name} ${appt.doctor_last_name} has been rescheduled to ${newDateTimeStr}.`,
      referenceId: id,
      referenceType: 'appointment',
    }).catch((err) => {
      console.error('Failed to send reschedule notification to patient', { id, error: err.message });
    });

    createNotification({
      recipientId: appt.doctor_user_id,
      type: 'appointment_rescheduled',
      title: 'Appointment Rescheduled',
      message: `Appointment with ${appt.patient_first_name} ${appt.patient_last_name} has been rescheduled to ${newDateTimeStr}.`,
      referenceId: id,
      referenceType: 'appointment',
    }).catch((err) => {
      console.error('Failed to send reschedule notification to doctor', { id, error: err.message });
    });

    notifyWaitlistOnCancellation(appt.doctor_id, previousScheduledAt).catch((err) => {
      console.error('Failed to notify waitlist on reschedule', { id, error: err.message });
    });

    res.json({
      status: 'success',
      data: { id, scheduledAt: new Date(committedScheduledAt).toISOString() },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, create, createRecurring, cancelSeries, updateStatus, reschedule };
