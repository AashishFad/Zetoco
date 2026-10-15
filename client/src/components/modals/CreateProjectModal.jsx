import React, { useState } from 'react';
import { Modal, Input, Textarea, Select, Button, useToast } from '../ui';
import { FolderPlus, Calendar, AlertCircle } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useOrganization } from '../../context/OrganizationContext';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { addToast } = useToast();
  const { createProject } = useProject();
  const { currentOrganization, can } = useOrganization();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  const canCreate = can('projects.create');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDateError('');

    if (!canCreate) {
      addToast('Permission denied: Only Admins and Project Managers can create projects', 'error');
      return;
    }

    if (!name.trim()) {
      addToast('Project name is required', 'warning');
      return;
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setDateError('Start date cannot be after due date');
      return;
    }

    setLoading(true);
    const res = await createProject({
      name: name.trim(),
      description: description.trim(),
      status,
      priority,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
    setLoading(false);

    if (res.success) {
      addToast(`Project "${name}" created successfully!`, 'success');
      setName('');
      setDescription('');
      setStatus('planning');
      setPriority('medium');
      setStartDate('');
      setDueDate('');
      if (typeof onProjectCreated === 'function') {
        onProjectCreated(res.project);
      }
      onClose();
    } else {
      addToast(res.error || 'Failed to create project', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description={`Initialize a new project workspace within ${currentOrganization?.name || 'your organization'}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Project Name <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="e.g. NextGen Web Portal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description (Optional)
          </label>
          <Textarea
            placeholder="Briefly describe what this project delivers and its business goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Initial Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: 'Planning', value: 'planning' },
                { label: 'Active', value: 'active' },
                { label: 'On Hold', value: 'on_hold' },
                { label: 'Completed', value: 'completed' },
                { label: 'Archived', value: 'archived' },
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateError('');
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setDateError('');
              }}
            />
          </div>
        </div>

        {dateError && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            leftIcon={FolderPlus}
            loading={loading}
            disabled={loading}
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
