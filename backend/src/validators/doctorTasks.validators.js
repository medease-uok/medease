const { body, param } = require('express-validator')

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
    .isUUID().withMessage('Invalid task ID format.'),
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
    .isInt({ min: 0, max: 9999 }).withMessage('priority must be an integer between 0 and 9999.'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('dueDate must be a valid date (YYYY-MM-DD).'),
]

const taskIdValidation = [
  param('id')
    .isUUID().withMessage('Invalid task ID format.'),
]

const reorderValidation = [
  body('orderedIds')
    .isArray({ min: 1, max: 500 }).withMessage('orderedIds must be an array with 1-500 items.'),
  body('orderedIds.*')
    .isUUID().withMessage('Each ID must be a valid UUID.'),
]

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  reorderValidation,
}
