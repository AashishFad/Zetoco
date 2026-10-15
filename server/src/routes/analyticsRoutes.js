/**
 * Analytics & Dashboard Router
 * Aggregates live PostgreSQL project, task, team, and activity metrics for organizations.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase, getUserClient } = require('../config/supabase');

const router = express.Router();

// Protect all analytics endpoints with Supabase JWT authentication
router.use(authMiddleware);

/**
 * Helper: Verify that the authenticated caller belongs to the requested organization
 * Includes auto-healing for workspace creators missing a membership record.
 */
async function verifyOrgMembership(orgId, userId, dbClient) {
  if (!orgId || !userId) return null;
  const client = dbClient || supabase;

  // 1. Check if user is an existing member of the organization
  const { data: member, error } = await client
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!error && member) return member;

  // 2. Creator fallback: If caller created this organization, register them as admin
  const { data: org } = await client
    .from('organizations')
    .select('id, created_by')
    .eq('id', orgId)
    .maybeSingle();

  if (org && org.created_by === userId) {
    try {
      await client.from('organization_members').insert({
        organization_id: orgId,
        user_id: userId,
        role: 'admin',
      });
      return { role: 'admin' };
    } catch {
      return { role: 'admin' };
    }
  }

  return null;
}

/**
 * GET /api/analytics/overview
 * Returns KPI metrics, task status/priority distributions, and project health
 */
router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationId, projectId, startDate, endDate } = req.query;
    const dbClient = getUserClient(req.token);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'organizationId is required',
      });
    }

    const member = await verifyOrgMembership(organizationId, userId, dbClient);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this organization',
      });
    }

    // 1. Query Projects
    let projectsQuery = dbClient
      .from('projects')
      .select('id, name, status, created_at')
      .eq('organization_id', organizationId);

    if (projectId && projectId !== 'ALL') {
      projectsQuery = projectsQuery.eq('id', projectId);
    }

    const { data: projects, error: projErr } = await projectsQuery;
    if (projErr) {
      return res.status(400).json({ success: false, message: projErr.message });
    }

    const totalProjects = (projects || []).length;
    const activeProjects = (projects || []).filter((p) => p.status === 'active').length;
    const completedProjects = (projects || []).filter((p) => p.status === 'completed').length;

    const projectStatusBreakdown = {
      planning: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
      archived: 0,
    };
    (projects || []).forEach((p) => {
      const st = p.status || 'planning';
      if (projectStatusBreakdown[st] !== undefined) {
        projectStatusBreakdown[st]++;
      }
    });

    // 2. Query Tasks
    let tasksQuery = dbClient
      .from('tasks')
      .select(`
        id,
        status,
        priority,
        due_date,
        created_at,
        project_id,
        project:projects!inner (
          id,
          organization_id
        )
      `)
      .eq('project.organization_id', organizationId);

    if (projectId && projectId !== 'ALL') {
      tasksQuery = tasksQuery.eq('project_id', projectId);
    }
    if (startDate) {
      tasksQuery = tasksQuery.gte('created_at', startDate);
    }
    if (endDate) {
      tasksQuery = tasksQuery.lte('created_at', endDate);
    }

    const { data: tasks, error: taskErr } = await tasksQuery;
    if (taskErr) {
      return res.status(400).json({ success: false, message: taskErr.message });
    }

    const totalTasks = (tasks || []).length;
    const completedTasks = (tasks || []).filter((t) => t.status === 'done').length;
    const openTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const now = new Date();
    const overdueTasks = (tasks || []).filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < now;
    }).length;

    const statusBreakdown = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    (tasks || []).forEach((t) => {
      const st = t.status || 'todo';
      if (statusBreakdown[st] !== undefined) {
        statusBreakdown[st]++;
      }
    });

    const priorityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    (tasks || []).forEach((t) => {
      const pr = t.priority || 'medium';
      if (priorityBreakdown[pr] !== undefined) {
        priorityBreakdown[pr]++;
      }
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          openTasks,
          completedTasks,
          overdueTasks,
          completionRate,
        },
        taskStatusBreakdown: statusBreakdown,
        taskPriorityBreakdown: priorityBreakdown,
        projectStatusBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/tasks
 * Returns contextual task lists (My Tasks, Upcoming Tasks, Overdue Tasks)
 */
router.get('/tasks', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationId, projectId, filter = 'my_tasks', limit = 8 } = req.query;
    const dbClient = getUserClient(req.token);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'organizationId is required',
      });
    }

    const member = await verifyOrgMembership(organizationId, userId, dbClient);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this organization',
      });
    }

    let query = dbClient
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        created_at,
        assigned_to,
        project:projects!inner (
          id,
          name,
          color,
          organization_id
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('project.organization_id', organizationId);

    if (projectId && projectId !== 'ALL') {
      query = query.eq('project_id', projectId);
    }

    const nowIso = new Date().toISOString();

    if (filter === 'my_tasks') {
      query = query.eq('assigned_to', userId);
      query = query.order('created_at', { ascending: false });
    } else if (filter === 'upcoming') {
      query = query.neq('status', 'done').not('due_date', 'is', null);
      query = query.gte('due_date', nowIso);
      query = query.order('due_date', { ascending: true });
    } else if (filter === 'overdue') {
      query = query.neq('status', 'done').not('due_date', 'is', null);
      query = query.lt('due_date', nowIso);
      query = query.order('due_date', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 50);
    query = query.limit(numLimit);

    const { data: tasks, error } = await query;
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      createdAt: t.created_at,
      projectId: t.project?.id,
      projectName: t.project?.name || 'Project',
      projectColor: t.project?.color,
      assignedTo: t.assigned_to,
      assigneeName: t.assignee?.full_name || 'Unassigned',
      assigneeUsername: t.assignee?.username,
      assigneeAvatarUrl: t.assignee?.avatar_url,
    }));

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
 * GET /api/analytics/projects
 * Returns detailed task completion and progress statistics for all projects
 */
