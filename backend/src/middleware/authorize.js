const AppError = require('../utils/AppError');
const { hasAnyPermission } = require('../utils/permissions');

/**
 * Role-based authorization (backward-compatible).
 * Usage: authorize('admin', 'doctor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Permission-based authorization.
 * Usage: requirePermission('create_prescription', 'view_patients')
 * Grants access if the user has ANY of the listed permissions.
 */
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    try {
      const allowed = await hasAnyPermission(req.user.id, permissions);
      if (!allowed) {
        return next(new AppError('You do not have permission to perform this action.', 403));
      }
      next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = authorize;
module.exports.requirePermission = requirePermission;
