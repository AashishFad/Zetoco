/**
 * Centralized Error Handling Middleware
 */
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
  };

  // Include detailed error information in development mode
  if (config.isDevelopment) {
    response.error = {
      name: err.name,
      stack: err.stack,
      ...(err.details && { details: err.details }),
    };
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
