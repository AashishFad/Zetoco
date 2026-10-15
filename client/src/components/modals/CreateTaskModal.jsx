import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, Textarea, Select, Button, useToast } from '../ui';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useOrganization } from '../../context/OrganizationContext';
import * as taskService from '../../services/taskService';

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId = null,
  initialStatus = 'todo',
  projectMembers = [],
  assignees = null,
  onTaskCreated,
}) {
  const { user } = useAuth();
  const { projects } = useProject();
  const { members: orgMembers } = useOrganization();
  const { addToast } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus || 'todo');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute available assignees across organization and project
  const availableAssignees = useMemo(() => {
    const userMap = new Map();

    // 1. If explicit assignees prop provided, use it
    if (assignees && assignees.length > 0) {
      assignees.forEach((m) => {
        const id = m.userId || m.user_id || m.id;
        if (id) userMap.set(id, m);
      });
      return Array.from(userMap.values());
    }

    // 2. Add organization members (including Account B who accepted the invitation)
    (orgMembers || []).forEach((m) => {
      const id = m.userId || m.user_id || m.id;
      if (id) userMap.set(id, m);
    });

    // 3. Add project members
    (projectMembers || []).forEach((m) => {
      const id = m.userId || m.user_id || m.id;
      if (id && !userMap.has(id)) {
        userMap.set(id, m);
      }
    });

    return Array.from(userMap.values());
  }, [assignees, orgMembers, projectMembers]);

  useEffect(() => {
    if (isOpen) {
      if (projectId) {
        setSelectedProjectId(typeof projectId === 'string' ? projectId.trim() : projectId);
      } else if (projects.length > 0 && (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId))) {
        setSelectedProjectId(projects[0].id);
      }
      if (initialStatus) {
        setStatus(initialStatus);
      }
    }
  }, [isOpen, projectId, projects, initialStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetProjectId = typeof selectedProjectId === 'string' ? selectedProjectId.trim() : selectedProjectId;
    if (!targetProjectId) {
      addToast('Please select a project for this task', 'warning');
      return;
    }

    if (!title.trim()) {
      addToast('Task title is required', 'warning');
      return;
    }

    setLoading(true);
    const res = await taskService.createTask({
      projectId: targetProjectId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      assigned_to: assignedTo || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      userId: user?.id,
    });
    setLoading(false);

    if (res.success) {
      addToast(`Task "${title}" created successfully!`, 'success');
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');
      if (onTaskCreated) onTaskCreated(res.task);
      onClose();
    } else {
      addToast(res.error || 'Failed to create task', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a task card to your sprint Kanban board with priority and assignee."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selection (if not pre-selected) */}
        {!projectId && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Project <span className="text-red-400">*</span>
            </label>
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              options={[
                { label: 'Select a project...', value: '' },
                ...projects.map((p) => ({
                  label: `${p.name} (${p.slug})`,
                  value: p.id,
                })),
              ]}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Task Title <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="e.g. Implement authentication middleware"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description (Optional)
          </label>
          <Textarea
            placeholder="Technical details, acceptance criteria, or context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Initial Column Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { label: 'Low Priority', value: 'low' },
                { label: 'Medium Priority', value: 'medium' },
                { label: 'High Priority', value: 'high' },
                { label: 'Urgent Priority', value: 'urgent' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Assignee
            </label>
            <Select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            leftIcon={Plus}
            loading={loading}
            disabled={loading}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
