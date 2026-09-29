/**
 * Health Check Controller
 * Verifies system and database status.
 */
const config = require('../config/env');
const { testDbConnection } = require('../config/db');

/**
 * Get API health status
 */
const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FlowSync API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
};

/**
 * Get full system and database health status
 */
const getFullHealth = async (req, res, next) => {
  try {
    const dbStatus = await testDbConnection();
    res.status(200).json({
      success: true,
      message: 'FlowSync API is running',
      timestamp: new Date().toISOString(),
      environment: config.env,
      database: dbStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getFullHealth,
};
