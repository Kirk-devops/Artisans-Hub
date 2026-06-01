const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Get dashboard stats - to be implemented'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Get users - to be implemented'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
