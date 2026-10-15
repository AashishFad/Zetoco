/**
 * Comments & Task Activity Router
 * Handles task comments CRUD and task activity history retrieval.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase, getUserClient } = require('../config/supabase');
const { createNotification } = require('../services/notificationService');

const router = express.Router({ mergeParams: true });

// Protect all comment endpoints with Supabase JWT authentication
router.use(authMiddleware);

/**
 * Helper: Clean and normalize UUID strings
 */
const cleanUuid = (val) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
    return `${trimmed.slice(0, 8)}-${trimmed.slice(8, 12)}-${trimmed.slice(12, 16)}-${trimmed.slice(16, 20)}-${trimmed.slice(20)}`;
  }
  return trimmed;
};

/**
 * Helper: Hydrate author profiles for a list of comments
 */
const hydrateCommentAuthors = async (dbClient, commentsList, currentUserId) => {
  if (!commentsList || commentsList.length === 0) return [];
  const userIds = new Set();
  commentsList.forEach((c) => {
    if (c.user_id) userIds.add(c.user_id);
  });

  let profileMap = new Map();
  if (userIds.size > 0) {
    try {
      const { data: profiles } = await dbClient
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate comment authors in server:', e.message);
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
      isAuthor: c.user_id === currentUserId,
    };
  });
};

/**
 * Helper: Hydrate actor profiles for activity logs
 */
const hydrateActivityActors = async (dbClient, activityList) => {
  if (!activityList || activityList.length === 0) return [];
  const userIds = new Set();
  activityList.forEach((l) => {
    if (l.user_id) userIds.add(l.user_id);
  });

  let profileMap = new Map();
  if (userIds.size > 0) {
    try {
      const { data: profiles } = await dbClient
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate activity actors in server:', e.message);
    }
  }

  return activityList.map((l) => {
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
};

/**
 * Helper: Resolve task, project, and organization access
 */
const resolveTaskAndOrg = async (dbClient, rawTaskId, userId) => {
  const taskId = cleanUuid(rawTaskId);
  if (!taskId) return { error: 'Invalid task ID', status: 400 };

  const { data: task, error: taskErr } = await dbClient
    .from('tasks')
    .select('id, title, assigned_to, created_by, project_id')
    .eq('id', taskId)
    .maybeSingle();

  if (taskErr || !task) {
    return { error: 'Task not found', status: 404 };
  }

  if (!task.project_id) {
    return { error: 'Task is not attached to a valid project', status: 400 };
  }

  const { data: project, error: projErr } = await dbClient
    .from('projects')
    .select('id, name, organization_id')
    .eq('id', task.project_id)
    .maybeSingle();

  if (projErr || !project || !project.organization_id) {
    return { error: 'Project or workspace organization not found', status: 404 };
  }

  const orgId = project.organization_id;

  // Verify membership in organization
  const { data: orgMember } = await dbClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  let isAuthorized = Boolean(orgMember);
  if (!isAuthorized) {
    const { data: org } = await dbClient
      .from('organizations')
      .select('created_by')
      .eq('id', orgId)
      .maybeSingle();
    if (org?.created_by === userId) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return { error: 'Forbidden: Access denied to this task', status: 403 };
  }

  return {
    task,
    project,
    orgId,
    orgRole: orgMember?.role || 'member',
  };
};

/**
 * GET /api/tasks/:taskId/comments
 * Retrieve comments for a task (oldest to newest)
 */
router.get('/tasks/:taskId/comments', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const dbClient = getUserClient(req.token) || supabase;

    const access = await resolveTaskAndOrg(dbClient, taskId, userId);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    const cleanId = access.task.id;

    // Fetch comments
    const { data: comments, error } = await dbClient
      .from('comments')
      .select('*')
      .eq('task_id', cleanId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[COMMENTS] Error fetching comments from DB:', error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const formatted = await hydrateCommentAuthors(dbClient, comments || [], userId);

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
 * POST /api/tasks/:taskId/comments
 * Add a comment to a task
 */
router.post('/tasks/:taskId/comments', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { content } = req.body;
    const dbClient = getUserClient(req.token) || supabase;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty',
      });
    }

    const access = await resolveTaskAndOrg(dbClient, taskId, userId);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    const { task, orgId } = access;
    const cleanId = task.id;

    // 2. Insert comment into database
    const { data: newComment, error: insertErr } = await dbClient
      .from('comments')
      .insert({
        task_id: cleanId,
        user_id: userId,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('[COMMENTS] Error inserting comment into DB:', insertErr);
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    // 3. Fetch author profile
    const { data: authorProfile } = await dbClient
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const authorName = authorProfile?.full_name || 'Team Member';

    // 4. Notify task assignee and creator (excluding comment author)
    const recipientIds = new Set();
    if (task.assigned_to && task.assigned_to !== userId) recipientIds.add(task.assigned_to);
    if (task.created_by && task.created_by !== userId) recipientIds.add(task.created_by);

    for (const recipientId of recipientIds) {
      createNotification({
        dbClient,
        userId: recipientId,
        organizationId: orgId,
        type: 'comment_added',
        title: `${authorName} commented on "${task.title || 'a task'}"`,
        message: content.length > 90 ? content.substring(0, 90) + '...' : content,
        entityType: 'task',
        entityId: cleanId,
        actorId: userId,
        metadata: {
          taskId: cleanId,
          commentId: newComment.id,
          taskTitle: task.title,
          projectId: task.project_id,
        },
      }).catch((notifErr) => console.warn('[COMMENTS] Notification error:', notifErr.message));
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        id: newComment.id,
        taskId: newComment.task_id,
        userId: newComment.user_id,
        content: newComment.content,
        createdAt: newComment.created_at,
        updatedAt: newComment.updated_at,
        authorName,
        authorUsername: authorProfile?.username || null,
        authorAvatarUrl: authorProfile?.avatar_url || null,
        isAuthor: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/comments/:commentId
 * Edit comment content (Author only)
 */
router.patch('/comments/:commentId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { content } = req.body;
    const dbClient = getUserClient(req.token) || supabase;
    const cleanId = cleanUuid(commentId);

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty',
      });
    }

    // Fetch comment to verify ownership
    const { data: comment, error: fetchErr } = await dbClient
      .from('comments')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    if (fetchErr || !comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own comments',
      });
    }

    const { data: updatedComment, error: updateErr } = await dbClient
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', cleanId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[COMMENTS] Error updating comment:', updateErr);
      return res.status(400).json({
        success: false,
        message: updateErr.message,
      });
    }

    const { data: authorProfile } = await dbClient
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        id: updatedComment.id,
        taskId: updatedComment.task_id,
        userId: updatedComment.user_id,
        content: updatedComment.content,
        createdAt: updatedComment.created_at,
        updatedAt: updatedComment.updated_at,
        authorName: authorProfile?.full_name || 'Team Member',
        authorUsername: authorProfile?.username || null,
        authorAvatarUrl: authorProfile?.avatar_url || null,
        isAuthor: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/comments/:commentId
 * Delete a comment (Author only or Org Admin)
 */
