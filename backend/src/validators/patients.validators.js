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
  body('organDonor')
    .optional()
    .isBoolean().withMessage('Organ donor must be true or false.'),
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
  body('insuranceProvider')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Insurance provider must not exceed 100 characters.'),
  body('insurancePolicyNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Policy number must not exceed 50 characters.')
    .matches(/^[A-Z0-9\-]+$/i).withMessage('Policy number may only contain letters, digits, and hyphens.'),
  body('insurancePlanType')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['Inpatient', 'Outpatient', 'Comprehensive']).withMessage('Plan type must be Inpatient, Outpatient, or Comprehensive.'),
  body('insuranceExpiryDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Insurance expiry date must be a valid date.'),
  body('insurancePolicyNumber').custom((value, { req }) => {
    const provider = req.body.insuranceProvider;
    if (value && !provider) {
      throw new Error('Insurance provider is required when policy number is provided.');
    }
    if (provider && !value) {
      throw new Error('Policy number is required when insurance provider is provided.');
    }
    return true;
  }),
];

module.exports = { updatePatientValidation };
