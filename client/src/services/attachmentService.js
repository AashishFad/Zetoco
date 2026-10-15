/**
 * Attachment Service
 * Handles uploading files to Supabase Storage and managing attachment metadata via backend API.
 */
import apiClient from './api';
import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'flow-sync-attachments';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.zip',
];

export const DISALLOWED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.dll',
  '.bin',
  '.vbs',
  '.ps1',
];

/**
 * Validate if a file is acceptable for upload
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const name = file.name || '';
  const lowerName = name.toLowerCase();

  // Check disallowed
  const isBlocked = DISALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (isBlocked) {
    return {
      valid: false,
      error: `Executable or script files are not allowed for security reasons.`,
    };
  }

  // Check allowed
  const isAllowed = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!isAllowed) {
    return {
      valid: false,
      error: `Unsupported file type. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Format bytes to readable size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Upload a file directly to Supabase Storage and register metadata on the backend
 */
export async function uploadTaskAttachment({
  organizationId,
  projectId,
  taskId,
  file,
  onProgress,
}) {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!organizationId || !projectId || !taskId) {
    throw new Error('Missing required organization, project, or task context');
  }

  // Generate safe unique filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${cleanName}`;
  const storagePath = `organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/${uniqueName}`;

  // 1. Upload to Supabase Storage private bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 2. Register metadata via backend API (creates activity log & returns signed URL)
  const response = await apiClient.post(`/tasks/${taskId}/attachments`, {
    fileName: file.name,
    storagePath,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  });

  return response.data;
}

/**
 * Get all attachments for a task
 */
export async function getTaskAttachments(taskId) {
  const response = await apiClient.get(`/tasks/${taskId}/attachments`);
  return response.data || [];
}

/**
 * Get a single attachment by ID (with signed download URL)
 */
export async function getAttachment(attachmentId) {
  const response = await apiClient.get(`/attachments/${attachmentId}`);
  return response.data;
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId) {
  const response = await apiClient.delete(`/attachments/${attachmentId}`);
  return response;
}

/**
 * Get workspace file attachments with search and filter
 */
export async function getWorkspaceAttachments({ organizationId, projectId, search, type } = {}) {
  const params = {};
  if (organizationId) params.organizationId = organizationId;
  if (projectId) params.projectId = projectId;
  if (search) params.search = search;
  if (type) params.type = type;

  const response = await apiClient.get('/attachments', { params });
  return response.data || [];
}

/**
 * Upload a file directly to Supabase Storage and register metadata for the workspace
 */
export async function uploadWorkspaceAttachment({
  organizationId,
  projectId,
  taskId,
  file,
  onProgress,
}) {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!organizationId || !projectId) {
    throw new Error('Missing required organization or project context');
  }

  // Generate safe unique filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${cleanName}`;
  const folder = taskId ? `tasks/${taskId}` : 'files';
  const storagePath = `organizations/${organizationId}/projects/${projectId}/${folder}/${uniqueName}`;

  // 1. Upload to Supabase Storage private bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 2. Register metadata via backend API
  const response = await apiClient.post('/attachments', {
    organizationId,
    projectId,
    taskId: taskId || null,
    fileName: file.name,
    storagePath,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  });

  return response.data;
}

/**
 * Safely trigger a file download from a signed URL in the browser
 */
export async function downloadFile(url, fileName) {
  if (!url) {
    console.warn('downloadFile: No URL provided');
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window.open / link:', err.message);
    const downloadUrl = url.includes('download=')
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(fileName || 'download')}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Retrieve fresh download and view URLs for an attachment
 */
export async function getAttachmentDownloadUrl(attachmentId) {
  const data = await getAttachment(attachmentId);
  return {
    viewUrl: data?.viewUrl || data?.downloadUrl || null,
    downloadUrl: data?.downloadUrl || data?.viewUrl || null,
    fileName: data?.fileName || 'download',
  };
}

export default {
  uploadTaskAttachment,
  uploadWorkspaceAttachment,
  getTaskAttachments,
  getAttachment,
  getAttachmentDownloadUrl,
  deleteAttachment,
  getWorkspaceAttachments,
  downloadFile,
  validateFile,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
};


