/**
 * Projects Router
 * Handles CRUD and membership operations for FlowSync Projects with RBAC authorization.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase, getUserClient } = require('../config/supabase');
const { hasRolePermission } = require('../constants/permissions');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// Protect all project routes with Supabase JWT authentication
router.use(authMiddleware);

/**
 * Helper: Hydrate creator profile and project member profiles
 */
const hydrateProjectProfiles = async (dbClient, projects) => {
  if (!projects || projects.length === 0) return [];
  const userIds = new Set();
  projects.forEach((p) => {
    if (p.created_by) userIds.add(p.created_by);
    (p.project_members || []).forEach((pm) => {
      if (pm.user_id) userIds.add(pm.user_id);
    });
  });

  let profileMap = new Map();
  if (userIds.size > 0) {
    try {
      const { data: profiles } = await dbClient
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title, bio')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((pr) => [pr.id, pr]));
      }
    } catch (e) {
      console.warn('Could not fetch profiles for projects in server:', e.message);
    }
  }

  return projects.map((p) => {
    const creator = profileMap.get(p.created_by) || null;
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
      creator,
      membersCount: members.length,
      members,
    };
  });
};

/**
 * Helper: Generate unique slug scoped to an organization
 */
const generateOrgUniqueSlug = async (orgId, name) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', orgId)
      .eq('slug', slug)
      .maybeSingle();

    if (!data) break;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};

/**
 * GET /api/projects
 * List projects for an organization (accessible to organization members)
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orgId = req.query.organizationId || req.headers['x-organization-id'];

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required (via query or x-organization-id header)',
      });
    }

    // 1. Verify user is a member of the organization
    const { data: orgMember, error: orgErr } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (orgErr || !orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this organization',
      });
    }

    // 2. Fetch projects
    let query = supabase
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
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.priority) query = query.eq('priority', req.query.priority);

    const { data: projects, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const formatted = await hydrateProjectProfiles(supabase, projects || []);

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects
 * Create a new project in an organization (requires projects.create permission)
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      organizationId,
      name,
      description,
      status = 'planning',
      priority = 'medium',
      start_date,
      due_date,
    } = req.body;

    const orgId = organizationId || req.headers['x-organization-id'];
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    // 1. Check organization membership and role permission
    const { data: orgMember, error: orgErr } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (orgErr || !orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this organization',
      });
    }

    if (!hasRolePermission(orgMember.role, 'projects.create')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to create projects in this organization',
      });
    }

    // 2. Validate dates
    if (start_date && due_date && new Date(start_date) > new Date(due_date)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after due date',
      });
    }

    const validStatuses = ['planning', 'active', 'on_hold', 'completed', 'archived'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Valid values: ${validPriorities.join(', ')}`,
      });
    }

    const slug = await generateOrgUniqueSlug(orgId, name);

    // 3. Create project
    const { data: newProject, error: projErr } = await supabase
      .from('projects')
      .insert({
        organization_id: orgId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        status,
        priority,
        start_date: start_date || null,
        due_date: due_date || null,
        created_by: userId,
      })
      .select()
      .single();

    if (projErr) {
      return res.status(400).json({
        success: false,
        message: projErr.message,
      });
    }

    // 4. Automatically add creator as manager in project_members
    const { error: memberErr } = await supabase
      .from('project_members')
      .insert({
        project_id: newProject.id,
        user_id: userId,
        project_role: 'manager',
      });

    if (memberErr) {
      console.warn('Backend warning registering project creator:', memberErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        ...newProject,
        membersCount: 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id
 * Retrieve single project details with members
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 1. Fetch project
    const { data: project, error: projErr } = await supabase
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
      .eq('id', id)
      .maybeSingle();

    if (projErr || !project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 2. Validate requesting user is an organization member
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this project workspace',
      });
    }

    const hydratedList = await hydrateProjectProfiles(supabase, [project]);
    const hydratedProject = hydratedList[0] || project;

    const currentProjectMember = (hydratedProject.members || []).find((pm) => pm.userId === userId);

    const formatted = {
      ...hydratedProject,
      orgRole: orgMember.role,
      userProjectRole: currentProjectMember?.projectRole || null,
      isProjectMember: Boolean(currentProjectMember),
    };

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/projects/:id
 * Update project details (requires Admin or Project Manager role)
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, status, priority, start_date, due_date } = req.body;

    // 1. Fetch project to check organization
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', id)
      .maybeSingle();

    if (projErr || !project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 2. Check authorization (Org Admin or Project Manager in project_members)
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    const { data: projMember } = await supabase
      .from('project_members')
      .select('project_role')
      .eq('project_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    const isAuthorized =
      orgMember?.role === 'admin' ||
      orgMember?.role === 'project_manager' ||
      projMember?.project_role === 'manager';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Admins or Project Managers can update project details',
      });
    }

    // 3. Validate dates
    if (start_date && due_date && new Date(start_date) > new Date(due_date)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after due date',
      });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (due_date !== undefined) updates.due_date = due_date || null;

    const { data: updatedProject, error: updateErr } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project (requires Admin or Project Manager with projects.delete)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', id)
      .maybeSingle();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    const { data: projMember } = await supabase
      .from('project_members')
      .select('project_role')
      .eq('project_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    const isAuthorized =
      orgMember?.role === 'admin' ||
      (orgMember?.role === 'project_manager' && projMember?.project_role === 'manager');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to delete this project',
      });
    }

    const { error: delErr } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (delErr) {
      return res.status(400).json({
        success: false,
        message: delErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id/members
 * List members of a project
 */
