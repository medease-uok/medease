const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token.', 401));
  }
};

module.exports = authenticate;
