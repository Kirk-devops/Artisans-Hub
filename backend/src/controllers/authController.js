const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
      token: result.token
    });
  } catch (error) {
    logger.error('Registration error:', error);

    if (error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Registration failed'
      }
    });
  }
};

/**
 * Verify email
 * POST /api/auth/verify-email/:userId
 */
const verifyEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { verificationCode } = req.body;

    const result = await authService.verifyEmail(userId, verificationCode);

    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error('Email verification error:', error);

    if (error.message.includes('Invalid verification code') || error.message.includes('User not found')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VERIFICATION',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Email verification failed'
      }
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: result.message,
      data: result.data,
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    logger.error('Login error:', error);

    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Login failed'
      }
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      token: result.token
    });
  } catch (error) {
    logger.error('Token refresh error:', error);

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token'
      }
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/request-password-reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    res.json(result);
  } catch (error) {
    logger.error('Password reset request error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to process password reset request'
      }
    });
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const result = await authService.resetPassword(resetToken, newPassword);

    res.json(result);
  } catch (error) {
    logger.error('Password reset error:', error);

    if (error.message.includes('Invalid token') || error.message.includes('at least 8 characters')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Password reset failed'
      }
    });
  }
};

/**
 * Change password (authenticated)
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    res.json(result);
  } catch (error) {
    logger.error('Change password error:', error);

    if (error.message === 'Current password is incorrect') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message
        }
      });
    }

    if (error.message.includes('at least 8 characters')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to change password'
      }
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  changePassword
};
