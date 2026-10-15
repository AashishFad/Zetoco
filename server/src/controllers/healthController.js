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
 * In production, returns sanitized diagnostic information unless requested by an authorized administrator.
 */
const getFullHealth = async (req, res, next) => {
  try {
    const dbStatus = await testDbConnection();

    // Check if request is authenticated as admin using existing auth mechanism
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { supabase, isConfigured } = require('../config/supabase');
        if (isConfigured) {
          const token = authHeader.split(' ')[1];
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: member } = await supabase
              .from('organization_members')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .limit(1);
            if (member && member.length > 0) {
              isAdmin = true;
            }
          }
        }
      } catch (authErr) {
        // Fall back to unauthenticated sanitized view
      }
    }

    // In production, sanitize database diagnostic info unless caller is an authenticated admin
    const databaseInfo = (config.isDevelopment || isAdmin)
      ? dbStatus
      : {
          connected: Boolean(dbStatus.connected),
          status: dbStatus.connected ? 'healthy' : 'unavailable',
        };

    res.status(200).json({
      success: true,
      message: 'FlowSync API is running',
      timestamp: new Date().toISOString(),
      environment: config.env,
      database: databaseInfo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getFullHealth,
};
