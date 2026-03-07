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
    .matches(/^[7-9]\d{8,9}$/).withMessage('Phone number should be 9-10 digits starting with 7, 8, or 9.'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}.`),

  // Password
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .isStrongPassword({
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }).withMessage('Password must include uppercase, lowercase, number, and special character.'),
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
    .matches(/^[7-9]\d{8,9}$/).withMessage('Emergency phone should be 9-10 digits starting with 7, 8, or 9.'),

  // Insurance
  body('insuranceProvider')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Insurance provider must not exceed 100 characters.'),
  body('insurancePolicyNumber')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('Policy number must not exceed 50 characters.'),
  body('insurancePlanType')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['Inpatient', 'Outpatient', 'Comprehensive']).withMessage('Plan type must be Inpatient, Outpatient, or Comprehensive.'),
  body('insuranceExpiryDate')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Insurance expiry date must be a valid date.'),

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

const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Verification code is required.')
    .matches(/^\d{6}$/).withMessage('Verification code must be a 6-digit number.'),
  body('pendingLoginToken')
    .trim()
    .notEmpty().withMessage('Session token is required.'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
];

const verifyResetOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Reset code is required.')
    .matches(/^\d{6}$/).withMessage('Reset code must be a 6-digit number.'),
];

const resetPasswordValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required.'),
  body('resetToken')
    .notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .isStrongPassword({
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }).withMessage('Password must include uppercase, lowercase, number, and special character.'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

module.exports = {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  forgotPasswordValidation,
  verifyResetOtpValidation,
  resetPasswordValidation,
};
