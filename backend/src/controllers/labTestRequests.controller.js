const db = require('../config/database')
const AppError = require('../utils/AppError')
const { createNotification } = require('./notifications.controller')
const auditLog = require('../utils/auditLog')

const mapRequest = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  doctorId: row.doctor_id,
  doctorName: row.doctor_name,
  testName: row.test_name,
  priority: row.priority,
  clinicalNotes: row.clinical_notes,
  status: row.status,
  assignedTo: row.assigned_to,
  assignedToName: row.assigned_to_name,
  labReportId: row.lab_report_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const getAll = async (req, res, next) => {
  try {
    const { role } = req.user
    let clause
    let params = []

    if (role === 'admin') {
      clause = 'TRUE'
    } else if (role === 'doctor') {
      clause = 'r.doctor_id = $1'
      params = [req.user.doctorId]
    } else if (role === 'lab_technician') {
      clause = '(r.assigned_to = $1 OR r.assigned_to IS NULL)'
      params = [req.user.id]
    } else if (role === 'nurse') {
      clause = `r.doctor_id IN (
        SELECT d.id FROM doctors d
        WHERE d.department = (SELECT n.department FROM nurses n WHERE n.user_id = $1)
      )`
      params = [req.user.id]
    } else if (role === 'patient') {
      clause = 'r.patient_id = $1'
      params = [req.user.patientId]
    } else {
      clause = 'FALSE'
    }

    const { status: filterStatus } = req.query

    let statusFilter = ''
    if (filterStatus) {
      params.push(filterStatus)
      statusFilter = ` AND r.status = $${params.length}`
    }

    const result = await db.query(
      `SELECT r.id, r.patient_id, r.doctor_id, r.test_name, r.priority,
              r.clinical_notes, r.status, r.assigned_to, r.lab_report_id,
              r.created_at, r.updated_at,
              pu.first_name || ' ' || pu.last_name AS patient_name,
              'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
              au.first_name || ' ' || au.last_name AS assigned_to_name
       FROM lab_test_requests r
       JOIN patients p ON r.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       LEFT JOIN users au ON r.assigned_to = au.id
       WHERE ${clause}${statusFilter}
       ORDER BY
         CASE r.priority WHEN 'urgent' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
         r.created_at DESC`,
      params
    )

    res.json({ status: 'success', data: result.rows.map(mapRequest) })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can request lab tests.', 403)

    const { patientId, testName, priority, clinicalNotes } = req.body

    if (!patientId || !testName) {
      throw new AppError('patientId and testName are required.', 400)
    }

    // Verify patient exists
    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    )
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404)
    const patient = patientCheck.rows[0]

    const doctorInfo = await db.query(
      `SELECT u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [doctorId]
    )
    const docName = doctorInfo.rows[0]
      ? `Dr. ${doctorInfo.rows[0].first_name} ${doctorInfo.rows[0].last_name}`
      : 'Your doctor'

    const result = await db.query(
      `INSERT INTO lab_test_requests (patient_id, doctor_id, test_name, priority, clinical_notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [patientId, doctorId, testName.trim(), priority || 'normal', clinicalNotes?.trim() || null]
    )

    // Notify the patient
    createNotification({
      recipientId: patient.user_id,
      type: 'lab_test_requested',
      title: 'Lab Test Ordered',
      message: `${docName} has ordered a ${testName} test for you.`,
      referenceId: result.rows[0].id,
      referenceType: 'lab_test_request',
    })

    // Notify all lab technicians
    db.query(`SELECT id FROM users WHERE role = 'lab_technician' AND is_active = true`)
      .then((techs) =>
        Promise.all(
          techs.rows.map((tech) =>
            createNotification({
              recipientId: tech.id,
              type: 'lab_test_requested',
              title: 'New Lab Test Request',
              message: `${docName} ordered ${testName} for ${patient.first_name} ${patient.last_name}.${priority === 'urgent' ? ' (URGENT)' : ''}`,
              referenceId: result.rows[0].id,
              referenceType: 'lab_test_request',
            })
          )
        )
      )
      .catch((err) => console.error('Failed to notify lab technicians:', err.message))

    await auditLog({
      userId: req.user.id,
      action: 'CREATE_LAB_TEST_REQUEST',
      resourceType: 'lab_test_request',
      resourceId: result.rows[0].id,
      ip: req.ip,
      details: { patientId, testName, priority },
    })

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } })
  } catch (err) {
    return next(err)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, assignedTo, labReportId } = req.body

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400)
    }

    const existing = await db.query(
      `SELECT r.id, r.patient_id, r.doctor_id, r.test_name,
              p.user_id AS patient_user_id, du.id AS doctor_user_id
       FROM lab_test_requests r
       JOIN patients p ON r.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE r.id = $1`,
      [id]
    )
    if (existing.rows.length === 0) throw new AppError('Lab test request not found.', 404)
    const request = existing.rows[0]

    const sets = ['updated_at = NOW()']
    const params = []
    let idx = 1

    if (status) {
      sets.push(`status = $${idx}`)
      params.push(status)
      idx++
    }
    if (assignedTo) {
      sets.push(`assigned_to = $${idx}`)
      params.push(assignedTo)
      idx++
    }
    if (labReportId) {
      sets.push(`lab_report_id = $${idx}`)
      params.push(labReportId)
      idx++
    }

    params.push(id)
    await db.query(
      `UPDATE lab_test_requests SET ${sets.join(', ')} WHERE id = $${idx}`,
      params
    )

    // Notify patient and doctor when status changes
    if (status === 'in_progress') {
      createNotification({
        recipientId: request.patient_user_id,
        type: 'lab_test_requested',
        title: 'Lab Test In Progress',
        message: `Your ${request.test_name} test is now being processed.`,
        referenceId: id,
        referenceType: 'lab_test_request',
      })
    } else if (status === 'completed') {
      createNotification({
        recipientId: request.patient_user_id,
        type: 'lab_report_ready',
        title: 'Lab Test Completed',
        message: `Your ${request.test_name} test has been completed.`,
        referenceId: id,
        referenceType: 'lab_test_request',
      })
      createNotification({
        recipientId: request.doctor_user_id,
        type: 'lab_report_ready',
        title: 'Lab Test Completed',
        message: `${request.test_name} results are ready for your patient.`,
        referenceId: id,
        referenceType: 'lab_test_request',
      })
    }

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_LAB_TEST_REQUEST',
      resourceType: 'lab_test_request',
      resourceId: id,
      ip: req.ip,
      details: { status },
    })

    res.json({ status: 'success', data: { id } })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getAll, create, updateStatus }
