const { body, param } = require('express-validator')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 255 }).withMessage('Title must not exceed 255 characters.'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('dueDate must be a valid date (YYYY-MM-DD).'),
]

const updateTaskValidation = [
  param('id')
    .matches(UUID_REGEX).withMessage('Invalid task ID format.'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty.')
    .isLength({ max: 255 }).withMessage('Title must not exceed 255 characters.'),
  body('isCompleted')
    .optional()
    .isBoolean().withMessage('isCompleted must be true or false.'),
  body('priority')
    .optional()
    .isInt({ min: 0 }).withMessage('priority must be a non-negative integer.'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('dueDate must be a valid date (YYYY-MM-DD).'),
]

const taskIdValidation = [
  param('id')
    .matches(UUID_REGEX).withMessage('Invalid task ID format.'),
]

const reorderValidation = [
  body('orderedIds')
    .isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array.'),
  body('orderedIds.*')
    .matches(UUID_REGEX).withMessage('Each ID must be a valid UUID.'),
]

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  reorderValidation,
}
