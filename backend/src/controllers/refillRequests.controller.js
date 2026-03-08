const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');

function parseDurationToDays(duration) {
  if (!duration) return null;
  const lower = duration.toLowerCase().trim();
  if (lower === 'ongoing') return null;

  const match = lower.match(/^(\d+)\s*(day|week|month|year)s?$/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 'day': return num;
    case 'week': return num * 7;
    case 'month': return num * 30;
    case 'year': return num * 365;
    default: return null;
  }
}

function isRefillEligible(createdAt, duration) {
  const days = parseDurationToDays(duration);
  if (days === null) return true;

  const prescribed = new Date(createdAt).getTime();
  const twoThirds = prescribed + (days * (2 / 3)) * 24 * 60 * 60 * 1000;
  return Date.now() >= twoThirds;
}

const mapRefillRequest = (row) => ({
  id: row.id,
  prescriptionId: row.prescription_id,
  patientId: row.patient_id,
  doctorId: row.doctor_id,
  status: row.status,
  reason: row.reason,
  doctorNote: row.doctor_note,
  respondedAt: row.responded_at,
  createdAt: row.created_at,
  patientName: row.patient_name,
  doctorName: row.doctor_name,
  medication: row.medication,
  dosage: row.dosage,
  frequency: row.frequency,
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
      patient_id: 'rr.patient_id',
      doctor_id: 'rr.doctor_id',
    };

    const { clause, params } = await buildAccessFilter('refill_request', subject, columnMap);

    const query = `
      SELECT rr.id, rr.prescription_id, rr.patient_id, rr.doctor_id,
             rr.status, rr.reason, rr.doctor_note, rr.responded_at, rr.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
             rx.medication, rx.dosage, rx.frequency
      FROM prescription_refill_requests rr
      JOIN prescriptions rx ON rr.prescription_id = rx.id
      JOIN patients p ON rr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON rr.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE ${clause}
      ORDER BY rr.created_at DESC`;

    const result = await db.query(query, params);

    await auditLog({ userId: req.user.id, action: 'VIEW_REFILL_REQUESTS', resourceType: 'refill_request', ip: req.ip });

    res.json({ status: 'success', data: result.rows.map(mapRefillRequest) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { prescriptionId, reason } = req.body;

    if (!prescriptionId) {
      throw new AppError('prescriptionId is required.', 400);
    }

    const patientId = req.user.patientId;
    if (!patientId) throw new AppError('Only patients can request refills.', 403);

    const rxResult = await db.query(
      `SELECT rx.id, rx.patient_id, rx.doctor_id, rx.medication, rx.dosage, rx.frequency,
              rx.duration, rx.created_at,
              d.user_id AS doctor_user_id
       FROM prescriptions rx
       LEFT JOIN doctors d ON rx.doctor_id = d.id
       WHERE rx.id = $1`,
      [prescriptionId]
    );
    if (rxResult.rows.length === 0) throw new AppError('Prescription not found.', 404);

    const rx = rxResult.rows[0];
    if (rx.patient_id !== patientId) {
      throw new AppError('You can only request refills for your own prescriptions.', 403);
    }

    if (!isRefillEligible(rx.created_at, rx.duration)) {
      const days = parseDurationToDays(rx.duration);
      const eligibleDays = Math.ceil(days * (2 / 3));
      throw new AppError(
        `Refill requests are available after ${eligibleDays} days of a ${rx.duration} prescription.`,
        400
      );
    }

    const pending = await db.query(
      `SELECT id FROM prescription_refill_requests
       WHERE prescription_id = $1 AND patient_id = $2 AND status = 'pending'`,
      [prescriptionId, patientId]
    );
    if (pending.rows.length > 0) {
      throw new AppError('A pending refill request already exists for this prescription.', 409);
    }

    const result = await db.query(
      `INSERT INTO prescription_refill_requests (prescription_id, patient_id, doctor_id, reason)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [prescriptionId, patientId, rx.doctor_id, reason || null]
    );

    if (rx.doctor_user_id) {
      const patientUser = await db.query(
        `SELECT u.first_name, u.last_name FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [patientId]
      );
      const patientName = patientUser.rows[0]
        ? `${patientUser.rows[0].first_name} ${patientUser.rows[0].last_name}`
        : 'A patient';

      createNotification({
        recipientId: rx.doctor_user_id,
        type: 'refill_requested',
        title: 'Refill Request',
        message: `${patientName} requested a refill for ${rx.medication} (${rx.dosage}).`,
        referenceId: result.rows[0].id,
        referenceType: 'refill_request',
      });
    }

    await auditLog({
      userId: req.user.id,
      action: 'REQUEST_REFILL',
      resourceType: 'refill_request',
      resourceId: result.rows[0].id,
      ip: req.ip,
      details: { prescriptionId, medication: rx.medication },
    });

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (err) {
    return next(err);
  }
};

const respond = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, doctorNote } = req.body;

    const validStatuses = ['approved', 'denied'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const existing = await db.query(
      `SELECT rr.id, rr.prescription_id, rr.patient_id, rr.doctor_id, rr.status,
              rx.medication, rx.dosage, rx.frequency, rx.duration,
              d.user_id AS doctor_user_id
       FROM prescription_refill_requests rr
       JOIN prescriptions rx ON rr.prescription_id = rx.id
       LEFT JOIN doctors d ON rr.doctor_id = d.id
       WHERE rr.id = $1`,
      [id]
    );
    if (existing.rows.length === 0) throw new AppError('Refill request not found.', 404);

    const rr = existing.rows[0];
    if (rr.status !== 'pending') {
      throw new AppError('This refill request has already been responded to.', 409);
    }

    const userId = req.user.id;
    const isDoctor = userId === rr.doctor_user_id;
    if (!isDoctor && req.user.role !== 'admin') {
      throw new AppError('Only the prescribing doctor or an admin can respond to this request.', 403);
    }

    await db.query(
      `UPDATE prescription_refill_requests SET status = $1, doctor_note = $2, responded_at = NOW() WHERE id = $3`,
      [status, doctorNote || null, id]
    );

    if (status === 'approved') {
      const doctorId = req.user.doctorId || rr.doctor_id;
      await db.query(
        `INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, frequency, duration)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rr.patient_id, doctorId, rr.medication, rr.dosage, rr.frequency, rr.duration]
      );
    }

    const patient = await db.query(
      `SELECT u.id AS user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [rr.patient_id]
    );

    if (patient.rows[0]) {
      const notifType = status === 'approved' ? 'refill_approved' : 'refill_denied';
      const title = status === 'approved' ? 'Refill Approved' : 'Refill Denied';
      const verb = status === 'approved' ? 'approved' : 'denied';

      createNotification({
        recipientId: patient.rows[0].user_id,
        type: notifType,
        title,
        message: `Your refill request for ${rr.medication} has been ${verb}.`,
        referenceId: id,
        referenceType: 'refill_request',
      });
    }

    await auditLog({
      userId: req.user.id,
      action: 'RESPOND_REFILL_REQUEST',
      resourceType: 'refill_request',
      resourceId: id,
      ip: req.ip,
      details: { status, medication: rr.medication },
    });

    res.json({ status: 'success', data: { id, status } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, respond, parseDurationToDays, isRefillEligible };
