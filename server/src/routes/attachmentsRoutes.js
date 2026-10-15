/**
 * Attachments & File Management Router
 * Handles task and workspace file uploads, metadata storage, signed URL generation, and Supabase Storage synchronization.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase, getUserClient } = require('../config/supabase');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');

const router = express.Router({ mergeParams: true });

// Protect all attachment routes with Supabase JWT authentication
router.use(authMiddleware);

const BUCKET_NAME = 'flow-sync-attachments';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.zip'];
const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.bin', '.vbs', '.ps1'];

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
 * Helper to validate file extension
 */
function isFileExtensionAllowed(fileName) {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  const isBlocked = DISALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (isBlocked) return false;
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Helper to generate signed URLs for private bucket objects (for inline view and direct download)
 */
async function generateSignedUrls(dbClient, storagePath, fileName, expiresIn = 86400) {
  if (!storagePath) return { viewUrl: null, downloadUrl: null };
  try {
    const client = dbClient?.storage ? dbClient : supabase;
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.warn('createSignedUrl notice for path', storagePath, ':', error.message);
      return { viewUrl: null, downloadUrl: null };
    }

    const viewUrl = data?.signedUrl || null;
    const downloadUrl = viewUrl
      ? (fileName ? `${viewUrl}&download=${encodeURIComponent(fileName)}` : `${viewUrl}&download=true`)
      : null;

    return { viewUrl, downloadUrl };
  } catch (err) {
    console.warn('generateSignedUrls exception:', err.message);
    return { viewUrl: null, downloadUrl: null };
  }
}

/**
 * Backwards-compatible helper for single signed URL
 */
async function generateSignedUrl(dbClient, storagePath, expiresIn = 86400) {
  const { downloadUrl, viewUrl } = await generateSignedUrls(dbClient, storagePath, null, expiresIn);
  return downloadUrl || viewUrl;
}


/**
 * Helper: Hydrate uploader profiles for attachments
 */
async function hydrateAttachmentProfiles(dbClient, attachmentsList) {
  if (!attachmentsList || attachmentsList.length === 0) return [];
  const userIds = [...new Set(attachmentsList.map((a) => a.uploaded_by).filter(Boolean))];

  let profileMap = new Map();
  if (userIds.length > 0) {
    try {
      const { data: profiles } = await dbClient
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p) => profileMap.set(p.id, p));
      }
    } catch (e) {
      console.warn('Could not hydrate attachment profiles:', e.message);
    }
  }

  return attachmentsList.map((att) => {
    const uploader = profileMap.get(att.uploaded_by);
    return {
      ...att,
      uploader: uploader || null,
      uploaderName: uploader?.full_name || 'Team Member',
      uploaderUsername: uploader?.username,
      uploaderAvatarUrl: uploader?.avatar_url,
    };
  });
}

/**
 * GET /api/tasks/:taskId/attachments
 * List all attachments for a task
 */
