const db = require('../config/database')
const AppError = require('../utils/AppError')
const { createNotification } = require('./notifications.controller')
const auditLog = require('../utils/auditLog')

const mapFeedback = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.is_anonymous ? 'Anonymous' : row.patient_name,
  doctorId: row.doctor_id,
  doctorName: row.doctor_name,
  appointmentId: row.appointment_id,
  rating: row.rating,
  communicationRating: row.communication_rating,
  waitTimeRating: row.wait_time_rating,
  treatmentRating: row.treatment_rating,
  comment: row.comment,
  isAnonymous: row.is_anonymous,
  createdAt: row.created_at,
})

const getAll = async (req, res, next) => {
  try {
    const { role } = req.user
    let clause
    let params = []

    if (role === 'admin' || role === 'nurse') {
      clause = 'TRUE'
    } else if (role === 'doctor') {
      clause = 'f.doctor_id = $1'
      params = [req.user.doctorId]
    } else if (role === 'patient') {
      clause = 'f.patient_id = $1'
      params = [req.user.patientId]
    } else {
      clause = 'FALSE'
    }

    const result = await db.query(
      `SELECT f.id, f.patient_id, f.doctor_id, f.appointment_id,
              f.rating, f.communication_rating, f.wait_time_rating, f.treatment_rating,
              f.comment, f.is_anonymous, f.created_at,
              CASE WHEN f.is_anonymous THEN 'Anonymous' ELSE pu.first_name || ' ' || pu.last_name END AS patient_name,
              'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name
       FROM patient_feedback f
       JOIN patients p ON f.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON f.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE ${clause}
       ORDER BY f.created_at DESC`,
      params
    )

    res.json({ status: 'success', data: result.rows.map(mapFeedback) })
  } catch (err) {
    return next(err)
  }
}

const getDoctorStats = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.user.doctorId
    if (!doctorId) throw new AppError('Doctor ID is required.', 400)

    const stats = await db.query(
      `SELECT
         COUNT(*) AS total_reviews,
         ROUND(AVG(rating)::numeric, 1) AS avg_rating,
         ROUND(AVG(communication_rating)::numeric, 1) AS avg_communication,
         ROUND(AVG(wait_time_rating)::numeric, 1) AS avg_wait_time,
         ROUND(AVG(treatment_rating)::numeric, 1) AS avg_treatment,
         COUNT(*) FILTER (WHERE rating = 5) AS five_star,
         COUNT(*) FILTER (WHERE rating = 4) AS four_star,
         COUNT(*) FILTER (WHERE rating = 3) AS three_star,
         COUNT(*) FILTER (WHERE rating = 2) AS two_star,
         COUNT(*) FILTER (WHERE rating = 1) AS one_star
       FROM patient_feedback
       WHERE doctor_id = $1`,
      [doctorId]
    )

    const recent = await db.query(
      `SELECT f.id, f.rating, f.communication_rating, f.wait_time_rating,
              f.treatment_rating, f.comment, f.is_anonymous, f.created_at,
              CASE WHEN f.is_anonymous THEN 'Anonymous' ELSE pu.first_name || ' ' || pu.last_name END AS patient_name
       FROM patient_feedback f
       JOIN patients p ON f.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       WHERE f.doctor_id = $1
       ORDER BY f.created_at DESC
       LIMIT 10`,
      [doctorId]
    )

    const s = stats.rows[0]
    res.json({
      status: 'success',
      data: {
        totalReviews: parseInt(s.total_reviews, 10),
        avgRating: parseFloat(s.avg_rating) || 0,
        avgCommunication: parseFloat(s.avg_communication) || 0,
        avgWaitTime: parseFloat(s.avg_wait_time) || 0,
        avgTreatment: parseFloat(s.avg_treatment) || 0,
        distribution: {
          5: parseInt(s.five_star, 10),
          4: parseInt(s.four_star, 10),
          3: parseInt(s.three_star, 10),
          2: parseInt(s.two_star, 10),
          1: parseInt(s.one_star, 10),
        },
        recentFeedback: recent.rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          communicationRating: r.communication_rating,
          waitTimeRating: r.wait_time_rating,
          treatmentRating: r.treatment_rating,
          comment: r.comment,
          isAnonymous: r.is_anonymous,
          patientName: r.patient_name,
          createdAt: r.created_at,
        })),
      },
    })
  } catch (err) {
    return next(err)
  }
}

