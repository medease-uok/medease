const { body, param } = require('express-validator')

const STATUSES = ['active', 'completed', 'on_hold', 'cancelled']
const PRIORITIES = ['low', 'medium', 'high']

const sharedRules = [
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters.'),
  body('status')
    .optional()
    .trim()
    .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),
  body('priority')
    .optional()
    .trim()
    .isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}.`),
  body('startDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Start date must be a valid date.'),
  body('endDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('End date must be a valid date.')
    .custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date.')
      }
      return true
    }),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters.'),
]

const createTreatmentPlanValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 255 }).withMessage('Title must not exceed 255 characters.'),
  ...sharedRules,
  body('items')
    .optional()
    .isArray({ max: 20 }).withMessage('Items must be an array with at most 20 entries.'),
  body('items.*.title')
    .trim()
    .notEmpty().withMessage('Each item must have a title.')
    .isLength({ max: 255 }).withMessage('Item title must not exceed 255 characters.'),
  body('items.*.description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Item description must not exceed 1000 characters.'),
  body('items.*.dueDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Item due date must be a valid date.'),
]

const updateTreatmentPlanValidation = [
  param('id')
    .isUUID().withMessage('Invalid treatment plan ID format.'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty.')
    .isLength({ max: 255 }).withMessage('Title must not exceed 255 characters.'),
  ...sharedRules,
]

const createItemValidation = [
  param('id')
    .isUUID().withMessage('Invalid treatment plan ID format.'),
  body('title')
    .trim()
    .notEmpty().withMessage('Item title is required.')
    .isLength({ max: 255 }).withMessage('Item title must not exceed 255 characters.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Item description must not exceed 1000 characters.'),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Due date must be a valid date.'),
]

const updateItemValidation = [
  param('id')
    .isUUID().withMessage('Invalid treatment plan ID format.'),
  param('itemId')
    .isUUID().withMessage('Invalid item ID format.'),
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Item title cannot be empty.')
    .isLength({ max: 255 }).withMessage('Item title must not exceed 255 characters.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Item description must not exceed 1000 characters.'),
  body('isCompleted')
    .optional()
    .isBoolean().withMessage('isCompleted must be a boolean.'),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Due date must be a valid date.'),
]

module.exports = {
  createTreatmentPlanValidation,
  updateTreatmentPlanValidation,
  createItemValidation,
  updateItemValidation,
}
