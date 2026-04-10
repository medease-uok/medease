const db = require('../config/database');
const AppError = require('../utils/AppError');

const formatTask = (r) => ({
  id: r.id,
  title: r.title,
  isCompleted: r.is_completed,
  priority: r.priority,
  dueDate: r.due_date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const getAll = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;

    const result = await db.query(
      `SELECT id, title, is_completed, priority, due_date, created_at, updated_at
       FROM nurse_tasks
       WHERE nurse_id = $1
       ORDER BY is_completed ASC, priority ASC, created_at DESC`,
      [nurseId]
    );

    res.json({
      status: 'success',
      data: result.rows.map(formatTask),
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;
    const { title, dueDate } = req.body;

    if (!title?.trim()) {
      throw new AppError('Task title is required.', 400);
    }

    const result = await db.query(
      `INSERT INTO nurse_tasks (nurse_id, title, due_date)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed, priority, due_date, created_at, updated_at`,
      [nurseId, title.trim(), dueDate || null]
    );

    res.status(201).json({
      status: 'success',
      data: formatTask(result.rows[0]),
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;
    const { id } = req.params;
    const { title, isCompleted, priority, dueDate } = req.body;

    if (title === undefined && isCompleted === undefined && priority === undefined && dueDate === undefined) {
      throw new AppError('No updatable fields provided.', 400);
    }

    const sets = ['updated_at = NOW()'];
    const params = [];

    if (title !== undefined) {
      params.push(title.trim());
      sets.push(`title = $${params.length}`);
    }
    if (isCompleted !== undefined) {
      params.push(isCompleted);
      sets.push(`is_completed = $${params.length}`);
    }
    if (priority !== undefined) {
      params.push(priority);
      sets.push(`priority = $${params.length}`);
    }
    if (dueDate !== undefined) {
      params.push(dueDate || null);
      sets.push(`due_date = $${params.length}`);
    }

    params.push(id);
    params.push(nurseId);
    
    const result = await db.query(
      `UPDATE nurse_tasks SET ${sets.join(', ')} 
       WHERE id = $${params.length - 1} AND nurse_id = $${params.length}
       RETURNING id, title, is_completed, priority, due_date, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Task not found or access denied.', 404);
    }

    res.json({
      status: 'success',
      data: formatTask(result.rows[0]),
    });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM nurse_tasks WHERE id = $1 AND nurse_id = $2 RETURNING id',
      [id, nurseId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Task not found or access denied.', 404);
    }

    res.json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (err) {
    next(err);
  }
};

const reorder = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const nurseId = req.nurseId;
    const { orderedIds } = req.body;

    await client.query('BEGIN');

    // Verify all tasks belong to this nurse inside the transaction
    // This solves the TOCTOU race condition
    const ownership = await client.query(
      'SELECT id FROM nurse_tasks WHERE nurse_id = $1 AND id = ANY($2::uuid[])',
      [nurseId, orderedIds]
    );
    
    if (ownership.rows.length !== orderedIds.length) {
      throw new AppError('One or more tasks not found or access denied.', 404);
    }

    // Bulk update using unnest
    await client.query(
      `UPDATE nurse_tasks AS nt
       SET priority = v.priority, updated_at = NOW()
       FROM (SELECT unnest($1::uuid[]) AS id, generate_subscripts($1::uuid[], 1) - 1 AS priority) v
       WHERE nt.id = v.id AND nt.nurse_id = $2`,
      [orderedIds, nurseId]
    );

    await client.query('COMMIT');

    // Return updated task list (consistent ordering)
    const result = await db.query(
      `SELECT id, title, is_completed, priority, due_date, created_at, updated_at
       FROM nurse_tasks
       WHERE nurse_id = $1
       ORDER BY is_completed ASC, priority ASC, created_at DESC`,
      [nurseId]
    );

    res.json({
      status: 'success',
      data: result.rows.map(formatTask),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getAll, create, update, remove, reorder };
