const { body, param } = require('express-validator');

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isString().withMessage('Task title must be a string')
    .isLength({ max: 255 }).withMessage('Task title cannot exceed 255 characters'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid due date format'),
];

const updateTaskValidation = [
  param('id')
    .isUUID().withMessage('Invalid task ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Task title cannot be empty')
    .isString()
    .isLength({ max: 255 }).withMessage('Task title cannot exceed 255 characters'),
  body('isCompleted')
    .optional()
    .isBoolean().withMessage('isCompleted must be a boolean value'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 32767 }).withMessage('priority must be a valid smallint'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid due date format'),
];

const taskIdValidation = [
  param('id')
    .isUUID().withMessage('Invalid task ID format'),
];

const reorderValidation = [
  body('orderedIds')
    .isArray({ min: 1, max: 500 }).withMessage('orderedIds must contain between 1 and 500 IDs')
    .notEmpty().withMessage('orderedIds array cannot be empty'),
  body('orderedIds.*')
    .isUUID().withMessage('Each ID in orderedIds must be a valid UUID'),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  reorderValidation,
};
