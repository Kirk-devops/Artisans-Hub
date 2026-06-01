const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User object with token
 */
const register = async (userData) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      userType,
      profession,
      dailyRate,
      profilePhoto
    } = userData;

    // Validate input
    if (!email || !password || !userType) {
      throw new Error('Missing required fields');
    }

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

    // Generate user ID
    const userId = `USR_${uuidv4().slice(0, 8).toUpperCase()}`;

    // Insert user
    const result = await db.query(
      `INSERT INTO users (
        user_id, email, password_hash, first_name, last_name, phone,
        user_type, profession, daily_rate, profile_photo,
        verification_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, user_id, email, first_name, last_name, user_type, verification_status`,
      [
        userId,
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        userType,
        profession || null,
        dailyRate || null,
        profilePhoto || null,
        'pending'
      ]
    );

    const user = result.rows[0];

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`User registered successfully: ${user.user_id}`);

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verificationStatus: user.verification_status
      },
      token
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Verify email with verification code
 * @param {string} userId - User ID
 * @param {string} verificationCode - Verification code
 * @returns {Promise<Object>} Verification result
 */
const verifyEmail = async (userId, verificationCode) => {
  try {
    // Verify JWT token
    const decoded = jwt.verify(verificationCode, process.env.JWT_SECRET);

    if (decoded.userId !== userId) {
      throw new Error('Invalid verification code');
    }

    // Update user verification status
    const result = await db.query(
      'UPDATE users SET verification_status = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id, email, verification_status',
      ['verified', userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`Email verified for user: ${userId}`);

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        verificationStatus: result.rows[0].verification_status
      }
    };
  } catch (error) {
    logger.error('Email verification error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object with token
 */
const login = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const result = await db.query(
      'SELECT id, user_id, email, password_hash, first_name, last_name, user_type, verification_status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      logger.warn(`Failed login attempt for user: ${user.user_id}`);
      throw new Error('Invalid email or password');
    }

    // Update last active
    await db.query(
      'UPDATE users SET last_active = NOW() WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    logger.info(`User logged in successfully: ${user.user_id}`);

    return {
      success: true,
      message: 'Login successful',
      data: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verificationStatus: user.verification_status
      },
      token,
      refreshToken
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Refresh JWT token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await db.query(
      'SELECT user_id, email, user_type FROM users WHERE user_id = $1',
      [decoded.userId]
    );

    if (user.rows.length === 0) {
      throw new Error('User not found');
    }

    const userData = user.rows[0];

    const newToken = jwt.sign(
      { userId: userData.user_id, email: userData.email, userType: userData.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      success: true,
      token: newToken
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset request result
 */
const requestPasswordReset = async (email) => {
  try {
    const result = await db.query(
      'SELECT user_id, email FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      // Don't reveal if email exists or not
      return {
        success: true,
        message: 'If email exists, password reset link has been sent'
      };
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.user_id, email: user.email, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset email sent to: ${email}`);

    return {
      success: true,
      message: 'If email exists, password reset link has been sent'
    };
  } catch (error) {
    logger.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password
 * @param {string} resetToken - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 */
const resetPassword = async (resetToken, newPassword) => {
  try {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.type !== 'reset') {
      throw new Error('Invalid token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || 10));

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
      [hashedPassword, decoded.userId]
    );

    logger.info(`Password reset successful for user: ${decoded.userId}`);

    return {
      success: true,
      message: 'Password reset successful'
    };
  } catch (error) {
    logger.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Change password (authenticated)
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Change result
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    const result = await db.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || 10));

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
      [hashedPassword, userId]
    );

    logger.info(`Password changed for user: ${userId}`);

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    logger.error('Change password error:', error);
    throw error;
  }
};

/**
 * Send verification email
 * @param {string} email - User email
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
  try {
    const verificationLink = `${process.env.FRONTEND_WEB_URL}/verify-email?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Artisans Hub</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Thank you for registering with Artisans Hub. To complete your registration, please verify your email address by clicking the button below:</p>
              <a href="${verificationLink}" class="button">Verify Email</a>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't register for this account, please ignore this email.</p>
              <p>Best regards,<br>Artisans Hub Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'Verify Your Email - Artisans Hub', htmlContent);
  } catch (error) {
    logger.error('Error sending verification email:', error);
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetLink = `${process.env.FRONTEND_WEB_URL}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, please ignore this email.</p>
              <p>Best regards,<br>Artisans Hub Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, 'Reset Your Password - Artisans Hub', htmlContent);
  } catch (error) {
    logger.error('Error sending password reset email:', error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  sendPasswordResetEmail
};
