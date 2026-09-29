/**
 * Authentication Routes
 * Provides token verification for Supabase Auth integration.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public route info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FlowSync Auth API powered by Supabase Auth',
    endpoints: {
      verify: 'GET /api/auth/verify (Requires Authorization: Bearer <supabase_jwt>)',
    },
  });
});

// Protected route verifying incoming Supabase JWT token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Supabase authentication token verified successfully',
    user: req.user,
  });
});

module.exports = router;