router.get('/:id/members', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', id)
      .maybeSingle();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify org membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied',
      });
    }

    const { data: members, error } = await supabase
      .from('project_members')
      .select('id, user_id, project_role, joined_at')
      .eq('project_id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const userIds = (members || []).map((m) => m.user_id).filter(Boolean);
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title, bio')
        .in('id', userIds);
      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    }

    const formatted = (members || []).map((m) => {
      const pr = profileMap.get(m.user_id);
      return {
        id: m.id,
        userId: m.user_id,
        projectRole: m.project_role,
        joinedAt: m.joined_at,
        fullName: pr?.full_name || 'Member',
        username: pr?.username || null,
        avatarUrl: pr?.avatar_url || null,
        jobTitle: pr?.job_title || null,
        bio: pr?.bio || null,
      };
    });

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects/:id/members
 * Add a member to a project (must belong to the parent organization)
 */
router.post('/:id/members', async (req, res, next) => {
  try {
    const callerId = req.user.id;
    const { id } = req.params;
    const { userId: targetUserId, projectRole = 'member' } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target User ID is required',
      });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // 1. Verify caller has permission (Org Admin or Project Manager)
    const { data: callerOrgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', callerId)
      .maybeSingle();

    const { data: callerProjMember } = await supabase
      .from('project_members')
      .select('project_role')
      .eq('project_id', id)
      .eq('user_id', callerId)
      .maybeSingle();

    const isAuthorized =
      callerOrgMember?.role === 'admin' ||
      callerOrgMember?.role === 'project_manager' ||
      callerProjMember?.project_role === 'manager';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to add project members',
      });
    }

    // 2. Verify target user is in the parent organization
    const { data: targetOrgMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', project.organization_id)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetOrgMember) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add user to project: User is not a member of this organization',
      });
    }

    // 3. Add to project_members
    const { data: newMember, error: insertErr } = await supabase
      .from('project_members')
      .insert({
        project_id: id,
        user_id: targetUserId,
        project_role: projectRole,
      })
      .select('id, user_id, project_role, joined_at')
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, job_title')
      .eq('id', targetUserId)
      .maybeSingle();

    // 4. Notify added member
    if (targetUserId !== callerId) {
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', callerId)
        .maybeSingle();

      const callerName = callerProfile?.full_name || 'A team member';

      const dbClient = getUserClient(req.token) || supabase;
      await createNotification({
        dbClient,
        userId: targetUserId,
        organizationId: project.organization_id,
        type: 'project_member_added',
        title: `${callerName} added you to project "${project.name}"`,
        message: `You were added as a ${projectRole} in ${project.name}.`,
        entityType: 'project',
        entityId: id,
        actorId: callerId,
        metadata: { projectId: id, projectName: project.name, projectRole },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Member added to project',
      data: {
        id: newMember.id,
        userId: newMember.user_id,
        projectRole: newMember.project_role,
        joinedAt: newMember.joined_at,
        fullName: targetProfile?.full_name || 'Member',
        username: targetProfile?.username,
        avatarUrl: targetProfile?.avatar_url,
        jobTitle: targetProfile?.job_title,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/projects/:id/members/:memberId
 * Update project member role (manager, member, viewer) with final manager protection
 */
router.patch('/:id/members/:memberId', async (req, res, next) => {
  try {
    const callerId = req.user.id;
    const { id: projectId, memberId } = req.params;
    const { projectRole: newProjectRole } = req.body;

    const validRoles = ['manager', 'member', 'viewer'];
    if (!newProjectRole || !validRoles.includes(newProjectRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid project role. Valid values: ${validRoles.join(', ')}`,
      });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, organization_id')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify caller authorization
    const { data: callerOrgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', callerId)
      .maybeSingle();

    const { data: callerProjMember } = await supabase
      .from('project_members')
      .select('project_role')
      .eq('project_id', projectId)
      .eq('user_id', callerId)
      .maybeSingle();

    const isAuthorized =
      callerOrgMember?.role === 'admin' ||
      callerProjMember?.project_role === 'manager';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Admins or Project Managers can modify project member roles',
      });
    }

    // Target member
    const { data: targetMember } = await supabase
      .from('project_members')
      .select('id, user_id, project_role')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in project',
      });
    }

    // Final Project Manager Protection Safeguard
    if (targetMember.project_role === 'manager' && newProjectRole !== 'manager') {
      const { data: managers } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('project_role', 'manager');

      if ((managers || []).length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the sole project manager. Assign another project manager first.',
        });
      }
    }

    const { data: updatedMember, error: updateErr } = await supabase
      .from('project_members')
      .update({ project_role: newProjectRole })
      .eq('id', memberId)
      .select('id, user_id, project_role, joined_at')
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message,
      });
    }

    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, job_title')
      .eq('id', updatedMember.user_id)
      .maybeSingle();

    // Notify member if role changed
    if (targetMember.user_id !== callerId && targetMember.project_role !== newProjectRole) {
      const dbClient = getUserClient(req.token) || supabase;
      await createNotification({
        dbClient,
        userId: targetMember.user_id,
        organizationId: project.organization_id,
        type: 'project_role_changed',
        title: `Your role changed in "${project.name}"`,
        message: `You are now a ${newProjectRole} in ${project.name}.`,
        entityType: 'project',
        entityId: projectId,
        actorId: callerId,
        metadata: { projectId, projectName: project.name, newProjectRole },
      });
    }

    res.json({
      success: true,
      message: `Project role updated to ${newProjectRole}`,
      data: {
        id: updatedMember.id,
        userId: updatedMember.user_id,
        projectRole: updatedMember.project_role,
        joinedAt: updatedMember.joined_at,
        fullName: memberProfile?.full_name || 'Member',
        username: memberProfile?.username,
        avatarUrl: memberProfile?.avatar_url,
        jobTitle: memberProfile?.job_title,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:id/members/:memberId
 * Remove member from project with final manager safeguard
 */
router.delete('/:id/members/:memberId', async (req, res, next) => {
  try {
    const callerId = req.user.id;
    const { id: projectId, memberId } = req.params;

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Target member
    const { data: targetMember } = await supabase
      .from('project_members')
      .select('id, user_id, project_role')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in project',
      });
    }

    // Verify caller authorization (Admin, Manager, or user removing themselves)
    const { data: callerOrgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', callerId)
      .maybeSingle();

    const { data: callerProjMember } = await supabase
      .from('project_members')
      .select('project_role')
      .eq('project_id', projectId)
      .eq('user_id', callerId)
      .maybeSingle();

    const isSelf = targetMember.user_id === callerId;
    const isAuthorized =
      isSelf ||
      callerOrgMember?.role === 'admin' ||
      callerProjMember?.project_role === 'manager';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to remove this member',
      });
    }

    // Final Project Manager Protection Safeguard
    if (targetMember.project_role === 'manager') {
      const { data: managers } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('project_role', 'manager');

      if ((managers || []).length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last project manager. Assign another manager first.',
        });
      }
    }

    const { error: delErr } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (delErr) {
      return res.status(400).json({
        success: false,
        message: delErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Member removed from project',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
