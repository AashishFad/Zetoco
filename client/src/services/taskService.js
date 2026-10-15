/**
 * Task Service
 * Handles data fetching, mutation, assignment, and drag-and-drop movements for FlowSync Tasks.
 * Communicates with Express backend via authenticated apiClient with Supabase client fallback.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from './api';

const API_BASE = '/tasks';

/**
 * Helper: Hydrate creator and assignee profiles for raw tasks from Supabase
 */
async function hydrateTaskProfiles(tasksList) {
  if (!tasksList || tasksList.length === 0) return [];
  const userIds = new Set();
  tasksList.forEach((t) => {
    if (t.created_by) userIds.add(t.created_by);
    if (t.assigned_to) userIds.add(t.assigned_to);
  });

  let profileMap = new Map();
  if (userIds.size > 0 && isSupabaseConfigured()) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate task profiles in client:', e.message);
    }
  }

  return tasksList.map((t) => {
    const assignee = t.assigned_to ? profileMap.get(t.assigned_to) || null : null;
    const creator = t.created_by ? profileMap.get(t.created_by) || null : null;
    return {
      ...t,
      assignee,
      creator,
      assigneeName: assignee?.full_name || null,
      creatorName: creator?.full_name || null,
      projectName: t.project?.name || 'Project',
      projectSlug: t.project?.slug || 'PRJ',
    };
  });
}

/**
 * Fetch tasks for a specific project
 */
export const getTasksByProject = async (projectId) => {
  if (!projectId) return [];

  // 1. Try Express backend API
  try {
    const res = await apiClient.get(`${API_BASE}?projectId=${projectId}`);
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getTasksByProject fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return await hydrateTaskProfiles(data);
      }
    } catch (err) {
      console.warn('Supabase getTasksByProject fallback failed:', err.message);
    }
  }

  return [];
};

/**
 * Fetch tasks assigned to the current user
 */
export const getMyTasks = async (userId) => {
  // 1. Try Express backend API
  try {
    const res = await apiClient.get(`${API_BASE}?assignedTo=me`);
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getMyTasks fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects (
            id,
            name,
            slug
          )
        `)
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (!error && data) {
        return await hydrateTaskProfiles(data);
      }
    } catch (err) {
      console.warn('Supabase getMyTasks fallback failed:', err.message);
    }
  }

  return [];
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  const { projectId, title, description, status, priority, due_date, assigned_to, userId } = taskData;

  // 1. Primary: Call Express backend via authenticated apiClient
  try {
    const res = await apiClient.post(API_BASE, {
      projectId,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || null,
    });

    return {
      success: true,
      task: res.data || res,
    };
  } catch (err) {
    // If backend returns a structured validation or permission error, surface it directly
    if (err.statusCode && err.statusCode < 500) {
      return {
        success: false,
        error: err.message || 'Failed to create task',
      };
    }
    console.warn('API createTask failed, attempting Supabase fallback:', err.message);
  }

  // 2. Fallback: Direct Supabase insert
  if (isSupabaseConfigured() && userId) {
    try {
      const { data: highest } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('project_id', projectId)
        .eq('status', status || 'todo')
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (highest?.order_index || 0) + 1;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: title.trim(),
          description: description?.trim() || null,
          status: status || 'todo',
          priority: priority || 'medium',
          due_date: due_date || null,
          assigned_to: assigned_to || null,
          created_by: userId,
          order_index: nextOrder,
        })
        .select()
        .single();

      if (!error && data) {
        const hydrated = await hydrateTaskProfiles([data]);
        return {
          success: true,
          task: hydrated[0] || data,
        };
      } else if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create task in Supabase',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to create task',
      };
    }
  }

  return { success: false, error: 'Could not create task: service unavailable' };
};

/**
 * Update task
 */
export const updateTask = async (taskId, updates) => {
  // 1. Primary: Express backend API
  try {
    const res = await apiClient.patch(`${API_BASE}/${taskId}`, updates);
    return {
      success: true,
      task: res.data || res,
    };
  } catch (err) {
    if (err.statusCode && err.statusCode < 500) {
      return {
        success: false,
        error: err.message || 'Failed to update task',
      };
    }
    console.warn('API updateTask failed, attempting Supabase fallback:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (!error && data) {
        const hydrated = await hydrateTaskProfiles([data]);
        return {
          success: true,
          task: hydrated[0] || data,
        };
      } else if (error) {
        return {
          success: false,
          error: error.message || 'Failed to update task in Supabase',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to update task',
      };
    }
  }

  return { success: false, error: 'Could not update task: service unavailable' };
};

/**
 * Delete task
 */
export const deleteTask = async (taskId) => {
  // 1. Primary: Express backend API
  try {
    await apiClient.delete(`${API_BASE}/${taskId}`);
    return { success: true };
  } catch (err) {
    if (err.statusCode && err.statusCode < 500) {
      return {
        success: false,
        error: err.message || 'Failed to delete task',
      };
    }
    console.warn('API deleteTask failed, attempting Supabase fallback:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (!error) return { success: true };
      return {
        success: false,
        error: error.message || 'Failed to delete task in Supabase',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to delete task',
      };
    }
  }

  return { success: false, error: 'Could not delete task: service unavailable' };
};
