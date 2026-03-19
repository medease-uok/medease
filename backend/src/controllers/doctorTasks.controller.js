const db = require('../config/database')
const AppError = require('../utils/AppError')

const formatTask = (r) => ({
  id: r.id,
  title: r.title,
  isCompleted: r.is_completed,
  priority: r.priority,
  dueDate: r.due_date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const getAll = async (req, res, next) => {
  try {
    const doctorId = req.doctorId

    const result = await db.query(
      `SELECT id, title, is_completed, priority, due_date, created_at, updated_at
       FROM doctor_tasks
       WHERE doctor_id = $1
       ORDER BY is_completed ASC, priority ASC, created_at DESC`,
      [doctorId]
    )

    res.json({
      status: 'success',
      data: result.rows.map(formatTask),
    })
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const doctorId = req.doctorId
    const { title, dueDate } = req.body

    const result = await db.query(
      `INSERT INTO doctor_tasks (doctor_id, title, due_date)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed, priority, due_date, created_at, updated_at`,
      [doctorId, title.trim(), dueDate || null]
    )

    res.status(201).json({
      status: 'success',
      data: formatTask(result.rows[0]),
    })
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const doctorId = req.doctorId
    const { id } = req.params
    const { title, isCompleted, priority, dueDate } = req.body

    if (title === undefined && isCompleted === undefined && priority === undefined && dueDate === undefined) {
      throw new AppError('No updatable fields provided.', 400)
    }

    // Verify ownership
    const existing = await db.query(
      'SELECT id FROM doctor_tasks WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    )
    if (existing.rows.length === 0) throw new AppError('Task not found or access denied.', 404)

    const sets = ['updated_at = NOW()']
    const params = []
    let idx = 1

    if (title !== undefined) {
      sets.push(`title = $${idx}`)
      params.push(title.trim())
      idx++
    }
    if (isCompleted !== undefined) {
      sets.push(`is_completed = $${idx}`)
      params.push(isCompleted)
      idx++
    }
    if (priority !== undefined) {
      sets.push(`priority = $${idx}`)
      params.push(priority)
      idx++
    }
    if (dueDate !== undefined) {
      sets.push(`due_date = $${idx}`)
      params.push(dueDate || null)
      idx++
    }

    params.push(id)
    const result = await db.query(
      `UPDATE doctor_tasks SET ${sets.join(', ')} WHERE id = $${idx}
       RETURNING id, title, is_completed, priority, due_date, created_at, updated_at`,
      params
    )

    res.json({
      status: 'success',
      data: formatTask(result.rows[0]),
    })
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const doctorId = req.doctorId
    const { id } = req.params

    const result = await db.query(
      'DELETE FROM doctor_tasks WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, doctorId]
    )
    if (result.rows.length === 0) throw new AppError('Task not found or access denied.', 404)

    res.json({ status: 'success', data: { id } })
  } catch (err) {
    next(err)
  }
}

const reorder = async (req, res, next) => {
  try {
    const doctorId = req.doctorId
    const { orderedIds } = req.body

    // Verify all tasks belong to this doctor before reordering
    const ownership = await db.query(
      'SELECT id FROM doctor_tasks WHERE doctor_id = $1 AND id = ANY($2::uuid[])',
      [doctorId, orderedIds]
    )
    if (ownership.rows.length !== orderedIds.length) {
      throw new AppError('One or more tasks not found or access denied.', 404)
    }

    // Bulk update using unnest for performance
    await db.query(
      `UPDATE doctor_tasks AS dt
       SET priority = v.priority, updated_at = NOW()
       FROM (SELECT unnest($1::uuid[]) AS id, generate_subscripts($1::uuid[], 1) - 1 AS priority) v
       WHERE dt.id = v.id AND dt.doctor_id = $2`,
      [orderedIds, doctorId]
    )

    // Return updated task list
    const result = await db.query(
      `SELECT id, title, is_completed, priority, due_date, created_at, updated_at
       FROM doctor_tasks
       WHERE doctor_id = $1
       ORDER BY is_completed ASC, priority ASC, created_at DESC`,
      [doctorId]
    )

    res.json({
      status: 'success',
      data: result.rows.map(formatTask),
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, create, update, remove, reorder }
