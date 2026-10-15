/**
 * Activity Service
 * Client-side data fetching for task activity history.
 * Communicates with Express backend via authenticated apiClient with Supabase fallback.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from './api';

/**
 * Helper: Hydrate actor profiles for activity logs from Supabase
 */
async function hydrateActivityProfiles(logsList) {
  if (!logsList || logsList.length === 0) return [];
  const userIds = new Set();
  logsList.forEach((l) => {
    if (l.user_id) userIds.add(l.user_id);
  });

  let profileMap = new Map();
  if (userIds.size > 0 && isSupabaseConfigured()) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate activity profiles in client:', e.message);
    }
  }

  return logsList.map((l) => {
    const actor = profileMap.get(l.user_id);
    return {
      id: l.id,
      taskId: l.task_id,
      projectId: l.project_id,
      organizationId: l.organization_id,
      userId: l.user_id,
      action: l.action,
      metadata: l.metadata || {},
      createdAt: l.created_at,
      actorName: actor?.full_name || 'Team Member',
      actorUsername: actor?.username || null,
      actorAvatarUrl: actor?.avatar_url || null,
    };
  });
}

/**
 * Fetch activity history for a specific task
 */
export const getActivityByTask = async (taskId) => {
  if (!taskId) return [];

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.get(`/tasks/${taskId}/activity`);
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getActivityByTask fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return await hydrateActivityProfiles(data);
      }
    } catch (err) {
      console.warn('Supabase getActivityByTask fallback failed:', err.message);
    }
  }

  return [];
};

export default {
  getActivityByTask,
};
