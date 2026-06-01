const db = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
const getUserProfile = async (userId) => {
  try {
    const result = await db.query(
      `SELECT 
        id, user_id, email, first_name, last_name, phone,
        user_type, profession, daily_rate, momo_number,
        profile_photo, verification_status, total_jobs,
        average_rating, total_earnings, created_at, updated_at
      FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user profile
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dailyRate,
      momoNumber,
      profilePhoto
    } = updateData;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(firstName);
      paramCount++;
    }

    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(lastName);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (dailyRate !== undefined) {
      updates.push(`daily_rate = $${paramCount}`);
      values.push(dailyRate);
      paramCount++;
    }

    if (momoNumber !== undefined) {
      updates.push(`momo_number = $${paramCount}`);
      values.push(momoNumber);
      paramCount++;
    }

    if (profilePhoto !== undefined) {
      updates.push(`profile_photo = $${paramCount}`);
      values.push(profilePhoto);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No data to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING id, user_id, email, first_name, last_name, phone,
                user_type, profession, daily_rate, momo_number,
                profile_photo, verification_status, total_jobs,
                average_rating, total_earnings, created_at, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`User profile updated: ${userId}`);

    return result.rows[0];
  } catch (error) {
    logger.error('Update user profile error:', error);
    throw error;
  }
};

/**
 * Update daily rate
 * @param {string} userId - User ID
 * @param {number} dailyRate - New daily rate
 * @param {string} workType - Work type (optional)
 * @returns {Promise<Object>} Update result
 */
const updateDailyRate = async (userId, dailyRate, workType = 'standard') => {
  try {
    // Validate rate based on work type
    const maxRate = workType === 'concrete' ? 300 : 300;
    if (dailyRate < 0 || dailyRate > maxRate) {
      throw new Error(`Daily rate must be between 0 and ${maxRate} GHC`);
    }

    const result = await db.query(
      `UPDATE users 
       SET daily_rate = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, daily_rate, updated_at`,
      [dailyRate, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`Daily rate updated for user ${userId}: ${dailyRate} GHC`);

    return {
      userId: result.rows[0].user_id,
      dailyRate: result.rows[0].daily_rate,
      effectiveFrom: result.rows[0].updated_at
    };
  } catch (error) {
    logger.error('Update daily rate error:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async (userId) => {
  try {
    const result = await db.query(
      `SELECT 
        total_jobs,
        average_rating,
        total_earnings,
        verification_status
      FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Get recent ratings
    const ratingsResult = await db.query(
      `SELECT rating, comment, created_at
       FROM ratings 
       WHERE rated_user IN (SELECT id FROM users WHERE user_id = $1)
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    // Get completed jobs count
    const jobsResult = await db.query(
      `SELECT COUNT(*) as completed_jobs
       FROM jobs 
       WHERE artisan_id IN (SELECT id FROM users WHERE user_id = $1)
       AND status = 'completed'`,
      [userId]
    );

    // Get total earnings
    const earningsResult = await db.query(
      `SELECT SUM(artisan_payment) as total_earnings
       FROM payments 
       WHERE paid_to IN (SELECT id FROM users WHERE user_id = $1)
       AND status = 'completed'`,
      [userId]
    );

    return {
      userId,
      totalJobs: user.total_jobs,
      completedJobs: parseInt(jobsResult.rows[0].completed_jobs),
      averageRating: user.average_rating,
      totalEarnings: parseFloat(earningsResult.rows[0].total_earnings || 0),
      verificationStatus: user.verification_status,
      recentRatings: ratingsResult.rows
    };
  } catch (error) {
    logger.error('Get user stats error:', error);
    throw error;
  }
};

/**
 * Search users (for admin)
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Users matching filters
 */
const searchUsers = async (filters) => {
  try {
    const {
      userType,
      profession,
      verified,
      minRating,
      searchTerm,
      limit = 20,
      offset = 0
    } = filters;

    let query = 'SELECT id, user_id, email, first_name, last_name, user_type, profession, daily_rate, average_rating, verification_status, created_at FROM users WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (userType) {
      query += ` AND user_type = $${paramCount}`;
      values.push(userType);
      paramCount++;
    }

    if (profession) {
      query += ` AND profession = $${paramCount}`;
      values.push(profession);
      paramCount++;
    }

    if (verified === true) {
      query += ` AND verification_status = 'verified'`;
    } else if (verified === false) {
      query += ` AND verification_status != 'verified'`;
    }

    if (minRating) {
      query += ` AND average_rating >= $${paramCount}`;
      values.push(minRating);
      paramCount++;
    }

    if (searchTerm) {
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      values.push(`%${searchTerm}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    return result.rows;
  } catch (error) {
    logger.error('Search users error:', error);
    throw error;
  }
};

/**
 * Update user verification status (admin)
 * @param {string} userId - User ID
 * @param {string} status - Verification status
 * @param {string} reason - Reason for decision
 * @returns {Promise<Object>} Update result
 */
const updateVerificationStatus = async (userId, status, reason = '') => {
  try {
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      throw new Error('Invalid verification status');
    }

    const result = await db.query(
      `UPDATE users 
       SET verification_status = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, verification_status, email`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`User verification status updated: ${userId} -> ${status}`);

    return {
      userId: result.rows[0].user_id,
      verificationStatus: result.rows[0].verification_status,
      email: result.rows[0].email,
      reason
    };
  } catch (error) {
    logger.error('Update verification status error:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteUserAccount = async (userId) => {
  try {
    // Check for active jobs
    const activeJobs = await db.query(
      `SELECT COUNT(*) as count FROM jobs 
       WHERE (artisan_id IN (SELECT id FROM users WHERE user_id = $1)
              OR employer_id IN (SELECT id FROM users WHERE user_id = $1))
       AND status IN ('open', 'accepted', 'in_progress')`,
      [userId]
    );

    if (parseInt(activeJobs.rows[0].count) > 0) {
      throw new Error('Cannot delete account with active jobs');
    }

    // Soft delete - mark as inactive
    const result = await db.query(
      `UPDATE users 
       SET verification_status = 'deleted', updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, email`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`User account deleted: ${userId}`);

    return {
      success: true,
      message: 'Account deleted successfully',
      userId: result.rows[0].user_id
    };
  } catch (error) {
    logger.error('Delete user account error:', error);
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateDailyRate,
  getUserStats,
  searchUsers,
  updateVerificationStatus,
  deleteUserAccount
};
