/**
 * Centralized Error Handling Middleware
 */
const config = require('../config/env');

/**
 * Sanitizes sensitive patterns (such as connection strings with credentials) from server logs
 */
const sanitizeLog = (val) => {
  if (!val) return val;
  const str = typeof val === 'string' ? val : (val.stack || val.message || String(val));
  return str.replace(/postgresql:\/\/[^:]+:[^@]+@/gi, 'postgresql://***:***@');
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // In production, mask internal server errors with a generic message to prevent data leakage
  const message = (statusCode >= 500 && config.isProduction)
    ? 'Internal Server Error'
    : (err.message || (statusCode >= 500 ? 'Internal Server Error' : 'Request failed'));

  const response = {
    success: false,
    message,
  };

  // Include detailed error information only in development mode
  if (config.isDevelopment) {
    response.error = {
      name: err.name,
      stack: err.stack,
      ...(err.details && { details: err.details }),
    };
  }

  // Log server errors with credentials sanitized
  if (statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, sanitizeLog(err.message || err));
    if (config.isDevelopment && err.stack) {
      console.error(sanitizeLog(err.stack));
    }
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
