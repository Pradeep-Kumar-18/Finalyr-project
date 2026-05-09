/**
 * Request Timeout Middleware
 * ===========================
 * Prevents requests from hanging indefinitely.
 * Returns a proper 504 Gateway Timeout response.
 */

const logger = require('../utils/logger');

/**
 * Creates a timeout middleware for Express routes.
 * @param {number} ms - Timeout duration in milliseconds (default: 120000 = 2 min)
 */
const timeoutMiddleware = (ms = 120000) => {
  return (req, res, next) => {
    // Set a timer
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Timeout', `Request timed out after ${ms}ms: ${req.method} ${req.originalUrl}`);
        res.status(504).json({
          success: false,
          error: 'Request timed out. The AI analysis is taking longer than expected. Please try again.'
        });
      }
    }, ms);

    // Clear timer when response finishes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

module.exports = timeoutMiddleware;
