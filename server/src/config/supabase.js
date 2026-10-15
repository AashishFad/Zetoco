/**
 * Supabase Backend Client Configuration
 * Used for verifying Supabase Auth JWT tokens in incoming requests.
 */
const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

const isConfigured = Boolean(
  config.supabase.url &&
  config.supabase.anonKey &&
  config.supabase.url.startsWith('https://') &&
  !config.supabase.url.includes('your-project-id')
);

const supabase = createClient(
  isConfigured ? config.supabase.url : 'https://placeholder.supabase.co',
  isConfigured ? config.supabase.anonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const getUserClient = (token) => {
  if (!isConfigured) return supabase;
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
};

module.exports = {
  supabase,
  isConfigured,
  getUserClient,
};
