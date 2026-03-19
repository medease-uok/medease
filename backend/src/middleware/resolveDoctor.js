const db = require('../config/database')
const AppError = require('../utils/AppError')

const resolveDoctor = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id])
    if (result.rows.length === 0) return next(new AppError('Not a doctor account.', 403))
    req.doctorId = result.rows[0].id
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = resolveDoctor
