import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Input, Textarea, Select, Button, Badge, Avatar, useToast } from '../ui';
import {
  Calendar,
  User,
  Trash2,
  Save,
  Clock,
  CheckCircle2,
  FolderKanban,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Edit3,
  Send,
  History,
  Activity as ActivityIcon,
  Check,
  X,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import * as taskService from '../../services/taskService';
import * as commentService from '../../services/commentService';
import * as activityService from '../../services/activityService';
import * as attachmentService from '../../services/attachmentService';
import { formatRelativeTime, formatActivityMessage } from '../../utils/activityFormatter';
import AttachmentUploadZone from '../attachments/AttachmentUploadZone';
import AttachmentCard from '../attachments/AttachmentCard';
import ImagePreviewModal from '../attachments/ImagePreviewModal';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function TaskDetailsModal({
  isOpen,
  onClose,
  task,
  projectMembers = [],
  onTaskUpdated,
  onTaskDeleted,
  canEdit = true,
  canDelete = true,
}) {
  const { user, currentOrg } = useAuth();
  const { members: orgMembers } = useOrganization();
  const { addToast } = useToast();

  const availableAssignees = useMemo(() => {
    const userMap = new Map();
    (orgMembers || []).filter(Boolean).forEach((m) => {
      const id = m.userId || m.user_id || m.id;
      if (id) userMap.set(id, m);
    });
    (projectMembers || []).filter(Boolean).forEach((m) => {
      const id = m.userId || m.user_id || m.id;
      if (id && !userMap.has(id)) {
        userMap.set(id, m);
      }
    });
    return Array.from(userMap.values());
  }, [orgMembers, projectMembers]);

  const [activeBottomTab, setActiveBottomTab] = useState('comments'); // 'comments' | 'attachments' | 'activity'
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // New comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Task edit state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Dedicated comments refetch helper for background sync
  const fetchCommentsOnly = useCallback(async (taskId) => {
    if (!taskId) return;
    try {
      const commentData = await commentService.getCommentsByTask(taskId);
      if (Array.isArray(commentData)) {
        setComments(commentData);
      }
    } catch (err) {
      console.warn('Could not refresh comments:', err.message);
    }
  }, []);

  // Fetch comments, attachments, and activity logs when task changes or modal opens
  const fetchTaskMetadata = useCallback(async (taskId) => {
    if (!taskId) return;
    setLoadingComments(true);
    setLoadingAttachments(true);
    setLoadingActivity(true);

    try {
      const [commentData, attachmentData, activityData] = await Promise.all([
        commentService.getCommentsByTask(taskId),
        attachmentService.getTaskAttachments(taskId),
        activityService.getActivityByTask(taskId),
      ]);

      setComments(commentData || []);
      setAttachments(attachmentData || []);
      setActivityLogs(activityData || []);
    } catch (err) {
      console.error('Failed to fetch task details metadata:', err);
    } finally {
      setLoadingComments(false);
      setLoadingAttachments(false);
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignedTo: task.assigned_to || '',
        dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      });
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setEditingCommentId(null);
      setCommentText('');
      setPreviewAttachment(null);
      fetchTaskMetadata(task.id);
    }
  }, [task, isOpen, fetchTaskMetadata]);

  // Realtime subscription & synchronization for multi-user comments
  useEffect(() => {
    if (!task?.id || !isOpen) return;

    let channel = null;

    if (isSupabaseConfigured()) {
      try {
        channel = supabase
          .channel(`task-comments-${task.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'comments',
              filter: `task_id=eq.${task.id}`,
            },
            () => {
              fetchCommentsOnly(task.id);
            }
          )
          .subscribe();
      } catch (subErr) {
        console.warn('Could not subscribe to comments realtime:', subErr);
      }
    }

    // Controlled polling while modal is open to ensure cross-user sync even without Realtime publication
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCommentsOnly(task.id);
      }
    }, 4000);

    // Refetch when tab gains focus
    const handleWindowFocus = () => {
      fetchCommentsOnly(task.id);
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (channel && isSupabaseConfigured()) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [task?.id, isOpen, fetchCommentsOnly]);

  const handleUploadAttachmentSuccess = (newAttachment) => {
    setAttachments((prev) => [newAttachment, ...prev]);
    // Refresh activity log
    activityService.getActivityByTask(task.id).then((logs) => setActivityLogs(logs || []));
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const res = await attachmentService.deleteAttachment(attachmentId);
    if (res.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      addToast('Attachment deleted', 'info');
      // Refresh activity log
      activityService.getActivityByTask(task.id).then((logs) => setActivityLogs(logs || []));
    } else {
      addToast(res.error || 'Failed to delete attachment', 'error');
    }
  };

  if (!task) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Task title cannot be empty', 'warning');
      return;
    }

    setSaving(true);
    const updates = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assignedTo || null,
      due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    const res = await taskService.updateTask(task.id, updates);
    setSaving(false);

    if (res.success) {
      addToast('Task updated successfully!', 'success');
      setIsEditing(false);
      if (onTaskUpdated) onTaskUpdated(res.task);
      // Refresh activity log
      fetchTaskMetadata(task.id);
    } else {
      addToast(res.error || 'Failed to update task', 'error');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await taskService.deleteTask(task.id);
    setIsDeleting(false);

    if (res.success) {
      addToast('Task deleted', 'info');
      onClose();
      if (onTaskDeleted) onTaskDeleted(task.id);
    } else {
      addToast(res.error || 'Failed to delete task', 'error');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    const res = await commentService.createComment(task.id, commentText.trim(), user?.id);
    setSubmittingComment(false);

    if (res.success) {
      if (res.comment) {
        setComments((prev) => {
          const exists = prev.some((c) => c.id === res.comment.id);
          return exists ? prev : [...prev, res.comment];
        });
      }
      setCommentText('');
      addToast('Comment posted', 'success');
      // Background refetch to ensure canonical database state and timestamps
      fetchCommentsOnly(task.id);
    } else {
      addToast(res.error || 'Failed to post comment', 'error');
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleSaveCommentEdit = async (commentId) => {
    if (!editCommentText.trim()) return;

    setSavingComment(true);
    const res = await commentService.updateComment(commentId, editCommentText.trim());
    setSavingComment(false);

    if (res.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: editCommentText.trim() } : c))
      );
      setEditingCommentId(null);
      addToast('Comment updated', 'success');
      fetchCommentsOnly(task.id);
    } else {
      addToast(res.error || 'Failed to update comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const res = await commentService.deleteComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      addToast('Comment deleted', 'info');
      fetchCommentsOnly(task.id);
    } else {
      addToast(res.error || 'Failed to delete comment', 'error');
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'brand';
      case 'low':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in_progress':
        return 'brand';
      case 'review':
        return 'warning';
      case 'todo':
        return 'cyan';
      default:
        return 'neutral';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task Details' : task.title}
      description={`Task in ${task.projectName || 'Project Workspace'}`}
      size="lg"
    >
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Issue Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe deliverables, technical context, or acceptance criteria..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Workflow Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { label: 'Backlog', value: 'backlog' },
                  { label: 'To Do', value: 'todo' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Review', value: 'review' },
                  { label: 'Done', value: 'done' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                  { label: 'Urgent', value: 'urgent' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Assignee
              </label>
              <Select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                options={[
                  { label: 'Unassigned', value: '' },
                  ...availableAssignees.map((m) => ({
                    label: `${m.fullName || m.full_name || 'Member'} (@${m.username || 'member'})${m.role ? ` (${m.role})` : ''}`,
                    value: m.userId || m.user_id || m.id,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Target Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F1F24] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              leftIcon={Save}
              loading={saving}
              disabled={saving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(task.status)} size="xs" dot>
              {task.status?.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant={getPriorityVariant(task.priority)} size="xs">
              {task.priority?.toUpperCase()}
            </Badge>
            {task.due_date && (
              <span className="text-xs text-[#71717A] flex items-center gap-1.5 ml-auto">
                <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
              </span>
            )}
          </div>

          {/* Description */}
          <div className="p-3 rounded-md bg-[#0B0B0E] border border-[#1F1F24] text-xs text-[#F5F5F7] leading-relaxed min-h-[50px]">
            {task.description || <span className="text-[#71717A] italic">No description provided for this issue.</span>}
          </div>

          {/* Key Assignee & Creator Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-md bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-between">
              <span className="text-[#71717A] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Assignee:</span>
              </span>
              <div className="flex items-center gap-2">
                <Avatar name={task.assigneeName || 'Unassigned'} size="xs" />
                <span className="font-medium text-[#F5F5F7]">{task.assigneeName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-between">
              <span className="text-[#71717A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Created By:</span>
              </span>
              <span className="text-[#A1A1AA]">{task.creatorName || 'Team Member'}</span>
            </div>
          </div>

          {/* Segmented Switcher for Comments, Attachments & Activity History */}
          <div className="pt-2 border-t border-[#1F1F24] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBottomTab('comments');
                    if (task?.id) fetchCommentsOnly(task.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeBottomTab === 'comments'
                      ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Comments ({comments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('attachments')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeBottomTab === 'attachments'
                      ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({attachments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBottomTab('activity')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeBottomTab === 'activity'
                      ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  }`}
                >
                  <ActivityIcon className="w-3.5 h-3.5" />
                  <span>Activity ({activityLogs.length})</span>
                </button>
              </div>
            </div>

            {/* Comments Tab */}
            {activeBottomTab === 'comments' && (
              <div className="space-y-3">
                {/* Comments List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {loadingComments ? (
                    <div className="p-6 flex justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-5 text-center text-[#71717A] text-xs bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                      No comments yet. Start the conversation below.
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isAuthor = c.userId === user?.id;
                      const isEditingThis = editingCommentId === c.id;

                      return (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-md bg-[#0B0B0E] border border-[#1F1F24] space-y-1.5 text-xs group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar name={c.authorName} size="xs" />
                              <span className="font-medium text-[#F5F5F7]">{c.authorName}</span>
                              <span className="text-[10px] text-[#71717A]">
                                {formatRelativeTime(c.createdAt)}
                              </span>
                            </div>

                            {isAuthor && !isEditingThis && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                <button
                                  onClick={() => handleStartEditComment(c)}
                                  className="text-[10px] text-[#71717A] hover:text-[#F5F5F7]"
                                  title="Edit comment"
                                >
                                  Edit
                                </button>
                                <span className="text-[#3D3D48]">•</span>
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-[10px] text-red-400 hover:text-red-300"
                                  title="Delete comment"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditingThis ? (
                            <div className="space-y-2 pt-1">
                              <Textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="xs"
                                  onClick={() => handleSaveCommentEdit(c.id)}
                                  loading={savingComment}
                                  disabled={savingComment || !editCommentText.trim()}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[#A1A1AA] leading-relaxed pl-6">
                              {c.content}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="space-y-2">
                  <div className="relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full bg-[#0B0B0E] border border-[#1F1F24] rounded-md p-2.5 pr-20 text-xs text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                    />
                    <div className="absolute right-2 bottom-2.5">
                      <Button
                        type="submit"
                        size="xs"
                        leftIcon={Send}
                        loading={submittingComment}
                        disabled={submittingComment || !commentText.trim()}
                      >
                        Comment
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Attachments Tab */}
            {activeBottomTab === 'attachments' && (
              <div className="space-y-3.5">
                {/* Upload Zone */}
                {canEdit && (
                  <AttachmentUploadZone
                    organizationId={task.organization_id || task.organizationId || currentOrg?.id}
                    projectId={task.project_id || task.projectId || task.project?.id}
                    taskId={task.id}
                    onUploadSuccess={handleUploadAttachmentSuccess}
                  />
                )}

                {/* Attachments List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {loadingAttachments ? (
                    <div className="p-6 flex justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="p-5 text-center text-[#71717A] text-xs bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                      No files attached yet. Drag & drop or click above to upload documents or images.
                    </div>
                  ) : (
                    attachments.map((att) => (
                      <AttachmentCard
                        key={att.id}
                        attachment={att}
                        onDelete={handleDeleteAttachment}
                        onPreview={(item) => setPreviewAttachment(item)}
                        canDelete={att.isUploader || user?.role === 'admin' || currentOrg?.role === 'admin'}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Activity History Tab */}
            {activeBottomTab === 'activity' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {loadingActivity ? (
                  <div className="p-6 flex justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="p-5 text-center text-[#71717A] text-xs bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                    No activity history recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 relative pl-2">
                    <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-[#1F1F24]" />
                    {activityLogs.map((log) => {
                      return (
                        <div key={log.id} className="flex items-start gap-2.5 relative z-10 text-xs">
                          <Avatar name={log.actorName} size="xs" />
                          <div className="flex-1 bg-[#0B0B0E] p-2.5 rounded-md border border-[#1F1F24]">
                            <p className="text-[#F5F5F7] font-normal leading-snug">
                              {formatActivityMessage(log)}
                            </p>
                            <span className="text-[10px] text-[#71717A] mt-1 block">
                              {formatRelativeTime(log.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Lightbox Preview Modal */}
          <ImagePreviewModal
            isOpen={Boolean(previewAttachment)}
            onClose={() => setPreviewAttachment(null)}
            attachment={previewAttachment}
          />

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-[#1F1F24] flex items-center justify-between">
            {canDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-medium">Confirm delete?</span>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={handleDelete}
                    loading={isDeleting}
                    disabled={isDeleting}
                  >
                    Yes, Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={Trash2}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Issue
                </Button>
              )
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              {canEdit && (
                <Button
                  size="sm"
                  leftIcon={Edit3}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Issue
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
