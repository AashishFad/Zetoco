/**
 * Notification Service
 * Client-side data fetching and mutation handling for in-app notifications.
 * Communicates with Express backend via authenticated apiClient with Supabase fallback.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from './api';

/**
 * Helper: Hydrate actor profiles for notifications from Supabase
 */
async function hydrateNotificationActors(notificationsList) {
  if (!notificationsList || notificationsList.length === 0) return [];
  const actorIds = new Set();
  notificationsList.forEach((n) => {
    if (n.actor_id) actorIds.add(n.actor_id);
  });

  let profileMap = new Map();
  if (actorIds.size > 0 && isSupabaseConfigured()) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(actorIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate notification profiles in client:', e.message);
    }
  }

  return notificationsList.map((n) => {
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
      actorUsername: actor?.username,
      actorAvatarUrl: actor?.avatar_url,
      isRead: n.is_read,
      metadata: n.metadata || {},
      createdAt: n.created_at,
    };
  });
}

/**
 * Fetch notifications for current authenticated user
 */
export const getNotifications = async ({ unread = false, limit = 50, offset = 0 } = {}) => {
  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.get('/notifications', {
      params: { unread, limit, offset },
    });
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getNotifications fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (unread) {
          query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (!error && data) {
          return await hydrateNotificationActors(data);
        }
      }
    } catch (err) {
      console.warn('Supabase getNotifications fallback failed:', err.message);
    }
  }

  return [];
};

/**
 * Fetch unread notification count
 */
export const getUnreadCount = async () => {
  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.get('/notifications/unread-count');
    if (res && res.unreadCount !== undefined) {
      return res.unreadCount;
    }
  } catch (err) {
    console.warn('API getUnreadCount fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!error) {
          return count || 0;
        }
      }
    } catch (err) {
      console.warn('Supabase getUnreadCount fallback failed:', err.message);
    }
  }

  return 0;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId) => {
  if (!notificationId) return { success: false };

  // 1. Try Express backend API via authenticated apiClient
  try {
    await apiClient.patch(`/notifications/${notificationId}/read`);
    return { success: true };
  } catch (err) {
    console.warn('API markAsRead fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase markAsRead fallback failed:', err.message);
    }
  }

  return { success: false };
};

/**
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (userId) => {
  // 1. Try Express backend API via authenticated apiClient
  try {
    await apiClient.patch('/notifications/read-all');
    return { success: true };
  } catch (err) {
    console.warn('API markAllAsRead fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured() && userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase markAllAsRead fallback failed:', err.message);
    }
  }

  return { success: false };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  if (!notificationId) return { success: false };

  // 1. Try Express backend API via authenticated apiClient
  try {
    await apiClient.delete(`/notifications/${notificationId}`);
    return { success: true };
  } catch (err) {
    console.warn('API deleteNotification fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase deleteNotification fallback failed:', err.message);
    }
  }

  return { success: false };
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
