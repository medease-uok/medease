const db = require('../config/database')
const AppError = require('../utils/AppError')

const TEMPLATE_COLS = 'id, doctor_id, name, description, created_at, updated_at'
const ITEM_COLS = 'id, template_id, medicine_id, medication, dosage, frequency, duration, instructions, sort_order'

const mapTemplate = (row, items = []) => ({
  id: row.id,
  doctorId: row.doctor_id,
  name: row.name,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: items.map((i) => ({
    id: i.id,
    medicineId: i.medicine_id,
    medication: i.medication,
    dosage: i.dosage,
    frequency: i.frequency,
    duration: i.duration,
    instructions: i.instructions,
    sortOrder: i.sort_order,
  })),
})

const validateItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one item is required.', 400)
  }
  for (const item of items) {
    if (!item.medication || !item.dosage || !item.frequency) {
      throw new AppError('Each item requires medication, dosage, and frequency.', 400)
    }
  }
}

const buildBulkInsert = (templateId, items) => {
  const values = []
  const params = []
  items.forEach((item, i) => {
    const offset = i * 8
    values.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
    )
    params.push(
      templateId,
      item.medicineId || null,
      item.medication.trim(),
      item.dosage.trim(),
      item.frequency.trim(),
      item.duration?.trim() || null,
      item.instructions?.trim() || null,
      i
    )
  })
  return {
    text: `INSERT INTO prescription_template_items (template_id, medicine_id, medication, dosage, frequency, duration, instructions, sort_order)
           VALUES ${values.join(', ')} RETURNING ${ITEM_COLS}`,
    params,
  }
}

const getAll = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can access templates.', 403)

    const templates = await db.query(
      `SELECT ${TEMPLATE_COLS} FROM prescription_templates WHERE doctor_id = $1 ORDER BY updated_at DESC`,
      [doctorId]
    )

    const templateIds = templates.rows.map((t) => t.id)
    let itemsMap = {}

    if (templateIds.length > 0) {
      const items = await db.query(
        `SELECT ${ITEM_COLS} FROM prescription_template_items WHERE template_id = ANY($1) ORDER BY sort_order`,
        [templateIds]
      )
      for (const item of items.rows) {
        if (!itemsMap[item.template_id]) itemsMap[item.template_id] = []
        itemsMap[item.template_id].push(item)
      }
    }

    res.json({
      status: 'success',
      data: templates.rows.map((t) => mapTemplate(t, itemsMap[t.id] || [])),
    })
  } catch (err) {
    return next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can access templates.', 403)

    const { id } = req.params
    const template = await db.query(
      `SELECT ${TEMPLATE_COLS} FROM prescription_templates WHERE id = $1 AND doctor_id = $2`,
      [id, doctorId]
    )
    if (template.rows.length === 0) throw new AppError('Template not found.', 404)

    const items = await db.query(
      `SELECT ${ITEM_COLS} FROM prescription_template_items WHERE template_id = $1 ORDER BY sort_order`,
      [id]
    )

    res.json({
      status: 'success',
      data: mapTemplate(template.rows[0], items.rows),
    })
  } catch (err) {
    return next(err)
  }
}

const create = async (req, res, next) => {
  const client = await db.getClient()
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can create templates.', 403)

    const { name, description, items } = req.body
    if (!name) throw new AppError('name is required.', 400)
    validateItems(items)

    await client.query('BEGIN')

    const result = await client.query(
      `INSERT INTO prescription_templates (doctor_id, name, description) VALUES ($1, $2, $3) RETURNING ${TEMPLATE_COLS}`,
      [doctorId, name.trim(), description?.trim() || null]
    )
    const template = result.rows[0]

    const bulk = buildBulkInsert(template.id, items)
    const insertedItems = await client.query(bulk.text, bulk.params)

    await client.query('COMMIT')

    res.status(201).json({
      status: 'success',
      data: mapTemplate(template, insertedItems.rows),
    })
  } catch (err) {
    await client.query('ROLLBACK')
    return next(err)
  } finally {
    client.release()
  }
}

const update = async (req, res, next) => {
  const client = await db.getClient()
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can update templates.', 403)

    const { id } = req.params
    const { name, description, items } = req.body

    if (!name) throw new AppError('name is required.', 400)
    validateItems(items)

    await client.query('BEGIN')

    const existing = await client.query(
      `SELECT id FROM prescription_templates WHERE id = $1 AND doctor_id = $2`,
      [id, doctorId]
    )
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK')
      throw new AppError('Template not found.', 404)
    }

    const updated = await client.query(
      `UPDATE prescription_templates SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING ${TEMPLATE_COLS}`,
      [name.trim(), description?.trim() || null, id]
    )

    await client.query('DELETE FROM prescription_template_items WHERE template_id = $1', [id])

    const bulk = buildBulkInsert(id, items)
    const insertedItems = await client.query(bulk.text, bulk.params)

    await client.query('COMMIT')

    res.json({
      status: 'success',
      data: mapTemplate(updated.rows[0], insertedItems.rows),
    })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return next(err)
  } finally {
    client.release()
  }
}

const remove = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can delete templates.', 403)

    const { id } = req.params
    const result = await db.query(
      'DELETE FROM prescription_templates WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, doctorId]
    )
    if (result.rows.length === 0) throw new AppError('Template not found.', 404)

    res.json({ status: 'success', message: 'Template deleted.' })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getAll, getById, create, update, remove }
