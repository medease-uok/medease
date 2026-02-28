const { body } = require('express-validator');

const VALID_ROLES = ['patient', 'doctor', 'nurse', 'lab_technician', 'pharmacist'];

const registerValidation = [
  // Account info
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d{9,10}$/).withMessage('Phone number should be 9-10 digits (without country code).'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}.`),

  // Password
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),

  // Patient-specific
  body('dateOfBirth')
    .if(body('role').equals('patient'))
    .notEmpty().withMessage('Date of birth is required for patients.')
    .isISO8601().withMessage('Date of birth must be a valid date.')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future.');
      }
      return true;
    }),
  body('gender')
    .if(body('role').equals('patient'))
    .trim()
    .notEmpty().withMessage('Gender is required for patients.'),
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
    .matches(/^\d{9,10}$/).withMessage('Emergency phone should be 9-10 digits.'),

  // Doctor-specific
  body('specialization')
    .if(body('role').equals('doctor'))
    .trim()
    .notEmpty().withMessage('Specialization is required for doctors.'),
  body('licenseNumber')
    .if(body('role').isIn(['doctor', 'nurse', 'pharmacist']))
    .trim()
    .notEmpty().withMessage('License number is required.')
    .isLength({ max: 50 }).withMessage('License number must not exceed 50 characters.'),
  body('department')
    .if(body('role').isIn(['doctor', 'nurse', 'lab_technician']))
    .trim()
    .notEmpty().withMessage('Department is required.'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

module.exports = { registerValidation, loginValidation };
