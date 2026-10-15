/**
 * Comment Service
 * Client-side data fetching and mutations for task comments.
 * Communicates with Express backend via authenticated apiClient with Supabase fallback.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from './api';

/**
 * Helper: Hydrate profiles for comments when querying Supabase directly
 */
async function hydrateCommentsProfiles(commentsList) {
  if (!commentsList || commentsList.length === 0) return [];
  const userIds = new Set();
  commentsList.forEach((c) => {
    if (c.user_id) userIds.add(c.user_id);
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
      console.warn('Could not hydrate comment profiles in client:', e.message);
    }
  }

  return commentsList.map((c) => {
    const author = profileMap.get(c.user_id);
    return {
      id: c.id,
      taskId: c.task_id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      authorName: author?.full_name || 'Team Member',
      authorUsername: author?.username || null,
      authorAvatarUrl: author?.avatar_url || null,
    };
  });
}

/**
 * Fetch comments for a specific task
 */
export const getCommentsByTask = async (taskId) => {
  if (!taskId) return [];

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.get(`/tasks/${taskId}/comments`);
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getCommentsByTask fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return await hydrateCommentsProfiles(data);
      }
    } catch (err) {
      console.warn('Supabase getCommentsByTask fallback failed:', err.message);
    }
  }

  return [];
};

/**
 * Create a new comment
 */
export const createComment = async (taskId, content, userId) => {
  if (!taskId || !content?.trim()) {
    return { success: false, error: 'Content is required' };
  }

  let apiError = null;

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.post(`/tasks/${taskId}/comments`, { content: content.trim() });
    if (res && (res.data || res.comment || res.id)) {
      return {
        success: true,
        comment: res.data || res.comment || res,
      };
    }
  } catch (err) {
    apiError = err.message;
    console.warn('API createComment fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content: content.trim(),
        })
        .select('*')
        .single();

      if (!error && data) {
        const [hydrated] = await hydrateCommentsProfiles([data]);
        return {
          success: true,
          comment: hydrated || {
            id: data.id,
            taskId: data.task_id,
            userId: data.user_id,
            content: data.content,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            authorName: 'Team Member',
          },
        };
      }
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn('Supabase createComment fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to add comment' };
    }
  }

  return { success: false, error: apiError || 'Failed to add comment' };
};

/**
 * Update comment content
 */
export const updateComment = async (commentId, content) => {
  if (!commentId || !content?.trim()) {
    return { success: false, error: 'Content is required' };
  }

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.patch(`/comments/${commentId}`, { content: content.trim() });
    return {
      success: true,
      comment: res?.data || res?.comment || res,
    };
  } catch (err) {
    console.warn('API updateComment fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select('*')
        .single();

      if (!error && data) {
        const [hydrated] = await hydrateCommentsProfiles([data]);
        return {
          success: true,
          comment: hydrated || {
            id: data.id,
            taskId: data.task_id,
            userId: data.user_id,
            content: data.content,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            authorName: 'Team Member',
          },
        };
      }
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn('Supabase updateComment fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to update comment' };
    }
  }

  return { success: false, error: 'Failed to update comment' };
};

/**
 * Delete comment
 */
export const deleteComment = async (commentId) => {
  if (!commentId) return { success: false, error: 'Comment ID is required' };

  // 1. Try Express backend API via authenticated apiClient
  try {
    await apiClient.delete(`/comments/${commentId}`);
    return { success: true };
  } catch (err) {
    console.warn('API deleteComment fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (!error) return { success: true };
      if (error) return { success: false, error: error.message };
    } catch (err) {
      console.warn('Supabase deleteComment fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to delete comment' };
    }
  }

  return { success: false, error: 'Failed to delete comment' };
};

export default {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment,
};
