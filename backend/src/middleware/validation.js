const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }
  next();
};

/**
 * Register validation
 */
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('phone')
    .isMobilePhone(['en-GH'])
    .withMessage('Invalid Ghanaian phone number'),
  body('userType')
    .isIn(['artisan', 'employer'])
    .withMessage('User type must be artisan or employer'),
  body('profession')
    .if(() => body('userType').equals('artisan'))
    .isIn(['mason', 'plumber', 'carpenter', 'electrician', 'helper'])
    .withMessage('Invalid profession'),
  body('dailyRate')
    .if(() => body('userType').equals('artisan'))
    .isFloat({ min: 0, max: 300 })
    .withMessage('Daily rate must be between 0 and 300 GHC'),
  handleValidationErrors
];

/**
 * Login validation
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Email verification validation
 */
const validateEmailVerification = [
  param('userId')
    .matches(/^USR_[A-Z0-9]{8}$/)
    .withMessage('Invalid user ID'),
  body('verificationCode')
    .notEmpty()
    .withMessage('Verification code is required'),
  handleValidationErrors
];

/**
 * Password reset request validation
 */
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  handleValidationErrors
];

/**
 * Password reset validation
 */
const validatePasswordReset = [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Change password validation
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Update profile validation
 */
const validateUpdateProfile = [
  param('userId')
    .matches(/^USR_[A-Z0-9]{8}$/)
    .withMessage('Invalid user ID'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('phone')
    .optional()
    .isMobilePhone(['en-GH'])
    .withMessage('Invalid Ghanaian phone number'),
  body('dailyRate')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('Daily rate must be between 0 and 300 GHC'),
  handleValidationErrors
];

/**
 * Update daily rate validation
 */
const validateUpdateRate = [
  param('userId')
    .matches(/^USR_[A-Z0-9]{8}$/)
    .withMessage('Invalid user ID'),
  body('dailyRate')
    .isFloat({ min: 0, max: 300 })
    .withMessage('Daily rate must be between 0 and 300 GHC'),
  body('workType')
    .optional()
    .isIn(['standard', 'concrete'])
    .withMessage('Invalid work type'),
  handleValidationErrors
];

/**
 * Post job validation
 */
const validatePostJob = [
  body('workType')
    .isIn(['block_laying', 'concrete', 'plumbing', 'carpentry', 'electrical'])
    .withMessage('Invalid work type'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('duration')
    .isInt({ min: 1, max: 90 })
    .withMessage('Duration must be between 1 and 90 days'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('requiredSkill')
    .isIn(['artisan', 'helper'])
    .withMessage('Required skill must be artisan or helper'),
  handleValidationErrors
];

/**
 * Accept job validation
 */
const validateAcceptJob = [
  param('jobId')
    .matches(/^JOB_[A-Z0-9]{8}$/)
    .withMessage('Invalid job ID'),
  handleValidationErrors
];

/**
 * Update job status validation
 */
const validateUpdateJobStatus = [
  param('jobId')
    .matches(/^JOB_[A-Z0-9]{8}$/)
    .withMessage('Invalid job ID'),
  body('status')
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Invalid status'),
  body('day')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Day must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  handleValidationErrors
];

/**
 * Process payment validation
 */
const validateProcessPayment = [
  body('jobId')
    .matches(/^JOB_[A-Z0-9]{8}$/)
    .withMessage('Invalid job ID'),
  body('paymentMethod')
    .isIn(['momo', 'bank_transfer', 'card'])
    .withMessage('Invalid payment method'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('momoNumber')
    .optional()
    .isMobilePhone(['en-GH'])
    .withMessage('Invalid Ghanaian phone number'),
  handleValidationErrors
];

/**
 * Submit rating validation
 */
const validateSubmitRating = [
  body('jobId')
    .matches(/^JOB_[A-Z0-9]{8}$/)
    .withMessage('Invalid job ID'),
  body('ratedUserId')
    .matches(/^USR_[A-Z0-9]{8}$/)
    .withMessage('Invalid rated user ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateUpdateProfile,
  validateUpdateRate,
  validatePostJob,
  validateAcceptJob,
  validateUpdateJobStatus,
  validateProcessPayment,
  validateSubmitRating
};
