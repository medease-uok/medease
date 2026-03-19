const db = require('../config/database')
const AppError = require('../utils/AppError')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const resolveDoctorId = async (userId) => {
  const result = await db.query('SELECT id FROM doctors WHERE user_id = $1', [userId])
  if (result.rows.length === 0) throw new AppError('Not a doctor account.', 403)
  return result.rows[0].id
}

const getAll = async (req, res, next) => {
  try {
    const doctorId = await resolveDoctorId(req.user.id)

    const result = await db.query(
      `SELECT id, title, is_completed, priority, due_date, created_at, updated_at
       FROM doctor_tasks
       WHERE doctor_id = $1
       ORDER BY is_completed ASC, priority ASC, created_at DESC`,
      [doctorId]
    )

    res.json({
      status: 'success',
      data: result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        isCompleted: r.is_completed,
        priority: r.priority,
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const doctorId = await resolveDoctorId(req.user.id)
    const { title, dueDate } = req.body

    const result = await db.query(
      `INSERT INTO doctor_tasks (doctor_id, title, due_date)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed, priority, due_date, created_at, updated_at`,
      [doctorId, title.trim(), dueDate || null]
    )

    const r = result.rows[0]
    res.status(201).json({
      status: 'success',
      data: {
        id: r.id,
        title: r.title,
        isCompleted: r.is_completed,
        priority: r.priority,
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    })
  } catch (err) {
    return next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const doctorId = await resolveDoctorId(req.user.id)
    const { id } = req.params

    if (!UUID_RE.test(id)) throw new AppError('Invalid task ID.', 400)

    const { title, isCompleted, priority, dueDate } = req.body

    // Verify ownership
    const existing = await db.query(
      'SELECT id FROM doctor_tasks WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    )
    if (existing.rows.length === 0) throw new AppError('Task not found.', 404)

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

    const r = result.rows[0]
    res.json({
      status: 'success',
      data: {
        id: r.id,
        title: r.title,
        isCompleted: r.is_completed,
        priority: r.priority,
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    })
  } catch (err) {
    return next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const doctorId = await resolveDoctorId(req.user.id)
    const { id } = req.params

    if (!UUID_RE.test(id)) throw new AppError('Invalid task ID.', 400)

    const result = await db.query(
      'DELETE FROM doctor_tasks WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, doctorId]
    )
    if (result.rows.length === 0) throw new AppError('Task not found.', 404)

    res.json({ status: 'success', data: { id } })
  } catch (err) {
    return next(err)
  }
}

const reorder = async (req, res, next) => {
  try {
    const doctorId = await resolveDoctorId(req.user.id)
    const { orderedIds } = req.body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError('orderedIds must be a non-empty array of task IDs.', 400)
    }

    for (const taskId of orderedIds) {
      if (!UUID_RE.test(taskId)) {
        throw new AppError(`Invalid task ID: ${taskId}`, 400)
      }
    }

    const client = await db.getClient()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          'UPDATE doctor_tasks SET priority = $1, updated_at = NOW() WHERE id = $2 AND doctor_id = $3',
          [i, orderedIds[i], doctorId]
        )
      }
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    res.json({ status: 'success' })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getAll, create, update, remove, reorder }
