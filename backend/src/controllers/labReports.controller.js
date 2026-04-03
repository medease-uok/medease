const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');
const { uploadLabReportToS3, getPresignedImageUrl, deleteFromS3 } = require('../middleware/upload');
const path = require('path');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  fileKey: row.file_key,
  fileName: row.file_name,
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
             lr.notes, lr.report_date, lr.file_key, lr.file_name,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             tu.first_name || ' ' || tu.last_name AS technician_name
      FROM lab_reports lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN users tu ON lr.technician_id = tu.id
      WHERE ${clause}
      ORDER BY lr.report_date DESC`;

    const result = await db.query(query, params);

    await auditLog({ userId: req.user.id, action: 'VIEW_LAB_REPORTS', resourceType: 'lab_report', ip: req.ip });

    const mappedReports = result.rows.map(mapReport);

    res.json({ status: 'success', data: mappedReports });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  let client;
  let fileKey = null;
  try {
    const { patientId, testName, result: testResult, notes, labTestRequestId } = req.body;

    if (!patientId || !testName) {
      throw new AppError('patientId and testName are required.', 400);
    }

    // Validate patientId is UUID
    if (!UUID_REGEX.test(patientId)) {
      throw new AppError('Invalid patientId format.', 400);
    }

    // Validate labTestRequestId if provided
    if (labTestRequestId && !UUID_REGEX.test(labTestRequestId)) {
      throw new AppError('Invalid labTestRequestId format.', 400);
    }

    const technicianId = req.user.id;

    client = await db.getClient();
    await client.query('BEGIN');

    const patientCheck = await client.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    );
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);
    const patient = patientCheck.rows[0];

    // Get doctor info if request ID provided
    let doctorInfo = null;
    let requestInfo = null;
    if (labTestRequestId) {
      const requestCheck = await client.query(
        `SELECT ltr.id, ltr.doctor_id, ltr.test_name, ltr.patient_id,
                d.department, du.id AS doctor_user_id,
                du.first_name AS doctor_first_name, du.last_name AS doctor_last_name
         FROM lab_test_requests ltr
         JOIN doctors d ON ltr.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE ltr.id = $1 AND ltr.patient_id = $2`,
        [labTestRequestId, patientId]
      );
      if (requestCheck.rows.length === 0) {
        throw new AppError('Lab test request not found or does not match patient.', 404);
      }
      requestInfo = requestCheck.rows[0];
      doctorInfo = {
        userId: requestInfo.doctor_user_id,
        name: `Dr. ${requestInfo.doctor_first_name} ${requestInfo.doctor_last_name}`,
        department: requestInfo.department,
      };
    }

    // Sanitize filename and upload to S3 before transaction
    let fileName = null;
    if (req.file) {
      const basename = path.basename(req.file.originalname);
      fileName = basename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
      // Upload to S3 before DB transaction
      // If transaction fails, we clean up in catch block
      fileKey = await uploadLabReportToS3(req.file, patientId);
    }

    // Insert report with file key
    const insertResult = await client.query(
      `INSERT INTO lab_reports (patient_id, technician_id, test_name, result, notes, file_key, file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [patientId, technicianId, testName, testResult || null, notes || null, fileKey, fileName]
    );

    const labReportId = insertResult.rows[0].id;

    // Update lab test request if provided
    if (labTestRequestId) {
      await client.query(
        `UPDATE lab_test_requests
         SET lab_report_id = $1, status = 'completed', updated_at = NOW()
         WHERE id = $2`,
        [labReportId, labTestRequestId]
      );
    }

    await client.query('COMMIT');

    // Notify patient
    createNotification({
      recipientId: patient.user_id,
      type: 'lab_report_ready',
      title: 'Lab Report Ready',
      message: `Your ${testName} results are now available.`,
      referenceId: insertResult.rows[0].id,
      referenceType: 'lab_report',
    });

    // If linked to a lab test request, notify the requesting doctor and department nurses
    if (doctorInfo) {
      createNotification({
        recipientId: doctorInfo.userId,
        type: 'lab_report_ready',
        title: 'Lab Report Ready',
        message: `${testName} results for ${patient.first_name} ${patient.last_name} are available.`,
        referenceId: insertResult.rows[0].id,
        referenceType: 'lab_report',
      });

      // Notify all nurses in the requesting doctor's department
      db.query(
        `SELECT u.id FROM nurses n
         JOIN users u ON n.user_id = u.id
         WHERE n.department = $1 AND u.is_active = true`,
        [doctorInfo.department]
      ).then((nurses) =>
        Promise.all(
          nurses.rows.map((nurse) =>
            createNotification({
              recipientId: nurse.id,
              type: 'lab_report_ready',
              title: 'Lab Report Ready',
              message: `${testName} results for ${patient.first_name} ${patient.last_name} (${doctorInfo.name}) are available.`,
              referenceId: insertResult.rows[0].id,
              referenceType: 'lab_report',
            })
          )
        )
      ).catch((err) => console.error('Failed to notify nurses:', err));
    }

    await auditLog({ userId: req.user.id, action: 'CREATE_LAB_REPORT', resourceType: 'lab_report', resourceId: insertResult.rows[0].id, ip: req.ip, details: { patientId, testName } });

    res.status(201).json({ status: 'success', data: { id: labReportId } });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch((rollbackErr) => console.error('Rollback error:', rollbackErr));
    }
    // Clean up S3 file if it was uploaded but DB transaction failed
    if (fileKey) {
      deleteFromS3(fileKey).catch((deleteErr) => console.error('Failed to clean up S3 file:', deleteErr));
    }
    return next(err);
  } finally {
    if (client) {
      client.release();
    }
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

    if (testResult) {
      db.query(
        `SELECT u.id AS user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [report.patient_id]
      ).then((patient) => {
        if (patient.rows[0]) {
          createNotification({
            recipientId: patient.rows[0].user_id,
            type: 'lab_report_ready',
            title: 'Lab Results Updated',
            message: `Your ${report.test_name} results have been updated.`,
            referenceId: id,
            referenceType: 'lab_report',
          });
        }
      }).catch((err) => console.error('Failed to notify patient:', err));
    }

    await auditLog({ userId: req.user.id, action: 'UPDATE_LAB_REPORT', resourceType: 'lab_report', resourceId: id, ip: req.ip });

    res.json({ status: 'success', data: { id: report.id } });
  } catch (err) {
    return next(err);
  }
};

const getDownloadUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      throw new AppError('Invalid report ID format.', 400);
    }

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

    const result = await db.query(
      `SELECT lr.id, lr.file_key, lr.file_name
       FROM lab_reports lr
       WHERE lr.id = $1 AND ${clause}`,
      [id, ...params]
    );

    if (result.rows.length === 0) {
      throw new AppError('Lab report not found or access denied.', 404);
    }

    const report = result.rows[0];

    if (!report.file_key) {
      throw new AppError('No file attached to this report.', 404);
    }

    const url = await getPresignedImageUrl(report.file_key);

    res.json({
      status: 'success',
      data: {
        url,
        fileName: report.file_name,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, update, getDownloadUrl };
