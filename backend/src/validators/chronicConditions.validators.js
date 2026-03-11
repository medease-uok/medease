const { body } = require('express-validator');

const STATUSES = ['active', 'managed', 'resolved', 'monitoring'];
const SEVERITIES = ['mild', 'moderate', 'severe'];

const sharedRules = [
  body('severity')
    .optional()
    .trim()
    .isIn(SEVERITIES).withMessage(`Severity must be one of: ${SEVERITIES.join(', ')}.`),
  body('diagnosedDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Diagnosed date must be a valid date.'),
  body('resolvedDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Resolved date must be a valid date.')
    .custom((value, { req }) => {
      if (value && req.body.diagnosedDate && new Date(value) < new Date(req.body.diagnosedDate)) {
        throw new Error('Resolved date cannot be before diagnosed date.');
      }
      return true;
    }),
  body('treatment')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Treatment must not exceed 1000 characters.'),
  body('medications')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Medications must not exceed 1000 characters.'),
  body('status')
    .optional()
    .trim()
    .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters.'),
];

const createChronicConditionValidation = [
  body('conditionName')
    .trim()
    .notEmpty().withMessage('Condition name is required.')
    .isLength({ max: 255 }).withMessage('Condition name must not exceed 255 characters.'),
  ...sharedRules,
];

const updateChronicConditionValidation = [
  body('conditionName')
    .optional()
    .trim()
    .notEmpty().withMessage('Condition name cannot be empty.')
    .isLength({ max: 255 }).withMessage('Condition name must not exceed 255 characters.'),
  ...sharedRules,
];

module.exports = { createChronicConditionValidation, updateChronicConditionValidation };
