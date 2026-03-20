const db = require('../config/database')

const search = async (req, res, next) => {
  try {
    const { q = '', category, limit = 20 } = req.query
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50)

    const params = []
    const conditions = []

    if (q.trim()) {
      params.push(`%${q.trim()}%`)
      const idx = params.length
      // Match code prefix or description substring (case-insensitive)
      conditions.push(`(code ILIKE $${idx} OR description ILIKE $${idx})`)
    }

    if (category && category.trim()) {
      params.push(category.trim())
      conditions.push(`category = $${params.length}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(safeLimit)

    const result = await db.query(
      `SELECT code, description, category
       FROM icd10_codes
       ${where}
       ORDER BY
         CASE WHEN code ILIKE $${conditions.length > 0 ? 1 : params.length} THEN 0 ELSE 1 END,
         code
       LIMIT $${params.length}`,
      params
    )

    res.json({ status: 'success', data: result.rows })
  } catch (err) {
    return next(err)
  }
}

const getCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT category FROM icd10_codes ORDER BY category`
    )
    res.json({ status: 'success', data: result.rows.map(r => r.category) })
  } catch (err) {
    return next(err)
  }
}

module.exports = { search, getCategories }
