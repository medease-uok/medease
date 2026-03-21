const db = require('../config/database')
const AppError = require('../utils/AppError')
const { assertPatientAccess } = require('../utils/patientAccess')
const { createNotification } = require('./notifications.controller')
const auditLog = require('../utils/auditLog')

function mapPlan(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    itemCount: row.item_count != null ? Number(row.item_count) : undefined,
    completedItemCount: row.completed_item_count != null ? Number(row.completed_item_count) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row) {
  return {
    id: row.id,
    planId: row.plan_id,
    title: row.title,
    description: row.description,
    isCompleted: row.is_completed,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

const PLAN_SELECT = `
  SELECT tp.id, tp.patient_id, tp.doctor_id, tp.title, tp.description,
         tp.status, tp.priority, tp.start_date, tp.end_date,
         tp.notes, tp.created_at, tp.updated_at,
         'Dr. ' || du.first_name || ' ' || du.last_name AS doctor_name,
         COUNT(tpi.id) AS item_count,
         COUNT(tpi.id) FILTER (WHERE tpi.is_completed = TRUE) AS completed_item_count
  FROM treatment_plans tp
  LEFT JOIN doctors d ON tp.doctor_id = d.id
  LEFT JOIN users du ON d.user_id = du.id
  LEFT JOIN treatment_plan_items tpi ON tpi.plan_id = tp.id`

const PLAN_GROUP = `
  GROUP BY tp.id, tp.patient_id, tp.doctor_id, tp.title, tp.description,
           tp.status, tp.priority, tp.start_date, tp.end_date,
           tp.notes, tp.created_at, tp.updated_at,
           du.first_name, du.last_name`

const getByPatientId = async (req, res, next) => {
  try {
    const { patientId } = req.params

    await assertPatientAccess(req.user, patientId)

    const result = await db.query(
      `${PLAN_SELECT}
       WHERE tp.patient_id = $1
       ${PLAN_GROUP}
       ORDER BY CASE tp.status
         WHEN 'active' THEN 0
         WHEN 'on_hold' THEN 1
         WHEN 'completed' THEN 2
         WHEN 'cancelled' THEN 3
       END, tp.created_at DESC`,
      [patientId]
    )

    await auditLog({
      userId: req.user.id,
      action: 'VIEW_TREATMENT_PLANS',
      resourceType: 'treatment_plan',
      ip: req.ip,
    })

    res.json({ status: 'success', data: result.rows.map(mapPlan) })
  } catch (err) {
    return next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const { patientId, id } = req.params

    await assertPatientAccess(req.user, patientId)

    const [planResult, itemsResult] = await Promise.all([
      db.query(
        `${PLAN_SELECT}
         WHERE tp.id = $1 AND tp.patient_id = $2
         ${PLAN_GROUP}`,
        [id, patientId]
      ),
      db.query(
        `SELECT id, plan_id, title, description, is_completed, due_date,
                completed_at, sort_order, created_at
         FROM treatment_plan_items
         WHERE plan_id = $1
         ORDER BY sort_order, created_at`,
        [id]
      ),
    ])

    if (planResult.rows.length === 0) {
      throw new AppError('Treatment plan not found.', 404)
    }

    await auditLog({
      userId: req.user.id,
      action: 'VIEW_TREATMENT_PLAN',
      resourceType: 'treatment_plan',
      resourceId: id,
      ip: req.ip,
    })

    res.json({
      status: 'success',
      data: {
        ...mapPlan(planResult.rows[0]),
        items: itemsResult.rows.map(mapItem),
      },
    })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { patientId } = req.params
    const { title, description, status, priority, startDate, endDate, notes } = req.body

    await assertPatientAccess(req.user, patientId)

    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can create treatment plans.', 403)

    // Verify patient exists and get notification info
    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    )
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404)
    const patient = patientCheck.rows[0]

    const result = await db.query(
      `INSERT INTO treatment_plans
         (patient_id, doctor_id, title, description, status, priority, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        patientId, doctorId, title,
        description ?? null, status ?? 'active', priority ?? 'medium',
        startDate ?? null, endDate ?? null, notes ?? null,
      ]
    )

    const planId = result.rows[0].id

    // Bulk-insert initial items if provided
    const items = req.body.items
    if (Array.isArray(items) && items.length > 0) {
      const values = []
      const params = [planId]
      items.forEach((item, i) => {
        const base = i * 3 + 2
        values.push(`($1, $${base}, $${base + 1}, $${base + 2}, ${i})`)
        params.push(item.title, item.description ?? null, item.dueDate ?? null)
      })
      await db.query(
        `INSERT INTO treatment_plan_items (plan_id, title, description, due_date, sort_order)
         VALUES ${values.join(', ')}`,
        params
      )
    }

    // Fetch doctor name for notification
    const docInfo = await db.query(
      `SELECT u.first_name, u.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
      [doctorId]
    )
    const docName = docInfo.rows[0]
      ? `Dr. ${docInfo.rows[0].first_name} ${docInfo.rows[0].last_name}`
      : 'Your doctor'

    createNotification({
      recipientId: patient.user_id,
      type: 'treatment_plan_created',
      title: 'New Treatment Plan',
      message: `${docName} created a treatment plan: ${title}.`,
      referenceId: planId,
      referenceType: 'treatment_plan',
    })

    await auditLog({
      userId: req.user.id,
      action: 'CREATE_TREATMENT_PLAN',
      resourceType: 'treatment_plan',
      resourceId: planId,
      ip: req.ip,
      details: { patientId },
    })

    res.status(201).json({ status: 'success', data: { id: planId } })
  } catch (err) {
    return next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const { patientId, id } = req.params

    await assertPatientAccess(req.user, patientId)

    const fields = []
    const values = []
    const body = req.body

    if ('title' in body) { values.push(body.title); fields.push(`title = $${values.length}`) }
    if ('description' in body) { values.push(body.description ?? null); fields.push(`description = $${values.length}`) }
    if ('status' in body) { values.push(body.status); fields.push(`status = $${values.length}`) }
    if ('priority' in body) { values.push(body.priority); fields.push(`priority = $${values.length}`) }
    if ('startDate' in body) { values.push(body.startDate ?? null); fields.push(`start_date = $${values.length}`) }
    if ('endDate' in body) { values.push(body.endDate ?? null); fields.push(`end_date = $${values.length}`) }
    if ('notes' in body) { values.push(body.notes ?? null); fields.push(`notes = $${values.length}`) }

    if (fields.length === 0) {
      throw new AppError('No valid fields provided for update.', 400)
    }

    fields.push('updated_at = NOW()')
    const idIdx = values.length + 1
    const patientIdx = values.length + 2
    values.push(id, patientId)

    const result = await db.query(
      `UPDATE treatment_plans
       SET ${fields.join(', ')}
       WHERE id = $${idIdx} AND patient_id = $${patientIdx}
       RETURNING id`,
      values
    )

    if (result.rows.length === 0) {
      throw new AppError('Treatment plan not found.', 404)
    }

    await auditLog({
      userId: req.user.id,
      action: 'UPDATE_TREATMENT_PLAN',
      resourceType: 'treatment_plan',
      resourceId: id,
      ip: req.ip,
    })

    res.json({ status: 'success', data: { id: result.rows[0].id } })
  } catch (err) {
    return next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const { patientId, id } = req.params

    await assertPatientAccess(req.user, patientId)

    const result = await db.query(
      'DELETE FROM treatment_plans WHERE id = $1 AND patient_id = $2 RETURNING id, title',
      [id, patientId]
    )

    if (result.rows.length === 0) {
      throw new AppError('Treatment plan not found.', 404)
    }

    await auditLog({
      userId: req.user.id,
      action: 'DELETE_TREATMENT_PLAN',
      resourceType: 'treatment_plan',
      resourceId: id,
      metadata: { title: result.rows[0].title },
      ip: req.ip,
    })

    res.json({ status: 'success', message: 'Treatment plan removed.' })
  } catch (err) {
    return next(err)
  }
}

