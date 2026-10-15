/**
 * Supabase Authentication Verification Middleware
 * Verifies the JWT Bearer token issued by Supabase Auth and attaches the verified user context.
 */
const { supabase, isConfigured } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or invalid Bearer authentication token',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Bearer token is empty',
      });
    }

    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service configuration is missing on server',
      });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired authentication token',
      });
    }

    // Attach verified user identity and bearer token from Supabase
    req.token = token;
    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
    };

    next();
  } catch (err) {
    console.error('Authentication verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication verification failed',
    });
  }
};

module.exports = authMiddleware;
