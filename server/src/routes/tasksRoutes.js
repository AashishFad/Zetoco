/**
 * Tasks Router
 * Handles CRUD, assignment, status/ordering updates, and automatic audit activity logging.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase, getUserClient } = require('../config/supabase');
const { ROLES } = require('../constants/permissions');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// Protect all task endpoints with Supabase JWT authentication
router.use(authMiddleware);

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Helper: Hydrate creator and assignee profiles for tasks
 */
const hydrateTaskProfiles = async (dbClient, tasksList) => {
  if (!tasksList || tasksList.length === 0) return [];
  const userIds = new Set();
  tasksList.forEach((t) => {
    if (t.created_by) userIds.add(t.created_by);
    if (t.assigned_to) userIds.add(t.assigned_to);
  });

  let profileMap = new Map();
  if (userIds.size > 0) {
    try {
      const { data: profiles } = await dbClient
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate task profiles in server:', e.message);
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
};

/**
 * GET /api/tasks
 * Fetch tasks by projectId OR assigned to current user (assignedTo=me)
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, assignedTo, status, priority } = req.query;
    const dbClient = getUserClient(req.token) || supabase;

    let query = dbClient
      .from('tasks')
      .select(`
        *,
        project:projects (
          id,
          name,
          slug,
          organization_id
        )
      `);

    if (projectId) {
      const { data: project } = await dbClient
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

      const { data: orgMember } = await dbClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!orgMember) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have access to this project workspace',
        });
      }

      query = query.eq('project_id', projectId);
    } else if (assignedTo === 'me') {
      query = query.eq('assigned_to', userId);
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    query = query.order('order_index', { ascending: true }).order('created_at', { ascending: false });

    const { data: tasks, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const formatted = await hydrateTaskProfiles(dbClient, tasks || []);

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
 * POST /api/tasks
 * Create a new task and record task_created activity
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      projectId,
      title,
      description,
      status = 'todo',
      priority = 'medium',
      due_date,
      assigned_to,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    const dbClient = getUserClient(req.token) || supabase;
    let cleanProjectId = typeof projectId === 'string' ? projectId.trim().replace(/\s+/g, '-') : projectId;
    if (typeof cleanProjectId === 'string' && /^[0-9a-fA-F]{32}$/.test(cleanProjectId)) {
      cleanProjectId = `${cleanProjectId.slice(0, 8)}-${cleanProjectId.slice(8, 12)}-${cleanProjectId.slice(12, 16)}-${cleanProjectId.slice(16, 20)}-${cleanProjectId.slice(20)}`;
    }

    // 1. Verify caller access
    const { data: project, error: projErr } = await dbClient
      .from('projects')
      .select('id, organization_id, name, slug')
      .eq('id', cleanProjectId)
      .maybeSingle();

    if (projErr) {
      console.warn('tasksRoutes project lookup error:', projErr.message);
    }

    if (projErr || !project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', project.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this project',
      });
    }

    // Check caller project-level permissions (Admin, PM, or project member)
    const { data: callerProjMember } = await dbClient
      .from('project_members')
      .select('project_role')
      .eq('project_id', cleanProjectId)
      .eq('user_id', userId)
      .maybeSingle();

    const isAuthorizedCaller =
      orgMember.role === ROLES.ADMIN ||
      orgMember.role === ROLES.PROJECT_MANAGER ||
      Boolean(callerProjMember);

    if (!isAuthorizedCaller) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to create tasks in this project',
      });
    }

    // 2. Validate assignee belongs to the project's organization
    let assigneeProfile = null;
    if (assigned_to) {
      const { data: assigneeOrgMember } = await dbClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', assigned_to)
        .maybeSingle();

      if (!assigneeOrgMember) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be an active member of this organization',
        });
      }

      // Ensure assignee is recorded in project_members so project-level access remains consistent
      const { data: isProjMember } = await dbClient
        .from('project_members')
        .select('id')
        .eq('project_id', cleanProjectId)
        .eq('user_id', assigned_to)
        .maybeSingle();

      if (!isProjMember) {
        await dbClient
          .from('project_members')
          .insert({
            project_id: cleanProjectId,
            user_id: assigned_to,
            project_role: assigneeOrgMember.role === ROLES.ADMIN ? 'manager' : 'member',
          });
      }

      const { data: pr } = await dbClient
        .from('profiles')
        .select('id, full_name')
        .eq('id', assigned_to)
        .maybeSingle();
      assigneeProfile = pr;
    }

    // 3. Compute next order_index
    const { data: highestOrderTask } = await dbClient
      .from('tasks')
      .select('order_index')
      .eq('project_id', cleanProjectId)
      .eq('status', status)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (highestOrderTask?.order_index || 0) + 1;

    // 4. Insert task
    const { data: newTask, error: insertErr } = await dbClient
      .from('tasks')
      .insert({
        project_id: cleanProjectId,
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        due_date: due_date || null,
        assigned_to: assigned_to || null,
        created_by: userId,
        order_index: nextOrder,
      })
      .select(`
        *,
        project:projects (
          id,
          name,
          slug,
          organization_id
        )
      `)
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    const [hydratedTask] = await hydrateTaskProfiles(dbClient, [newTask]);

    // 5. Automatically log task_created activity
    await logActivity({
      organizationId: project.organization_id,
      projectId: cleanProjectId,
      taskId: newTask.id,
      userId,
      action: 'task_created',
      metadata: {
        task_title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
      },
    });

    // 6. Notify assignee if assigned to someone other than creator
    if (assigned_to && assigned_to !== userId) {
      const { data: actorProfile } = await dbClient
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      const actorName = actorProfile?.full_name || 'A team member';

      await createNotification({
        dbClient,
        userId: assigned_to,
        organizationId: project.organization_id,
        type: 'task_assigned',
        title: `${actorName} assigned you a task`,
        message: `You were assigned to "${newTask.title}".`,
        entityType: 'task',
        entityId: newTask.id,
        actorId: userId,
        metadata: {
          taskId: newTask.id,
          projectId: cleanProjectId,
          taskTitle: newTask.title,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: hydratedTask || newTask,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:id
 * Retrieve single task by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const dbClient = getUserClient(req.token) || supabase;

    const { data: task, error } = await dbClient
      .from('tasks')
      .select(`
        *,
        project:projects (
          id,
          name,
          slug,
          organization_id
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', task.project?.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this task',
      });
    }

    const [hydratedTask] = await hydrateTaskProfiles(dbClient, [task]);

    res.json({
      success: true,
      data: hydratedTask || task,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id
 * Update task and generate audit activity logs for modified fields
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const dbClient = getUserClient(req.token) || supabase;
    const {
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      order_index,
    } = req.body;

    // 1. Fetch current task state
    const { data: task, error: fetchErr } = await dbClient
      .from('tasks')
      .select(`
        *,
        project:projects (
          id,
          organization_id
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const orgId = task.project?.organization_id;
    const projectId = task.project_id;

    // 2. Check authorization
    const { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this workspace',
      });
    }

    // 3. If assigned_to changed, verify organization membership & fetch assignee profile
    let newAssigneeProfile = null;
    if (assigned_to !== undefined && assigned_to !== null) {
      const { data: assigneeOrgMember } = await dbClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', assigned_to)
        .maybeSingle();

      if (!assigneeOrgMember) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be an active member of this organization',
        });
      }

      // Ensure assignee is recorded in project_members
      const { data: isProjMember } = await dbClient
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', assigned_to)
        .maybeSingle();

      if (!isProjMember) {
        await dbClient
          .from('project_members')
          .insert({
            project_id: projectId,
            user_id: assigned_to,
            project_role: assigneeOrgMember.role === ROLES.ADMIN ? 'manager' : 'member',
          });
      }

      const { data: profile } = await dbClient
        .from('profiles')
        .select('id, full_name')
        .eq('id', assigned_to)
        .maybeSingle();

      newAssigneeProfile = profile;
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`,
        });
      }
      updates.status = status;
    }
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}`,
        });
      }
      updates.priority = priority;
    }
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (order_index !== undefined) updates.order_index = order_index;

    const { data: updatedTask, error: updateErr } = await dbClient
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:projects (
          id,
          name,
          slug,
          organization_id
        )
      `)
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message,
      });
    }

    // 4. Resolve actor profile for activity logging and notifications
    const { data: actorProfile } = await dbClient
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const actorName = actorProfile?.full_name || 'A team member';

    // Helper: Collect task participants (assignee and creator, excluding current actor)
    const getTaskParticipants = () => {
      const recipients = new Set();
      if (task.assigned_to && task.assigned_to !== userId) recipients.add(task.assigned_to);
      if (task.created_by && task.created_by !== userId) recipients.add(task.created_by);
      return Array.from(recipients);
    };

    // 5. Generate Activity Logs and Notifications for specific changed attributes
    if (status !== undefined && status !== task.status) {
      await logActivity({
        organizationId: orgId,
        projectId,
        taskId: id,
        userId,
        action: 'task_status_changed',
        metadata: {
          task_title: updatedTask.title,
          old_status: task.status,
          new_status: status,
        },
      });

      const statusLabels = {
        todo: 'To Do',
        in_progress: 'In Progress',
        in_review: 'In Review',
        done: 'Done',
      };
      const formattedStatus = statusLabels[status] || status.replace(/_/g, ' ');

      const statusRecipients = getTaskParticipants();
      for (const recId of statusRecipients) {
        await createNotification({
          dbClient,
          userId: recId,
          organizationId: orgId,
          type: 'task_status_changed',
          title: `${actorName} updated status of "${updatedTask.title}"`,
          message: `Moved to ${formattedStatus}.`,
          entityType: 'task',
          entityId: id,
          actorId: userId,
          metadata: {
            taskId: id,
            projectId,
            oldStatus: task.status,
            newStatus: status,
            taskTitle: updatedTask.title,
          },
        });
      }
    }

    if (priority !== undefined && priority !== task.priority) {
      await logActivity({
        organizationId: orgId,
        projectId,
        taskId: id,
        userId,
        action: 'task_priority_changed',
        metadata: {
          task_title: updatedTask.title,
          old_priority: task.priority,
          new_priority: priority,
        },
      });

      const priorityRecipients = getTaskParticipants();
      for (const recId of priorityRecipients) {
        await createNotification({
          dbClient,
          userId: recId,
          organizationId: orgId,
          type: 'task_priority_changed',
          title: `${actorName} updated priority of "${updatedTask.title}"`,
          message: `Priority changed from ${task.priority} to ${priority}.`,
          entityType: 'task',
          entityId: id,
          actorId: userId,
          metadata: {
            taskId: id,
            projectId,
            oldPriority: task.priority,
            newPriority: priority,
            taskTitle: updatedTask.title,
          },
        });
      }
    }

    if (assigned_to !== undefined && assigned_to !== task.assigned_to) {
      if (assigned_to === null) {
        await logActivity({
          organizationId: orgId,
          projectId,
          taskId: id,
          userId,
          action: 'task_unassigned',
          metadata: {
            task_title: updatedTask.title,
            previous_assignee: task.assignee?.full_name || 'Team member',
          },
        });

        // Notify previous assignee
        if (task.assigned_to && task.assigned_to !== userId) {
          await createNotification({
            dbClient,
            userId: task.assigned_to,
            organizationId: orgId,
            type: 'task_unassigned',
            title: `${actorName} unassigned you from a task`,
            message: `You were removed from "${updatedTask.title}".`,
            entityType: 'task',
            entityId: id,
            actorId: userId,
            metadata: { taskId: id, projectId, taskTitle: updatedTask.title },
          });
        }
      } else {
        await logActivity({
          organizationId: orgId,
          projectId,
          taskId: id,
          userId,
          action: 'task_assigned',
          metadata: {
            task_title: updatedTask.title,
            assignee_id: assigned_to,
            assignee_name: newAssigneeProfile?.full_name || 'Team member',
          },
        });

        // Notify new assignee
        if (assigned_to !== userId) {
          await createNotification({
            dbClient,
            userId: assigned_to,
            organizationId: orgId,
            type: 'task_assigned',
            title: `${actorName} assigned you a task`,
            message: `You were assigned to "${updatedTask.title}".`,
            entityType: 'task',
            entityId: id,
            actorId: userId,
            metadata: { taskId: id, projectId, taskTitle: updatedTask.title },
          });
        }

        // Also notify previous assignee if different
        if (task.assigned_to && task.assigned_to !== userId && task.assigned_to !== assigned_to) {
          await createNotification({
            dbClient,
            userId: task.assigned_to,
            organizationId: orgId,
            type: 'task_unassigned',
            title: `${actorName} unassigned you from a task`,
            message: `You were removed from "${updatedTask.title}".`,
            entityType: 'task',
            entityId: id,
            actorId: userId,
            metadata: { taskId: id, projectId, taskTitle: updatedTask.title },
          });
        }
      }
    }

    if (due_date !== undefined && due_date !== task.due_date) {
      await logActivity({
        organizationId: orgId,
        projectId,
        taskId: id,
        userId,
        action: 'task_due_date_changed',
        metadata: {
          task_title: updatedTask.title,
          old_due_date: task.due_date,
          new_due_date: due_date,
        },
      });
    }

    if ((title !== undefined && title !== task.title) || (description !== undefined && description !== task.description)) {
      await logActivity({
        organizationId: orgId,
        projectId,
        taskId: id,
        userId,
        action: 'task_updated',
        metadata: {
          task_title: updatedTask.title,
          title_changed: title !== undefined && title !== task.title,
          description_changed: description !== undefined && description !== task.description,
        },
      });

      // Notify participants if this was a standalone details update
      if (status === undefined && priority === undefined && assigned_to === undefined) {
        const updateRecipients = getTaskParticipants();
        for (const recId of updateRecipients) {
          await createNotification({
            dbClient,
            userId: recId,
            organizationId: orgId,
            type: 'task_updated',
            title: `${actorName} updated "${updatedTask.title}"`,
            message: `Task details were updated.`,
            entityType: 'task',
            entityId: id,
            actorId: userId,
            metadata: {
              taskId: id,
              projectId,
              taskTitle: updatedTask.title,
            },
          });
        }
      }
    }

    const [hydratedTask] = await hydrateTaskProfiles(dbClient, [updatedTask]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: hydratedTask || updatedTask,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task and log task_deleted activity
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const dbClient = getUserClient(req.token) || supabase;

    const { data: task } = await dbClient
      .from('tasks')
      .select(`
        title,
        created_by,
        project_id,
        project:projects (
          organization_id
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const orgId = task.project?.organization_id;
    const projectId = task.project_id;

    const { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    const { data: projMember } = await dbClient
      .from('project_members')
      .select('project_role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    const isCreator = task.created_by === userId;
    const isAuthorized =
      isCreator ||
      orgMember?.role === 'admin' ||
      orgMember?.role === 'project_manager' ||
      projMember?.project_role === 'manager';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to delete this task',
      });
    }

    // 1. Log activity before deletion (with task_id set to null or retained in metadata)
    await logActivity({
      organizationId: orgId,
      projectId,
      taskId: null,
      userId,
      action: 'task_deleted',
      metadata: {
        task_title: task.title,
      },
    });

    // 2. Delete task
    const { error: delErr } = await dbClient
      .from('tasks')
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
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
