/**
 * Centralized Error Handler Middleware
 * ======================================
 * Catches all unhandled errors from Express routes.
 * Provides consistent JSON error responses.
 * Includes async wrapper for route handlers.
 */

const logger = require('../utils/logger');

/**
 * Express error-handling middleware (4-argument signature).
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log full stack for developer debugging
  logger.error('ErrorHandler', `${req.method} ${req.originalUrl} — ${err.message}`, err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = { message: 'File too large. Maximum size is 5MB per image.', statusCode: 400 };
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = { message: 'Unexpected file field. Please upload eye, nail, and palm images only.', statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token. Please log in again.', statusCode: 401 };
  }
  if (err.name === 'TokenExpiredError') {
    error = { message: 'Session expired. Please log in again.', statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
};

/**
 * Async route wrapper — catches promise rejections and forwards to errorHandler.
 * Usage: router.get('/', asyncHandler(myController));
 * 
 * @param {Function} fn - Async route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
