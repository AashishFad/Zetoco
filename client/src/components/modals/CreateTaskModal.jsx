import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

export default function CreateTaskModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    status: 'TODO',
    assignee: 'Rahul S.',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast({
      title: 'Task Added (Demo)',
      message: `Task "${formData.title || 'New Task'}" logged with ${formData.priority} priority.`,
      type: 'success',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a task, set priority level, and assign a team member."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Implement Payment Gateway Integration"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Priority"
            options={[
              { value: 'HIGH', label: '🔴 High Priority' },
              { value: 'MEDIUM', label: '🟡 Medium Priority' },
              { value: 'LOW', label: '🟢 Low Priority' },
            ]}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          />

          <Select
            label="Initial Column"
            options={[
              { value: 'BACKLOG', label: 'Backlog' },
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'REVIEW', label: 'In Review' },
              { value: 'DONE', label: 'Done' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />

          <Select
            label="Assignee"
            options={[
              { value: 'Aashish F.', label: 'Aashish F. (You)' },
              { value: 'Rahul S.', label: 'Rahul S.' },
              { value: 'Priya K.', label: 'Priya K.' },
              { value: 'Dhruv M.', label: 'Dhruv M.' },
              { value: 'Sneha P.', label: 'Sneha P.' },
            ]}
            value={formData.assignee}
            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
          />
        </div>

        <Textarea
          label="Description / Acceptance Criteria"
          placeholder="Specify requirements, links, or testing details..."
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
