const { body } = require('express-validator');

const createAllergyValidation = [
  body('allergen')
    .trim()
    .notEmpty().withMessage('Allergen name is required.')
    .isLength({ max: 200 }).withMessage('Allergen name must not exceed 200 characters.'),
  body('severity')
    .trim()
    .notEmpty().withMessage('Severity is required.')
    .isIn(['mild', 'moderate', 'severe']).withMessage('Severity must be mild, moderate, or severe.'),
  body('reaction')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 }).withMessage('Reaction must not exceed 500 characters.'),
  body('notedAt')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Noted date must be a valid date.'),
];

const updateAllergyValidation = [
  body('allergen')
    .optional()
    .trim()
    .notEmpty().withMessage('Allergen name cannot be empty.')
    .isLength({ max: 200 }).withMessage('Allergen name must not exceed 200 characters.'),
  body('severity')
    .optional()
    .trim()
    .isIn(['mild', 'moderate', 'severe']).withMessage('Severity must be mild, moderate, or severe.'),
  body('reaction')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 }).withMessage('Reaction must not exceed 500 characters.'),
  body('notedAt')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Noted date must be a valid date.'),
];

module.exports = { createAllergyValidation, updateAllergyValidation };
