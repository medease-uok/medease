const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');

const mapReport = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  technicianId: row.technician_id,
  patientName: row.patient_name,
  technicianName: row.technician_name,
  testName: row.test_name,
  result: row.result,
  notes: row.notes,
  reportDate: row.report_date,
});

const getAll = async (req, res, next) => {
  try {
    const subject = {
      id: req.user.id,
      role: req.user.role,
      patientId: req.user.patientId,
    };

    const columnMap = {
      patient_id: 'lr.patient_id',
      technician_id: 'lr.technician_id',
    };

    const { clause, params } = await buildAccessFilter('lab_report', subject, columnMap);

    const query = `
      SELECT lr.id, lr.patient_id, lr.technician_id, lr.test_name, lr.result,
             lr.notes, lr.report_date,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             tu.first_name || ' ' || tu.last_name AS technician_name
      FROM lab_reports lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN users tu ON lr.technician_id = tu.id
      WHERE ${clause}
      ORDER BY lr.report_date DESC`;

    const result = await db.query(query, params);
    res.json({ status: 'success', data: result.rows.map(mapReport) });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { patientId, testName, result: testResult, notes } = req.body;

    if (!patientId || !testName) {
      throw new AppError('patientId and testName are required.', 400);
    }

    const technicianId = req.user.id;

    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    );
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const patient = patientCheck.rows[0];

    const insertResult = await db.query(
      `INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [patientId, technicianId, testName, testResult || null, notes || null]
    );

    // Notify patient
    await createNotification({
      recipientId: patient.user_id,
      type: 'lab_report_ready',
      title: 'Lab Report Ready',
      message: `Your ${testName} results are now available.`,
      referenceId: insertResult.rows[0].id,
      referenceType: 'lab_report',
    });

    // Notify the patient's doctors (those with existing appointments)
    const doctors = await db.query(
      `SELECT DISTINCT u.id AS user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.patient_id = $1 AND a.status IN ('scheduled', 'confirmed', 'in_progress')`,
      [patientId]
    );
    for (const doc of doctors.rows) {
      await createNotification({
        recipientId: doc.user_id,
        type: 'lab_report_ready',
        title: 'Lab Report Ready',
        message: `${testName} results for ${patient.first_name} ${patient.last_name} are available.`,
        referenceId: insertResult.rows[0].id,
        referenceType: 'lab_report',
      });
    }

    res.status(201).json({ status: 'success', data: { id: insertResult.rows[0].id } });
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { result: testResult, notes } = req.body;

    const result = await db.query(
      `UPDATE lab_reports SET result = COALESCE($1, result), notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING id, patient_id, test_name`,
      [testResult, notes, id]
    );
    if (result.rows.length === 0) throw new AppError('Lab report not found.', 404);
    const report = result.rows[0];

    // Notify patient that results were updated
    if (testResult) {
      const patient = await db.query(
        `SELECT u.id AS user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [report.patient_id]
      );
      if (patient.rows[0]) {
        await createNotification({
          recipientId: patient.rows[0].user_id,
          type: 'lab_report_ready',
          title: 'Lab Results Updated',
          message: `Your ${report.test_name} results have been updated.`,
          referenceId: id,
          referenceType: 'lab_report',
        });
      }
    }

    res.json({ status: 'success', data: { id: report.id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, update };
