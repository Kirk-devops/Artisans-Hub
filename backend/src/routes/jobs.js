const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// @route   GET /api/jobs
// @desc    Get available jobs
// @access  Private
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Get jobs - to be implemented'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// @route   POST /api/jobs
// @desc    Post a new job
// @access  Private
router.post('/', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Create job - to be implemented'
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
