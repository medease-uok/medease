const db = require('../config/database');
const AppError = require('../utils/AppError');
const { buildAccessFilter } = require('../utils/abac');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');
const { uploadLabReportToS3, getPresignedImageUrl, deleteFromS3, getS3Object } = require('../middleware/upload');
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

/**
 * Build nurse department filter for lab reports
 * Restricts nurses to only see lab reports for patients who have appointments
 * with doctors from the same department as the nurse
 *
 * @param {string} userId - User ID of the nurse
 * @param {string} patientId - Optional patient ID to verify access for
 * @param {number} currentParamCount - Current count of query parameters
 * @returns {Object} { filter: string, param: string } - SQL filter and department parameter
 */
const buildNurseDepartmentFilter = async (userId, patientId, currentParamCount) => {
  const nurseInfo = await db.query(
    `SELECT department FROM nurses WHERE user_id = $1`,
    [userId]
  );

  if (nurseInfo.rows.length === 0) {
    throw new AppError('Access denied.', 403);
  }

  const nurseDepartment = nurseInfo.rows[0].department;

  // IDOR Prevention: If a specific patientId is requested, verify the patient is in nurse's department
  if (patientId) {
    const patientDeptCheck = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = $1 AND d.department = $2
      ) AS has_access`,
      [patientId, nurseDepartment]
    );

    if (!patientDeptCheck.rows[0].has_access) {
      throw new AppError('Access denied. Patient not in your department.', 403);
    }
  }

  // Build SQL filter that restricts to patients in this department
  const filter = `AND EXISTS (
    SELECT 1 FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = lr.patient_id
    AND d.department = $${currentParamCount + 1}
  )`;

  return { filter, param: nurseDepartment };
};

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

    // For nurses, restrict to patients from their department
    let nurseFilter = '';
    let queryParams = [...params];
    if (req.user.role === 'nurse') {
      const { filter, param } = await buildNurseDepartmentFilter(req.user.id, null, queryParams.length);
      nurseFilter = filter;
      queryParams.push(param);
    }

    const query = `
      SELECT lr.id, lr.patient_id, lr.technician_id, lr.test_name, lr.result,
             lr.notes, lr.report_date, lr.file_key, lr.file_name,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             tu.first_name || ' ' || tu.last_name AS technician_name
      FROM lab_reports lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN users tu ON lr.technician_id = tu.id
      WHERE ${clause} ${nurseFilter}
      ORDER BY lr.report_date DESC`;

    const result = await db.query(query, queryParams);

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

const streamFile = async (req, res, next) => {
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

    // Get the file from S3
    const s3Response = await getS3Object(report.file_key);

    // Set response headers
    res.setHeader('Content-Type', s3Response.ContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.file_name}"`);
    res.setHeader('Content-Length', s3Response.ContentLength);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    s3Response.Body.pipe(res);
  } catch (err) {
    return next(err);
  }
};

/**
 * Parse numeric values from lab report result text
 * Extracts metrics with their values for charting
 */
const parseNumericValues = (result) => {
  if (!result) return {};

  const metrics = {};

  // Common patterns: "MetricName: 123.4 unit" or "MetricName 123.4 unit"
  // Match patterns like "WBC: 7.2 x10^9/L", "Hemoglobin: 13.5 g/dL", "TSH: 2.8 mIU/L"
  const patterns = [
    /(\w+(?:\s+\w+)*?):\s*([\d.]+)/g,  // "Name: 123.4"
    /(\w+(?:\s+\w+)*?)\s+([\d.]+)\s*(?:mg\/dL|mmHg|mIU\/L|g\/dL|x10\^|bpm|%)/g,  // "Name 123.4 unit"
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(result)) !== null) {
      const [, name, value] = match;
      const normalizedName = name.trim().replace(/\s+/g, ' ');
      const numericValue = parseFloat(value);

      if (!isNaN(numericValue) && normalizedName) {
        metrics[normalizedName] = numericValue;
      }
    }
  }

  return metrics;
};

/**
 * Get lab reports for comparison - grouped by test name with parsed numeric values
 * Supports filtering by patient (own data for patients, any patient for staff)
 * Nurses can only see reports for patients in their department (patients with appointments from doctors in the same department)
 */
const getComparison = async (req, res, next) => {
  try {
    // codeql[js/sensitive-get-query] - patientId is a UUID resource identifier for filtering comparison data, not a secret; RESTful API design with ABAC authorization checks
    const { patientId } = req.query;

    // Validate patientId if provided
    if (patientId && !UUID_REGEX.test(patientId)) {
      throw new AppError('Invalid patientId format.', 400);
    }

    const subject = {
      id: req.user.id,
      role: req.user.role,
      patientId: req.user.patientId,
    };

    // IDOR Prevention: Verify user is authorized to access the requested patient's data
    if (patientId && req.user.role === 'patient' && req.user.patientId !== patientId) {
      throw new AppError('You can only view your own lab reports.', 403);
    }

    const columnMap = {
      patient_id: 'lr.patient_id',
      technician_id: 'lr.technician_id',
    };

    const { clause, params } = await buildAccessFilter('lab_report', subject, columnMap);

    // Add patient filter if provided
    let patientFilter = '';
    let queryParams = [...params];
    if (patientId) {
      queryParams.push(patientId);
      patientFilter = `AND lr.patient_id = $${queryParams.length}`;
    }

    // For nurses, restrict to patients from their department
    let nurseFilter = '';
    if (req.user.role === 'nurse') {
      const { filter, param } = await buildNurseDepartmentFilter(req.user.id, patientId, queryParams.length);
      nurseFilter = filter;
      queryParams.push(param);
    }

    // Get all reports for comparison
    const query = `
      SELECT lr.id, lr.patient_id, lr.test_name, lr.result,
             lr.notes, lr.report_date,
             pu.first_name || ' ' || pu.last_name AS patient_name
      FROM lab_reports lr
      JOIN patients p ON lr.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE ${clause} ${patientFilter} ${nurseFilter}
      ORDER BY lr.test_name, lr.report_date ASC`;

    const result = await db.query(query, queryParams);

    // Group by test name and parse numeric values
    const groupedData = {};
    const testNames = new Set();

    for (const row of result.rows) {
      const testName = row.test_name;
      testNames.add(testName);

      if (!groupedData[testName]) {
        groupedData[testName] = [];
      }

      const metrics = parseNumericValues(row.result);

      groupedData[testName].push({
        id: row.id,
        reportDate: row.report_date,
        date: new Date(row.report_date).toISOString().split('T')[0], // YYYY-MM-DD
        notes: row.notes,
        rawResult: row.result,
        metrics,
      });
    }

    // Get test names with multiple results (only these can be compared)
    const comparableTests = Array.from(testNames).filter(
      (testName) => groupedData[testName].length > 1
    );

    await auditLog({
      userId: req.user.id,
      action: 'VIEW_LAB_COMPARISON',
      resourceType: 'lab_report',
      ip: req.ip,
      details: { patientId: patientId || 'all' }
    });

    res.json({
      status: 'success',
      data: {
        allTests: Array.from(testNames).sort(),
        comparableTests: comparableTests.sort(),
        reports: groupedData,
        patientName: result.rows[0]?.patient_name,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, create, update, getDownloadUrl, streamFile, getComparison };
