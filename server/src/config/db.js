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
 * Verifies database connection (checks Supabase PostgreSQL first, then local pool fallback)
 * @returns {Promise<{ connected: boolean, message: string, timestamp?: string, provider?: string, error?: string }>}
 */
const testDbConnection = async () => {
  try {
    const { supabase, isConfigured } = require('./supabase');
    if (isConfigured) {
      const { data, error } = await supabase.from('organizations').select('id').limit(1);
      if (!error) {
        return {
          connected: true,
          provider: 'Supabase PostgreSQL',
          message: 'Supabase PostgreSQL connected successfully',
          timestamp: new Date().toISOString(),
        };
      }
    }

    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    return {
      connected: true,
      provider: 'Local PostgreSQL',
      message: 'PostgreSQL database connection successful',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version,
    };
  } catch (error) {
    const errorDetails = error.message || error.code || 'Could not connect to PostgreSQL server';
    const safeErrorLog = typeof errorDetails === 'string'
      ? errorDetails.replace(/postgresql:\/\/[^:]+:[^@]+@/gi, 'postgresql://***:***@')
      : 'Connection failure';
    console.error('PostgreSQL testDbConnection error:', safeErrorLog);

    return {
      connected: false,
      message: 'PostgreSQL connection error: Could not connect to database server',
      ...(config.isDevelopment && { error: errorDetails }),
    };
  }
};

module.exports = {
  pool,
  query,
  testDbConnection,
};