router.get('/tasks/:taskId/attachments', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const cleanTaskId = cleanUuid(req.params.taskId);

    // 1. Verify task access
    const { data: task, error: taskErr } = await dbClient
      .from('tasks')
      .select('id, project:projects ( id, organization_id )')
      .eq('id', cleanTaskId)
      .maybeSingle();

    if (taskErr || !task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const orgId = task.project?.organization_id;

    // Verify caller org membership
    let { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      const { data: orgCheck } = await dbClient
        .from('organizations')
        .select('id, created_by')
        .eq('id', orgId)
        .maybeSingle();

      if (orgCheck && orgCheck.created_by === userId) {
        orgMember = { role: 'owner' };
      }
    }

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this task',
      });
    }

    // 2. Fetch attachments
    const { data: attachments, error } = await dbClient
      .from('attachments')
      .select('*')
      .eq('task_id', cleanTaskId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const hydratedList = await hydrateAttachmentProfiles(dbClient, attachments || []);

    // 3. Attach signed URLs
    const formatted = await Promise.all(
      hydratedList.map(async (att) => {
        const { viewUrl, downloadUrl } = await generateSignedUrls(dbClient, att.storage_path, att.file_name);
        return {
          id: att.id,
          organizationId: att.organization_id,
          projectId: att.project_id,
          taskId: att.task_id,
          fileName: att.file_name,
          storagePath: att.storage_path,
          fileSize: att.file_size,
          mimeType: att.mime_type,
          createdAt: att.created_at,
          uploaderName: att.uploaderName,
          uploaderUsername: att.uploaderUsername,
          uploaderAvatarUrl: att.uploaderAvatarUrl,
          isUploader: att.uploaded_by === userId,
          viewUrl,
          downloadUrl: downloadUrl || viewUrl,
        };
      })
    );

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
 * POST /api/tasks/:taskId/attachments
 * Register a newly uploaded task attachment metadata
 */
router.post('/tasks/:taskId/attachments', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const cleanTaskId = cleanUuid(req.params.taskId);
    const { fileName, storagePath, fileSize, mimeType } = req.body;

    if (!fileName || !storagePath || !fileSize) {
      return res.status(400).json({
        success: false,
        message: 'File name, storage path, and file size are required',
      });
    }

    if (!isFileExtensionAllowed(fileName)) {
      return res.status(400).json({
        success: false,
        message: 'File type is not permitted. Allowed types: PDF, DOC, DOCX, TXT, PNG, JPG, WEBP, ZIP',
      });
    }

    if (Number(fileSize) > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum file size is 10 MB.',
      });
    }

    // 1. Verify task and organization access
    const { data: task, error: taskErr } = await dbClient
      .from('tasks')
      .select('id, title, project_id, assigned_to, created_by, project:projects ( id, name, organization_id )')
      .eq('id', cleanTaskId)
      .maybeSingle();

    if (taskErr || !task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const orgId = task.project?.organization_id;
    const projectId = task.project_id;

    // Verify caller org membership (Viewers cannot upload)
    let { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      const { data: orgCheck } = await dbClient
        .from('organizations')
        .select('id, created_by')
        .eq('id', orgId)
        .maybeSingle();

      if (orgCheck && orgCheck.created_by === userId) {
        orgMember = { role: 'owner' };
      }
    }

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this task',
      });
    }

    if (orgMember.role === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Viewers do not have upload permissions',
      });
    }

    // 2. Insert attachment record
    const { data: newAttachment, error: insertErr } = await dbClient
      .from('attachments')
      .insert({
        organization_id: orgId,
        project_id: projectId,
        task_id: cleanTaskId,
        uploaded_by: userId,
        file_name: fileName.trim(),
        storage_path: storagePath.trim(),
        file_size: Number(fileSize),
        mime_type: mimeType || 'application/octet-stream',
      })
      .select('*')
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    const hydratedList = await hydrateAttachmentProfiles(dbClient, [newAttachment]);
    const hydrated = hydratedList[0] || newAttachment;

    // 3. Log activity
    await logActivity({
      organizationId: orgId,
      projectId,
      taskId: cleanTaskId,
      userId,
      action: 'attachment_uploaded',
      metadata: {
        task_title: task.title,
        file_name: hydrated.file_name,
        file_size: hydrated.file_size,
        mime_type: hydrated.mime_type,
      },
    });

    // 4. Notify task participants (assignee and creator)
    const notifRecipients = new Set();
    if (task.assigned_to && task.assigned_to !== userId) notifRecipients.add(task.assigned_to);
    if (task.created_by && task.created_by !== userId) notifRecipients.add(task.created_by);

    for (const recId of notifRecipients) {
      createNotification({
        dbClient,
        userId: recId,
        organizationId: orgId,
        type: 'file_uploaded',
        title: `${hydrated.uploaderName || 'A team member'} attached a file`,
        message: `Attached "${hydrated.file_name}" to "${task.title}".`,
        entityType: 'task',
        entityId: cleanTaskId,
        actorId: userId,
        metadata: {
          taskId: cleanTaskId,
          projectId,
          fileName: hydrated.file_name,
          attachmentId: hydrated.id,
          taskTitle: task.title,
        },
      }).catch((e) => console.warn('[ATTACHMENTS] Notification error:', e.message));
    }

    const { viewUrl, downloadUrl } = await generateSignedUrls(dbClient, hydrated.storage_path, hydrated.file_name);

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        id: hydrated.id,
        organizationId: hydrated.organization_id,
        projectId: hydrated.project_id,
        taskId: hydrated.task_id,
        fileName: hydrated.file_name,
        storagePath: hydrated.storage_path,
        fileSize: hydrated.file_size,
        mimeType: hydrated.mime_type,
        createdAt: hydrated.created_at,
        uploaderName: hydrated.uploaderName,
        uploaderUsername: hydrated.uploaderUsername,
        uploaderAvatarUrl: hydrated.uploaderAvatarUrl,
        isUploader: true,
        viewUrl,
        downloadUrl: downloadUrl || viewUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/attachments
 * Upload / register a workspace-level attachment
 */
