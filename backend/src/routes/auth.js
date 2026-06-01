const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/auth/verify-email/:userId
 * @desc    Verify email with verification code
 * @access  Public
 */
router.post('/verify-email/:userId', validateEmailVerification, authController.verifyEmail);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshAccessToken);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/request-password-reset', validatePasswordResetRequest, authController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with reset token
 * @access  Public
 */
router.post('/reset-password', validatePasswordReset, authController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authMiddleware, validateChangePassword, authController.changePassword);

module.exports = router;
