/**
 * Centralized Environment Configuration
 * Validates and provides access to environment variables.
 */
const dotenv = require('dotenv');
const path = require('path');

// Load .env file from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// In production, require explicit database configuration and prevent fallback to dev credentials
if (isProduction) {
  const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
  const hasDiscreteConfig = Boolean(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME
  );

  if (!hasDbUrl && !hasDiscreteConfig) {
    throw new Error(
      'Missing required database configuration: In production mode, DATABASE_URL (or DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME) must be explicitly configured.'
    );
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  database: {
    url: isProduction
      ? (process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : null)
      : (process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowsync'),
    host: isProduction ? (process.env.DB_HOST || null) : (process.env.DB_HOST || 'localhost'),
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: isProduction ? (process.env.DB_USER || null) : (process.env.DB_USER || 'postgres'),
    password: isProduction ? (process.env.DB_PASSWORD || null) : (process.env.DB_PASSWORD || 'postgres'),
    database: isProduction ? (process.env.DB_NAME || null) : (process.env.DB_NAME || 'flowsync'),
  },
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  },
  isProduction,
  isDevelopment,
};

module.exports = config;
