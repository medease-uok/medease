const db = require('../config/database')
const AppError = require('../utils/AppError')

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

const getAll = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can access templates.', 403)

    const templates = await db.query(
      `SELECT * FROM prescription_templates WHERE doctor_id = $1 ORDER BY updated_at DESC`,
      [doctorId]
    )

    const templateIds = templates.rows.map((t) => t.id)
    let itemsMap = {}

    if (templateIds.length > 0) {
      const items = await db.query(
        `SELECT * FROM prescription_template_items WHERE template_id = ANY($1) ORDER BY sort_order`,
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

const create = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can create templates.', 403)

    const { name, description, items } = req.body
    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('name and at least one item are required.', 400)
    }

    for (const item of items) {
      if (!item.medication || !item.dosage || !item.frequency) {
        throw new AppError('Each item requires medication, dosage, and frequency.', 400)
      }
    }

    const result = await db.query(
      `INSERT INTO prescription_templates (doctor_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [doctorId, name.trim(), description?.trim() || null]
    )
    const template = result.rows[0]

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await db.query(
        `INSERT INTO prescription_template_items (template_id, medicine_id, medication, dosage, frequency, duration, instructions, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          template.id,
          item.medicineId || null,
          item.medication.trim(),
          item.dosage.trim(),
          item.frequency.trim(),
          item.duration?.trim() || null,
          item.instructions?.trim() || null,
          i,
        ]
      )
    }

    const insertedItems = await db.query(
      `SELECT * FROM prescription_template_items WHERE template_id = $1 ORDER BY sort_order`,
      [template.id]
    )

    res.status(201).json({
      status: 'success',
      data: mapTemplate(template, insertedItems.rows),
    })
  } catch (err) {
    return next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can update templates.', 403)

    const { id } = req.params
    const { name, description, items } = req.body

    const existing = await db.query(
      `SELECT * FROM prescription_templates WHERE id = $1 AND doctor_id = $2`,
      [id, doctorId]
    )
    if (existing.rows.length === 0) throw new AppError('Template not found.', 404)

    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('name and at least one item are required.', 400)
    }

    for (const item of items) {
      if (!item.medication || !item.dosage || !item.frequency) {
        throw new AppError('Each item requires medication, dosage, and frequency.', 400)
      }
    }

    await db.query(
      `UPDATE prescription_templates SET name = $1, description = $2, updated_at = NOW() WHERE id = $3`,
      [name.trim(), description?.trim() || null, id]
    )

    await db.query(`DELETE FROM prescription_template_items WHERE template_id = $1`, [id])

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await db.query(
        `INSERT INTO prescription_template_items (template_id, medicine_id, medication, dosage, frequency, duration, instructions, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          item.medicineId || null,
          item.medication.trim(),
          item.dosage.trim(),
          item.frequency.trim(),
          item.duration?.trim() || null,
          item.instructions?.trim() || null,
          i,
        ]
      )
    }

    const updated = await db.query(`SELECT * FROM prescription_templates WHERE id = $1`, [id])
    const updatedItems = await db.query(
      `SELECT * FROM prescription_template_items WHERE template_id = $1 ORDER BY sort_order`,
      [id]
    )

    res.json({
      status: 'success',
      data: mapTemplate(updated.rows[0], updatedItems.rows),
    })
  } catch (err) {
    return next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const doctorId = req.user.doctorId
    if (!doctorId) throw new AppError('Only doctors can delete templates.', 403)

    const { id } = req.params
    const result = await db.query(
      `DELETE FROM prescription_templates WHERE id = $1 AND doctor_id = $2 RETURNING id`,
      [id, doctorId]
    )
    if (result.rows.length === 0) throw new AppError('Template not found.', 404)

    res.json({ status: 'success', message: 'Template deleted.' })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getAll, create, update, remove }
