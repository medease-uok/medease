const db = require('../config/database')

const search = async (req, res, next) => {
  try {
    const { q, category, form, limit = 20 } = req.query

    const conditions = ['m.is_active = true']
    const params = []
    let idx = 1

    if (q && q.trim().length > 0) {
      conditions.push(
        `(m.generic_name ILIKE $${idx} OR m.brand_name ILIKE $${idx} OR m.strength ILIKE $${idx})`
      )
      params.push(`%${q.trim()}%`)
      idx++
    }

    if (category) {
      conditions.push(`m.category = $${idx}`)
      params.push(category)
      idx++
    }

    if (form) {
      conditions.push(`m.form = $${idx}`)
      params.push(form)
      idx++
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
    params.push(safeLimit)

    const result = await db.query(
      `SELECT m.id, m.generic_name, m.brand_name, m.strength, m.form, m.manufacturer, m.category
       FROM medicines m
       WHERE ${conditions.join(' AND ')}
       ORDER BY m.generic_name, m.strength
       LIMIT $${idx}`,
      params
    )

    res.json({
      status: 'success',
      data: result.rows.map((r) => ({
        id: r.id,
        genericName: r.generic_name,
        brandName: r.brand_name,
        strength: r.strength,
        form: r.form,
        manufacturer: r.manufacturer,
        category: r.category,
      })),
    })
  } catch (err) {
    return next(err)
  }
}

const getCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT category FROM medicines WHERE is_active = true AND category IS NOT NULL ORDER BY category`
    )
    res.json({
      status: 'success',
      data: result.rows.map((r) => r.category),
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = { search, getCategories }
