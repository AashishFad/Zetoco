/**
 * Project Service
 * Handles data fetching and mutation for FlowSync Projects and Project Members
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from './api';

const API_BASE = '/projects';

/**
 * Helper: Hydrate creator and members with their profiles from profiles table
 */
async function hydrateProjectsProfiles(rawProjects) {
  if (!rawProjects || rawProjects.length === 0) return [];

  const userIds = new Set();
  rawProjects.forEach((p) => {
    if (p.created_by) userIds.add(p.created_by);
    (p.project_members || []).forEach((pm) => {
      if (pm.user_id) userIds.add(pm.user_id);
    });
  });

  let profileMap = new Map();
  if (userIds.size > 0) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title, bio')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((pr) => [pr.id, pr]));
      }
    } catch (e) {
      console.warn('Could not fetch profiles for project members:', e.message);
    }
  }

  return rawProjects.map((p) => {
    const creatorProfile = profileMap.get(p.created_by);
    const members = (p.project_members || []).map((pm) => {
      const pr = profileMap.get(pm.user_id);
      return {
        id: pm.id,
        userId: pm.user_id,
        projectRole: pm.project_role,
        joinedAt: pm.joined_at,
        fullName: pr?.full_name || 'Member',
        username: pr?.username || null,
        avatarUrl: pr?.avatar_url || null,
        jobTitle: pr?.job_title || null,
        bio: pr?.bio || null,
      };
    });

    return {
      ...p,
      creator: creatorProfile
        ? {
            id: creatorProfile.id,
            full_name: creatorProfile.full_name,
            username: creatorProfile.username,
            avatar_url: creatorProfile.avatar_url,
          }
        : null,
      membersCount: members.length,
      members,
    };
  });
}

/**
 * Fetch all projects for a specific organization
 */
export const getProjects = async (organizationId) => {
  if (!organizationId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members (
            id,
            user_id,
            project_role,
            joined_at
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return await hydrateProjectsProfiles(data);
      }
    } catch (err) {
      console.warn('Supabase getProjects fallback to API:', err.message);
    }
  }

  // Fallback to Express backend via apiClient
  try {
    const res = await apiClient.get(`${API_BASE}?organizationId=${organizationId}`);
    return res.data || [];
  } catch (err) {
    console.error('getProjects error:', err);
    return [];
  }
};

/**
 * Fetch a single project by ID with members
 */
export const getProjectById = async (projectId) => {
  if (!projectId) return null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          organizations (
            id,
            name,
            slug
          ),
          project_members (
            id,
            user_id,
            project_role,
            joined_at
          )
        `)
        .eq('id', projectId)
        .maybeSingle();

      if (!error && data) {
        const hydrated = await hydrateProjectsProfiles([data]);
        return hydrated[0] || null;
      }
    } catch (err) {
      console.warn('Supabase getProjectById fallback to API:', err.message);
    }
  }

  try {
    const res = await apiClient.get(`${API_BASE}/${projectId}`);
    return res.data || null;
  } catch (err) {
    console.error('getProjectById error:', err);
    return null;
  }
};

/**
 * Create a new project
 */
export const createProject = async (projectData) => {
  const { organizationId, name, description, status, priority, start_date, due_date, userId } = projectData;

  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  if (isSupabaseConfigured() && userId) {
    try {
      const { data: newProject, error: projErr } = await supabase
        .from('projects')
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          status: status || 'planning',
          priority: priority || 'medium',
          start_date: start_date || null,
          due_date: due_date || null,
          created_by: userId,
        })
        .select()
        .single();

      if (projErr) throw projErr;

      // Add creator as project manager
      await supabase
        .from('project_members')
        .insert({
          project_id: newProject.id,
          user_id: userId,
          project_role: 'manager',
        });

      return { success: true, project: newProject };
    } catch (err) {
      console.warn('Supabase direct createProject fallback:', err.message);
    }
  }

  try {
    const res = await apiClient.post(API_BASE, projectData);
    return { success: true, project: res.data };
  } catch (err) {
    const message = err.message || 'Failed to create project';
    return { success: false, error: message };
  }
};

/**
 * Update project details
 */
export const updateProject = async (projectId, updates) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (!error) return { success: true, project: data };
    } catch (err) {
      console.warn('Supabase updateProject error:', err.message);
    }
  }

  try {
    const res = await apiClient.patch(`${API_BASE}/${projectId}`, updates);
    return { success: true, project: res.data };
  } catch (err) {
    const message = err.message || 'Failed to update project';
    return { success: false, error: message };
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId) => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase deleteProject error:', err.message);
    }
  }

  try {
    await apiClient.delete(`${API_BASE}/${projectId}`);
    return { success: true };
  } catch (err) {
    const message = err.message || 'Failed to delete project';
    return { success: false, error: message };
  }
};

/**
 * Add member to project
 */
export const addProjectMember = async (projectId, userId, projectRole = 'member') => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          project_role: projectRole,
        })
        .select(`
          id,
          user_id,
          project_role,
          joined_at
        `)
        .single();

      if (!error && data) {
        // Hydrate profile
        const { data: pr } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, job_title')
          .eq('id', userId)
          .maybeSingle();

        return {
          success: true,
          member: {
            id: data.id,
            userId: data.user_id,
            projectRole: data.project_role,
            joinedAt: data.joined_at,
            fullName: pr?.full_name || 'Member',
            username: pr?.username,
            avatarUrl: pr?.avatar_url,
            jobTitle: pr?.job_title,
          },
        };
      }
    } catch (err) {
      console.warn('Supabase addProjectMember error:', err.message);
    }
  }

  try {
    const res = await apiClient.post(`${API_BASE}/${projectId}/members`, { userId, projectRole });
    return { success: true, member: res.data };
  } catch (err) {
    const message = err.message || 'Failed to add member to project';
    return { success: false, error: message };
  }
};

/**
 * Update project member role
 */
export const updateProjectMemberRole = async (projectId, memberId, newRole, currentMembers = []) => {
  // Check final manager protection
  const target = currentMembers.find((m) => m.id === memberId);
  if (target?.projectRole === 'manager' && newRole !== 'manager') {
    const managerCount = currentMembers.filter((m) => m.projectRole === 'manager').length;
    if (managerCount <= 1) {
      return {
        success: false,
        error: 'Cannot demote the sole project manager. Assign another project manager first.',
      };
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .update({ project_role: newRole })
        .eq('id', memberId)
        .select()
        .single();

      if (!error) return { success: true, role: newRole };
    } catch (err) {
      console.warn('Supabase updateProjectMemberRole error:', err.message);
    }
  }

  try {
    const res = await apiClient.patch(`${API_BASE}/${projectId}/members/${memberId}`, { projectRole: newRole });
    return { success: true, member: res.data };
  } catch (err) {
    const message = err.message || 'Failed to update project role';
    return { success: false, error: message };
  }
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (projectId, memberId, currentMembers = []) => {
  const target = currentMembers.find((m) => m.id === memberId);
  if (target?.projectRole === 'manager') {
    const managerCount = currentMembers.filter((m) => m.projectRole === 'manager').length;
    if (managerCount <= 1) {
      return {
        success: false,
        error: 'Cannot remove the last project manager. Assign another project manager first.',
      };
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (!error) return { success: true };
    } catch (err) {
      console.warn('Supabase removeProjectMember error:', err.message);
    }
  }

  try {
    await apiClient.delete(`${API_BASE}/${projectId}/members/${memberId}`);
    return { success: true };
  } catch (err) {
    const message = err.message || 'Failed to remove member from project';
    return { success: false, error: message };
  }
};
