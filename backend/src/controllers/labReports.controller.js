const db = require('../config/database');
const { buildAccessFilter } = require('../utils/abac');

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

    const reports = result.rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      technicianId: row.technician_id,
      patientName: row.patient_name,
      technicianName: row.technician_name,
      testName: row.test_name,
      result: row.result,
      notes: row.notes,
      reportDate: row.report_date,
    }));

    res.json({ status: 'success', data: reports });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll };
