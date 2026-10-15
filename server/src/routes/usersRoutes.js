/**
 * Users Router
 * Profile and user identity management endpoints.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Protect all user profile routes
router.use(authMiddleware);

/**
 * GET /api/users/profile
 * Get current authenticated user's profile.
 */
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      // Fallback
      return res.json({
        success: true,
        data: {
          id: userId,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0],
          email: req.user.email,
          job_title: 'Workspace Member',
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...data,
        email: req.user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/profile
 * Update current authenticated user's profile.
 */
router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, username, avatar_url, job_title, bio } = req.body;

    const updates = {
      id: userId,
      full_name: full_name?.trim(),
      username: username?.trim(),
      avatar_url,
      job_title: job_title?.trim(),
      bio: bio?.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...data,
        email: req.user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