router.post('/attachments', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const { organizationId, projectId, taskId, fileName, storagePath, fileSize, mimeType } = req.body;

    if (!fileName || !storagePath || !fileSize) {
      return res.status(400).json({
        success: false,
        message: 'File name, storage path, and file size are required',
      });
    }

    if (!isFileExtensionAllowed(fileName)) {
      return res.status(400).json({
        success: false,
        message: 'File type is not permitted. Allowed types: PDF, DOC, DOCX, TXT, PNG, JPG, WEBP, ZIP',
      });
    }

    if (Number(fileSize) > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum file size is 10 MB.',
      });
    }

    const cleanOrgId = cleanUuid(organizationId);
    if (!cleanOrgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    // 1. Verify caller org membership (Viewers cannot upload)
    let { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', cleanOrgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      const { data: orgCheck } = await dbClient
        .from('organizations')
        .select('id, created_by')
        .eq('id', cleanOrgId)
        .maybeSingle();

      if (orgCheck && orgCheck.created_by === userId) {
        orgMember = { role: 'owner' };
      }
    }

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this organization',
      });
    }

    if (orgMember.role === 'viewer') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Viewers do not have upload permissions',
      });
    }

    // 2. Validate project
    const cleanProjId = cleanUuid(projectId);
    if (!cleanProjId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    const { data: project, error: projErr } = await dbClient
      .from('projects')
      .select('id, organization_id, name, color')
      .eq('id', cleanProjId)
      .maybeSingle();

    if (projErr || !project || project.organization_id !== cleanOrgId) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in this organization',
      });
    }

    // 3. Resolve or find task_id
    let resolvedTaskId = cleanUuid(taskId);
    let resolvedTaskTitle = 'Project Files & Assets';

    if (resolvedTaskId) {
      const { data: taskCheck } = await dbClient
        .from('tasks')
        .select('id, project_id, title')
        .eq('id', resolvedTaskId)
        .maybeSingle();

      if (!taskCheck || taskCheck.project_id !== cleanProjId) {
        return res.status(404).json({
          success: false,
          message: 'Specified task not found in this project',
        });
      }
      resolvedTaskTitle = taskCheck.title;
    } else {
      // Find existing task or auto-create default container task
      const { data: existingTasks } = await dbClient
        .from('tasks')
        .select('id, title')
        .eq('project_id', cleanProjId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingTasks && existingTasks.length > 0) {
        resolvedTaskId = existingTasks[0].id;
        resolvedTaskTitle = existingTasks[0].title;
      } else {
        const { data: defaultTask, error: defTaskErr } = await dbClient
          .from('tasks')
          .insert({
            project_id: cleanProjId,
            title: 'Project Files & Assets',
            description: 'Default container for files uploaded directly from the Files library.',
            status: 'todo',
            priority: 'medium',
            created_by: userId,
          })
          .select('id, title')
          .single();

        if (defTaskErr) {
          console.warn('Could not auto-create default task for attachment:', defTaskErr.message);
        } else if (defaultTask) {
          resolvedTaskId = defaultTask.id;
          resolvedTaskTitle = defaultTask.title;
        }
      }
    }

    // 4. Insert attachment record
    const { data: newAttachment, error: insertErr } = await dbClient
      .from('attachments')
      .insert({
        organization_id: cleanOrgId,
        project_id: cleanProjId,
        task_id: resolvedTaskId,
        uploaded_by: userId,
        file_name: fileName.trim(),
        storage_path: storagePath.trim(),
        file_size: Number(fileSize),
        mime_type: mimeType || 'application/octet-stream',
      })
      .select('*, project:projects ( id, name, color ), task:tasks ( id, title )')
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    // 5. Hydrate uploader profile
    const hydratedList = await hydrateAttachmentProfiles(dbClient, [newAttachment]);
    const hydrated = hydratedList[0] || newAttachment;

    // 6. Log activity
    await logActivity({
      organizationId: cleanOrgId,
      projectId: cleanProjId,
      taskId: resolvedTaskId,
      userId,
      action: 'attachment_uploaded',
      metadata: {
        file_name: hydrated.file_name,
        file_size: hydrated.file_size,
        mime_type: hydrated.mime_type,
        project_name: project.name,
        task_title: resolvedTaskTitle,
      },
    });

    // 7. Notify task participants if uploaded under a task
    if (resolvedTaskId) {
      const { data: targetTask } = await dbClient
        .from('tasks')
        .select('id, title, assigned_to, created_by')
        .eq('id', resolvedTaskId)
        .maybeSingle();

      if (targetTask) {
        const notifRecipients = new Set();
        if (targetTask.assigned_to && targetTask.assigned_to !== userId) notifRecipients.add(targetTask.assigned_to);
        if (targetTask.created_by && targetTask.created_by !== userId) notifRecipients.add(targetTask.created_by);

        for (const recId of notifRecipients) {
          createNotification({
            dbClient,
            userId: recId,
            organizationId: cleanOrgId,
            type: 'file_uploaded',
            title: `${hydrated.uploaderName || 'A team member'} uploaded a file`,
            message: `Uploaded "${hydrated.file_name}" to "${targetTask.title}".`,
            entityType: 'task',
            entityId: resolvedTaskId,
            actorId: userId,
            metadata: {
              taskId: resolvedTaskId,
              projectId: cleanProjId,
              fileName: hydrated.file_name,
              attachmentId: hydrated.id,
              taskTitle: targetTask.title,
            },
          }).catch((e) => console.warn('[ATTACHMENTS] Notification error:', e.message));
        }
      }
    }

    const { viewUrl, downloadUrl } = await generateSignedUrls(dbClient, hydrated.storage_path, hydrated.file_name);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: hydrated.id,
        organizationId: hydrated.organization_id,
        projectId: hydrated.project_id,
        projectName: hydrated.project?.name || project.name,
        projectColor: hydrated.project?.color || project.color,
        taskId: hydrated.task_id,
        taskTitle: hydrated.task?.title || resolvedTaskTitle,
        fileName: hydrated.file_name,
        storagePath: hydrated.storage_path,
        fileSize: hydrated.file_size,
        mimeType: hydrated.mime_type,
        createdAt: hydrated.created_at,
        uploaderName: hydrated.uploaderName,
        uploaderUsername: hydrated.uploaderUsername,
        uploaderAvatarUrl: hydrated.uploaderAvatarUrl,
        isUploader: true,
        viewUrl,
        downloadUrl: downloadUrl || viewUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/attachments/:id
 * Retrieve a single attachment and fresh signed download URL
 */
