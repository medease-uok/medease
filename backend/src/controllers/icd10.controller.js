const db = require('../config/database')
const AppError = require('../utils/AppError')

const search = async (req, res, next) => {
  try {
    const { q = '', category, limit = 20 } = req.query
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50)

    if (limit !== undefined && (isNaN(Number(limit)) || Number(limit) < 1)) {
      throw new AppError('limit must be a positive integer.', 400)
    }

    const params = []
    const conditions = []
    let prefixParamIdx = null

    if (q.trim()) {
      params.push(`${q.trim()}%`)
      prefixParamIdx = params.length

      params.push(`%${q.trim()}%`)
      const searchIdx = params.length
      conditions.push(`(code ILIKE $${searchIdx} OR description ILIKE $${searchIdx})`)
    }

    if (category && category.trim()) {
      params.push(category.trim())
      conditions.push(`category = $${params.length}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(safeLimit)

    const codeOrderClause = prefixParamIdx
      ? `CASE WHEN code ILIKE $${prefixParamIdx} THEN 0 ELSE 1 END,`
      : ''

    const result = await db.query(
      `SELECT code, description, category
       FROM icd10_codes
       ${where}
       ORDER BY ${codeOrderClause} code
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
    res
      .set('Cache-Control', 'public, max-age=3600')
      .json({ status: 'success', data: result.rows.map(r => r.category) })
  } catch (err) {
    return next(err)
  }
}

module.exports = { search, getCategories }