router.delete('/comments/:commentId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const dbClient = getUserClient(req.token) || supabase;
    const cleanId = cleanUuid(commentId);

    const { data: comment, error: fetchErr } = await dbClient
      .from('comments')
      .select('id, user_id, task_id')
      .eq('id', cleanId)
      .maybeSingle();

    if (fetchErr || !comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const isAuthor = comment.user_id === userId;
    let isOrgAdmin = false;

    if (!isAuthor && comment.task_id) {
      const access = await resolveTaskAndOrg(dbClient, comment.task_id, userId);
      if (!access.error && access.orgRole === 'admin') {
        isOrgAdmin = true;
      }
    }

    if (!isAuthor && !isOrgAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own comments',
      });
    }

    const { error: delErr } = await dbClient
      .from('comments')
      .delete()
      .eq('id', cleanId);

    if (delErr) {
      console.error('[COMMENTS] Error deleting comment:', delErr);
      return res.status(400).json({
        success: false,
        message: delErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:taskId/activity
 * Retrieve activity history for a task (newest to oldest)
 */
router.get('/tasks/:taskId/activity', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const dbClient = getUserClient(req.token) || supabase;

    const access = await resolveTaskAndOrg(dbClient, taskId, userId);
    if (access.error) {
      return res.status(access.status).json({ success: false, message: access.error });
    }

    const cleanId = access.task.id;

    const { data: logs, error } = await dbClient
      .from('activity_logs')
      .select('*')
      .eq('task_id', cleanId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ACTIVITY] Error fetching activity logs:', error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const formatted = await hydrateActivityActors(dbClient, logs || []);

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
