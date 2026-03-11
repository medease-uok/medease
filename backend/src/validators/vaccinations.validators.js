const { body } = require('express-validator')

const STATUSES = ['scheduled', 'completed', 'missed', 'cancelled']

const createVaccinationValidation = [
  body('vaccineName')
    .trim()
    .notEmpty().withMessage('Vaccine name is required.')
    .isLength({ max: 255 }).withMessage('Vaccine name must not exceed 255 characters.'),
  body('doseNumber')
    .notEmpty().withMessage('Dose number is required.')
    .isInt({ min: 1, max: 20 }).withMessage('Dose number must be between 1 and 20.'),
  body('lotNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Lot number must not exceed 100 characters.'),
  body('manufacturer')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('Manufacturer must not exceed 200 characters.'),
  body('site')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Injection site must not exceed 100 characters.'),
  body('scheduledDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Scheduled date must be a valid date.'),
  body('administeredDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Administered date must be a valid date.'),
  body('nextDoseDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Next dose date must be a valid date.'),
  body('status')
    .optional()
    .trim()
    .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters.'),
]

const updateVaccinationValidation = [
  body('vaccineName')
    .optional()
    .trim()
    .notEmpty().withMessage('Vaccine name cannot be empty.')
    .isLength({ max: 255 }).withMessage('Vaccine name must not exceed 255 characters.'),
  body('doseNumber')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Dose number must be between 1 and 20.'),
  body('lotNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Lot number must not exceed 100 characters.'),
  body('manufacturer')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 }).withMessage('Manufacturer must not exceed 200 characters.'),
  body('site')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Injection site must not exceed 100 characters.'),
  body('scheduledDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Scheduled date must be a valid date.'),
  body('administeredDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Administered date must be a valid date.'),
  body('nextDoseDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Next dose date must be a valid date.'),
  body('status')
    .optional()
    .trim()
    .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters.'),
]

module.exports = { createVaccinationValidation, updateVaccinationValidation }