const getOverviewStats = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         d.id AS doctor_id,
         'Dr. ' || u.first_name || ' ' || u.last_name AS doctor_name,
         d.department,
         d.specialization,
         COUNT(f.id) AS total_reviews,
         ROUND(AVG(f.rating)::numeric, 1) AS avg_rating,
         ROUND(AVG(f.communication_rating)::numeric, 1) AS avg_communication,
         ROUND(AVG(f.wait_time_rating)::numeric, 1) AS avg_wait_time,
         ROUND(AVG(f.treatment_rating)::numeric, 1) AS avg_treatment
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN patient_feedback f ON f.doctor_id = d.id
       GROUP BY d.id, u.first_name, u.last_name, d.department, d.specialization
       ORDER BY avg_rating DESC NULLS LAST`
    )

    const overall = await db.query(
      `SELECT
         COUNT(*) AS total_reviews,
         ROUND(AVG(rating)::numeric, 1) AS avg_rating,
         ROUND(AVG(communication_rating)::numeric, 1) AS avg_communication,
         ROUND(AVG(wait_time_rating)::numeric, 1) AS avg_wait_time,
         ROUND(AVG(treatment_rating)::numeric, 1) AS avg_treatment
       FROM patient_feedback`
    )

    const o = overall.rows[0]
    res.json({
      status: 'success',
      data: {
        overall: {
          totalReviews: parseInt(o.total_reviews, 10),
          avgRating: parseFloat(o.avg_rating) || 0,
          avgCommunication: parseFloat(o.avg_communication) || 0,
          avgWaitTime: parseFloat(o.avg_wait_time) || 0,
          avgTreatment: parseFloat(o.avg_treatment) || 0,
        },
        doctors: result.rows.map((r) => ({
          doctorId: r.doctor_id,
          doctorName: r.doctor_name,
          department: r.department,
          specialization: r.specialization,
          totalReviews: parseInt(r.total_reviews, 10),
          avgRating: parseFloat(r.avg_rating) || 0,
          avgCommunication: parseFloat(r.avg_communication) || 0,
          avgWaitTime: parseFloat(r.avg_wait_time) || 0,
          avgTreatment: parseFloat(r.avg_treatment) || 0,
        })),
      },
    })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const patientId = req.user.patientId
    if (!patientId) throw new AppError('Only patients can submit feedback.', 403)

    const {
      doctorId, appointmentId, rating,
      communicationRating, waitTimeRating, treatmentRating,
      comment, isAnonymous,
    } = req.body

    if (!doctorId || !rating) {
      throw new AppError('doctorId and rating are required.', 400)
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5.', 400)
    }

    // Verify doctor exists
    const docCheck = await db.query(
      'SELECT d.id, u.id AS user_id FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1',
      [doctorId]
    )
    if (docCheck.rows.length === 0) throw new AppError('Doctor not found.', 404)

    // If appointmentId provided, verify it belongs to this patient and doctor
    if (appointmentId) {
      const apptCheck = await db.query(
        `SELECT id FROM appointments WHERE id = $1 AND patient_id = $2 AND doctor_id = $3 AND status = 'completed'`,
        [appointmentId, patientId, doctorId]
      )
      if (apptCheck.rows.length === 0) {
        throw new AppError('Appointment not found or not completed.', 400)
      }
    }

    const result = await db.query(
      `INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating,
         communication_rating, wait_time_rating, treatment_rating, comment, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        patientId, doctorId, appointmentId || null, rating,
        communicationRating || null, waitTimeRating || null, treatmentRating || null,
        comment?.trim() || null, isAnonymous || false,
      ]
    )

    // Notify the doctor
    createNotification({
      recipientId: docCheck.rows[0].user_id,
      type: 'feedback_received',
      title: 'New Patient Feedback',
      message: `You received a ${rating}-star rating from ${isAnonymous ? 'an anonymous patient' : 'a patient'}.`,
      referenceId: result.rows[0].id,
      referenceType: 'feedback',
    })

    await auditLog({
      userId: req.user.id,
      action: 'SUBMIT_FEEDBACK',
      resourceType: 'feedback',
      resourceId: result.rows[0].id,
      ip: req.ip,
      details: { doctorId, rating },
    })

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getAll, getDoctorStats, getOverviewStats, create }
