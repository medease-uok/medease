const { body } = require('express-validator');

const updatePatientValidation = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty().withMessage('First name cannot be empty.')
    .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters.'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty().withMessage('Last name cannot be empty.')
    .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters.'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^(\+94)?[7-9]\d{8}$/).withMessage('Phone number should be 9 digits starting with 7, 8, or 9 (optionally prefixed with +94).'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date.')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future.');
      }
      return true;
    }),
  body('gender')
    .optional()
    .trim()
    .notEmpty().withMessage('Gender cannot be empty.'),
  body('bloodType')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type.'),
  body('address')
    .optional({ values: 'falsy' })
    .trim(),
  body('emergencyContact')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Emergency contact name must not exceed 100 characters.'),
  body('emergencyRelationship')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Emergency relationship must not exceed 50 characters.'),
  body('emergencyPhone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^(\+94)?[7-9]\d{8}$/).withMessage('Emergency phone should be 9 digits starting with 7, 8, or 9 (optionally prefixed with +94).'),
];

module.exports = { updatePatientValidation };