router.get('/attachments/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const cleanId = cleanUuid(req.params.id);

    const { data: attachment, error } = await dbClient
      .from('attachments')
      .select('*, project:projects ( id, name, color ), task:tasks ( id, title )')
      .eq('id', cleanId)
      .maybeSingle();

    if (error || !attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    // Verify organization membership
    let { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', attachment.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      const { data: orgCheck } = await dbClient
        .from('organizations')
        .select('id, created_by')
        .eq('id', attachment.organization_id)
        .maybeSingle();

      if (orgCheck && orgCheck.created_by === userId) {
        orgMember = { role: 'owner' };
      }
    }

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied',
      });
    }

    const hydratedList = await hydrateAttachmentProfiles(dbClient, [attachment]);
    const hydrated = hydratedList[0] || attachment;

    const { viewUrl, downloadUrl } = await generateSignedUrls(dbClient, hydrated.storage_path, hydrated.file_name);

    res.json({
      success: true,
      data: {
        id: hydrated.id,
        organizationId: hydrated.organization_id,
        projectId: hydrated.project_id,
        projectName: hydrated.project?.name || 'Project',
        projectColor: hydrated.project?.color,
        taskId: hydrated.task_id,
        taskTitle: hydrated.task?.title || 'Task',
        fileName: hydrated.file_name,
        storagePath: hydrated.storage_path,
        fileSize: hydrated.file_size,
        mimeType: hydrated.mime_type,
        createdAt: hydrated.created_at,
        uploaderName: hydrated.uploaderName,
        uploaderUsername: hydrated.uploaderUsername,
        uploaderAvatarUrl: hydrated.uploaderAvatarUrl,
        isUploader: hydrated.uploaded_by === userId,
        viewUrl,
        downloadUrl: downloadUrl || viewUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/attachments/:id
 * Delete an attachment from Supabase Storage and PostgreSQL metadata
 */
router.delete('/attachments/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const cleanId = cleanUuid(req.params.id);

    // 1. Fetch attachment
    const { data: attachment, error: fetchErr } = await dbClient
      .from('attachments')
      .select('*, task:tasks ( id, title )')
      .eq('id', cleanId)
      .maybeSingle();

    if (fetchErr || !attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    const orgId = attachment.organization_id;

    // 2. Check authorization: Uploader or Org Admin/Owner
    let { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    let isOwner = false;
    if (!orgMember) {
      const { data: orgCheck } = await dbClient
        .from('organizations')
        .select('id, created_by')
        .eq('id', orgId)
        .maybeSingle();

      if (orgCheck && orgCheck.created_by === userId) {
        orgMember = { role: 'owner' };
        isOwner = true;
      }
    }

    const isUploader = attachment.uploaded_by === userId;
    const isOrgAdmin = orgMember?.role === 'admin' || orgMember?.role === 'owner' || isOwner;

    if (!isUploader && !isOrgAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete attachments you uploaded',
      });
    }

    // 3. Remove file object from Supabase Storage
    try {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([attachment.storage_path]);
    } catch (storageErr) {
      console.warn('Storage remove notice:', storageErr.message);
    }

    // 4. Delete row from attachments table
    const { error: delErr } = await dbClient
      .from('attachments')
      .delete()
      .eq('id', cleanId);

    if (delErr) {
      return res.status(400).json({
        success: false,
        message: delErr.message,
      });
    }

    // 5. Log activity
    await logActivity({
      organizationId: orgId,
      projectId: attachment.project_id,
      taskId: attachment.task_id,
      userId,
      action: 'attachment_deleted',
      metadata: {
        task_title: attachment.task?.title,
        file_name: attachment.file_name,
      },
    });

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/attachments
 * List all workspace files for the /files page
 */
router.get('/attachments', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token) || supabase;
    const { organizationId, projectId, search, type } = req.query;

    const cleanOrgId = cleanUuid(organizationId);
    if (!cleanOrgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    // Verify caller org membership or ownership
    let { data: orgMember } = await dbClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', cleanOrgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      const { data: orgCheck } = await dbClient
        .from('organizations')
        .select('id, created_by')
        .eq('id', cleanOrgId)
        .maybeSingle();

      if (orgCheck && orgCheck.created_by === userId) {
        orgMember = { role: 'owner' };
      }
    }

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this organization',
      });
    }

    let query = dbClient
      .from('attachments')
      .select(`
        *,
        project:projects (
          id,
          name,
          color
        ),
        task:tasks (
          id,
          title
        )
      `)
      .eq('organization_id', cleanOrgId)
      .order('created_at', { ascending: false });

    if (projectId && projectId !== 'ALL') {
      const cleanProjId = cleanUuid(projectId);
      if (cleanProjId) {
        query = query.eq('project_id', cleanProjId);
      }
    }

    if (search && search.trim()) {
      query = query.ilike('file_name', `%${search.trim()}%`);
    }

    const { data: attachments, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const hydratedList = await hydrateAttachmentProfiles(dbClient, attachments || []);

    const formatted = await Promise.all(
      hydratedList.map(async (att) => {
        const { viewUrl, downloadUrl } = await generateSignedUrls(dbClient, att.storage_path, att.file_name);
        return {
          id: att.id,
          organizationId: att.organization_id,
          projectId: att.project_id,
          projectName: att.project?.name || 'Project',
          projectColor: att.project?.color,
          taskId: att.task_id,
          taskTitle: att.task?.title || 'Task',
          fileName: att.file_name,
          storagePath: att.storage_path,
          fileSize: att.file_size,
          mimeType: att.mime_type,
          createdAt: att.created_at,
          uploaderName: att.uploaderName,
          uploaderUsername: att.uploaderUsername,
          uploaderAvatarUrl: att.uploaderAvatarUrl,
          isUploader: att.uploaded_by === userId,
          viewUrl,
          downloadUrl: downloadUrl || viewUrl,
        };
      })
    );

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
