/**
 * PostgreSQL Database Connection Foundation
 * Centralized pool configuration and connection health check.
 */
const { Pool } = require('pg');
const config = require('./env');

// Create PostgreSQL connection pool
const poolConfig = config.database.url
  ? {
      connectionString: config.database.url,
      connectionTimeoutMillis: 3000,
    }
  : {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      connectionTimeoutMillis: 3000,
    };

const pool = new Pool(poolConfig);

// Event listener for idle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message || err);
});

/**
 * Execute query wrapper
 * @param {string} text - SQL query
 * @param {Array} [params] - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Verifies the PostgreSQL database connection
 * @returns {Promise<{ connected: boolean, message: string, timestamp?: string, error?: string }>}
 */
const testDbConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    return {
      connected: true,
      message: 'PostgreSQL database connection successful',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version,
    };
  } catch (error) {
    const errorDetails = error.message || error.code || 'Could not connect to PostgreSQL server';
    return {
      connected: false,
      message: `PostgreSQL connection error: ${errorDetails}`,
      error: errorDetails,
    };
  }
};

module.exports = {
  pool,
  query,
  testDbConnection,
};
