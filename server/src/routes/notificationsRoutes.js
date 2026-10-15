/**
 * Notifications Router
 * Handles retrieval, read-state toggling, and unread counts for authenticated users.
 * Uses authenticated caller client and manual profile hydration to avoid
 * PostgREST foreign key relationship errors across auth.users and public.profiles.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase, getUserClient } = require('../config/supabase');

const router = express.Router();

// Protect all notification routes with Supabase JWT authentication
router.use(authMiddleware);

/**
 * GET /api/notifications/unread-count
 * Returns the unread notification count for the authenticated user
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;

    const { count, error } = await dbClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      unreadCount: count || 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications
 * Retrieve notifications for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const { unread, limit = 50, offset = 0 } = req.query;

    console.log(`[NOTIFICATION_GET] Authenticated user: ${userId} | unread filter: ${unread || 'none'} | limit: ${limit} | offset: ${offset}`);

    let query = dbClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (unread === 'true' || unread === true) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.warn(`[NOTIFICATION_GET] DB error for user ${userId}: code=${error.code} message="${error.message}"`);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Hydrate actor profiles independently to avoid PostgREST relationship errors
    const actorIds = [...new Set((notifications || []).map((n) => n.actor_id).filter(Boolean))];
    const profileMap = new Map();

    if (actorIds.length > 0) {
      try {
        const { data: profiles } = await dbClient
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', actorIds);

        if (profiles) {
          profiles.forEach((p) => {
            profileMap.set(p.id, p);
          });
        }
      } catch (profErr) {
        console.warn('notificationsRoutes actor profiles hydration notice:', profErr.message);
      }
    }

    // Get unread count
    const { count: unreadCount } = await dbClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    const formatted = (notifications || []).map((n) => {
      const actor = profileMap.get(n.actor_id);
      return {
        id: n.id,
        userId: n.user_id,
        organizationId: n.organization_id,
        type: n.metadata?.realType || n.type,
        title: n.title,
        message: n.message,
        entityType: n.entity_type,
        entityId: n.entity_id,
        actorId: n.actor_id,
        actorName: actor?.full_name || 'Team Member',
        actorUsername: actor?.username || null,
        actorAvatarUrl: actor?.avatar_url || null,
        isRead: n.is_read,
        metadata: n.metadata || {},
        createdAt: n.created_at,
      };
    });

    console.log(`[NOTIFICATION_GET] HTTP 200 | User: ${userId} | Count returned: ${formatted.length} | Unread: ${unreadCount || 0}`);

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
      unreadCount: unreadCount || 0,
    });
  } catch (err) {
    console.error(`[NOTIFICATION_GET] Exception for user ${req.user?.id}:`, err.message);
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the authenticated user as read
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;

    const { error } = await dbClient
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const { id } = req.params;

    const { data: updated, error } = await dbClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error || !updated) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        id: updated.id,
        isRead: updated.is_read,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const { id } = req.params;

    const { error } = await dbClient
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