// ── Treatment Plan Items ──

const addItem = async (req, res, next) => {
  try {
    const { patientId, id: planId } = req.params
    const { title, description, dueDate } = req.body

    await assertPatientAccess(req.user, patientId)

    // Verify plan exists for this patient
    const planCheck = await db.query(
      'SELECT id FROM treatment_plans WHERE id = $1 AND patient_id = $2',
      [planId, patientId]
    )
    if (planCheck.rows.length === 0) throw new AppError('Treatment plan not found.', 404)

    // Get next sort order
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM treatment_plan_items WHERE plan_id = $1',
      [planId]
    )

    const result = await db.query(
      `INSERT INTO treatment_plan_items (plan_id, title, description, due_date, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [planId, title, description ?? null, dueDate ?? null, orderResult.rows[0].next_order]
    )

    res.status(201).json({ status: 'success', data: mapItem(result.rows[0]) })
  } catch (err) {
    return next(err)
  }
}

const updateItem = async (req, res, next) => {
  try {
    const { patientId, id: planId, itemId } = req.params

    await assertPatientAccess(req.user, patientId)

    const fields = []
    const values = []
    const body = req.body

    if ('title' in body) { values.push(body.title); fields.push(`title = $${values.length}`) }
    if ('description' in body) { values.push(body.description ?? null); fields.push(`description = $${values.length}`) }
    if ('isCompleted' in body) {
      values.push(body.isCompleted)
      fields.push(`is_completed = $${values.length}`)
      if (body.isCompleted) {
        fields.push('completed_at = NOW()')
      } else {
        fields.push('completed_at = NULL')
      }
    }
    if ('dueDate' in body) { values.push(body.dueDate ?? null); fields.push(`due_date = $${values.length}`) }

    if (fields.length === 0) {
      throw new AppError('No valid fields provided for update.', 400)
    }

    const planIdx = values.length + 1
    const itemIdx = values.length + 2
    values.push(planId, itemId)

    const result = await db.query(
      `UPDATE treatment_plan_items
       SET ${fields.join(', ')}
       WHERE plan_id = $${planIdx} AND id = $${itemIdx}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new AppError('Treatment plan item not found.', 404)
    }

    // Update parent plan's updated_at
    await db.query(
      'UPDATE treatment_plans SET updated_at = NOW() WHERE id = $1',
      [planId]
    )

    res.json({ status: 'success', data: mapItem(result.rows[0]) })
  } catch (err) {
    return next(err)
  }
}

const removeItem = async (req, res, next) => {
  try {
    const { patientId, id: planId, itemId } = req.params

    await assertPatientAccess(req.user, patientId)

    const result = await db.query(
      'DELETE FROM treatment_plan_items WHERE id = $1 AND plan_id = $2 RETURNING id',
      [itemId, planId]
    )

    if (result.rows.length === 0) {
      throw new AppError('Treatment plan item not found.', 404)
    }

    res.json({ status: 'success', message: 'Item removed.' })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getByPatientId, getById, create, update, remove, addItem, updateItem, removeItem }
