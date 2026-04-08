const db = require('../config/database');
const AppError = require('../utils/AppError');

const resolveNurse = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id FROM nurses WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) return next(new AppError('Not a nurse account.', 403));
    req.nurseId = result.rows[0].id;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveNurse;