router.get('/projects', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationId } = req.query;
    const dbClient = getUserClient(req.token);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'organizationId is required',
      });
    }

    const member = await verifyOrgMembership(organizationId, userId, dbClient);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this organization',
      });
    }

    // 1. Fetch projects
    const { data: projects, error: projErr } = await dbClient
      .from('projects')
      .select('id, name, description, status, color, due_date, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (projErr) {
      return res.status(400).json({ success: false, message: projErr.message });
    }

    // 2. Fetch all tasks for this org
    const { data: tasks, error: taskErr } = await dbClient
      .from('tasks')
      .select('id, project_id, status, priority, due_date')
      .in(
        'project_id',
        (projects || []).map((p) => p.id)
      );

    if (taskErr) {
      return res.status(400).json({ success: false, message: taskErr.message });
    }

    // 3. Aggregate metrics per project
    const projectTaskMap = {};
    (tasks || []).forEach((t) => {
      if (!projectTaskMap[t.project_id]) {
        projectTaskMap[t.project_id] = {
          total: 0,
          completed: 0,
          open: 0,
          overdue: 0,
        };
      }
      projectTaskMap[t.project_id].total++;
      if (t.status === 'done') {
        projectTaskMap[t.project_id].completed++;
      } else {
        projectTaskMap[t.project_id].open++;
        if (t.due_date && new Date(t.due_date) < new Date()) {
          projectTaskMap[t.project_id].overdue++;
        }
      }
    });

    const formatted = (projects || []).map((p) => {
      const stats = projectTaskMap[p.id] || { total: 0, completed: 0, open: 0, overdue: 0 };
      const completionRate =
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        color: p.color,
        dueDate: p.due_date,
        createdAt: p.created_at,
        totalTasks: stats.total,
        completedTasks: stats.completed,
        openTasks: stats.open,
        overdueTasks: stats.overdue,
        completionRate,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/team
 * Returns objective team workload distribution (open vs completed tasks per member)
 */
router.get('/team', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationId, projectId } = req.query;
    const dbClient = getUserClient(req.token);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'organizationId is required',
      });
    }

    const member = await verifyOrgMembership(organizationId, userId, dbClient);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this organization',
      });
    }

    // 1. Fetch organization members
    const { data: orgMembers, error: memErr } = await dbClient
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        profile:profiles (
          id,
          full_name,
          username,
          avatar_url,
          job_title
        )
      `)
      .eq('organization_id', organizationId);

    if (memErr) {
      return res.status(400).json({ success: false, message: memErr.message });
    }

    // 2. Fetch tasks in organization
    let tasksQuery = dbClient
      .from('tasks')
      .select(`
        id,
        assigned_to,
        status,
        project:projects!inner (
          id,
          organization_id
        )
      `)
      .eq('project.organization_id', organizationId);

    if (projectId && projectId !== 'ALL') {
      tasksQuery = tasksQuery.eq('project_id', projectId);
    }

    const { data: tasks, error: taskErr } = await tasksQuery;
    if (taskErr) {
      return res.status(400).json({ success: false, message: taskErr.message });
    }

    // 3. Aggregate tasks per user
    const userTaskStats = {};
    (tasks || []).forEach((t) => {
      if (!t.assigned_to) return;
      if (!userTaskStats[t.assigned_to]) {
        userTaskStats[t.assigned_to] = { open: 0, completed: 0 };
      }
      if (t.status === 'done') {
        userTaskStats[t.assigned_to].completed++;
      } else {
        userTaskStats[t.assigned_to].open++;
      }
    });

    const workload = (orgMembers || []).map((m) => {
      const stats = userTaskStats[m.user_id] || { open: 0, completed: 0 };
      return {
        userId: m.user_id,
        fullName: m.profile?.full_name || 'Team Member',
        username: m.profile?.username,
        avatarUrl: m.profile?.avatar_url,
        jobTitle: m.profile?.job_title,
        role: m.role,
        openTasks: stats.open,
        completedTasks: stats.completed,
        totalTasks: stats.open + stats.completed,
      };
    });

    // Sort by open tasks descending
    workload.sort((a, b) => b.openTasks - a.openTasks);

    res.json({
      success: true,
      data: workload,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/activity
 * Returns recent organization activity logs
 */
router.get('/activity', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationId, projectId, limit = 10 } = req.query;
    const dbClient = getUserClient(req.token);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'organizationId is required',
      });
    }

    const member = await verifyOrgMembership(organizationId, userId, dbClient);
    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this organization',
      });
    }

    let query = dbClient
      .from('activity_logs')
      .select(`
        id,
        organization_id,
        project_id,
        task_id,
        user_id,
        action,
        metadata,
        created_at,
        actor:profiles!activity_logs_user_id_fkey (
          id,
          full_name,
          username,
          avatar_url
        ),
        task:tasks (
          id,
          title
        ),
        project:projects (
          id,
          name,
          color
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (projectId && projectId !== 'ALL') {
      query = query.eq('project_id', projectId);
    }

    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    query = query.limit(numLimit);

    const { data: logs, error } = await query;
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const formatted = (logs || []).map((l) => ({
      id: l.id,
      organizationId: l.organization_id,
      projectId: l.project_id,
      projectName: l.project?.name,
      projectColor: l.project?.color,
      taskId: l.task_id,
      taskTitle: l.task?.title || l.metadata?.task_title,
      userId: l.user_id,
      actorName: l.actor?.full_name || 'Team Member',
      actorUsername: l.actor?.username,
      actorAvatarUrl: l.actor?.avatar_url,
      action: l.action,
      metadata: l.metadata || {},
      createdAt: l.created_at,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
