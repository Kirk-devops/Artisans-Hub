const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token and extract user info
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header'
        }
      });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized'
      }
    });
  }
};

/**
 * Check if user is admin
 */
const adminMiddleware = (req, res, next) => {
  try {
    if (req.user.userType !== 'admin') {
      logger.warn(`Unauthorized admin access attempt by user: ${req.user.userId}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }
};

/**
 * Check if user is artisan
 */
const artisanMiddleware = (req, res, next) => {
  try {
    if (req.user.userType !== 'artisan') {
      logger.warn(`Unauthorized artisan access attempt by user: ${req.user.userId}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Artisan access required'
        }
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }
};

/**
 * Check if user is employer
 */
const employerMiddleware = (req, res, next) => {
  try {
    if (req.user.userType !== 'employer') {
      logger.warn(`Unauthorized employer access attempt by user: ${req.user.userId}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Employer access required'
        }
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }
};

/**
 * Check if user is verified
 */
const verificationMiddleware = (req, res, next) => {
  try {
    if (req.user.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_VERIFIED',
          message: 'Email verification required'
        }
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied'
      }
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  artisanMiddleware,
  employerMiddleware,
  verificationMiddleware
};
