import React, { useState } from 'react';
import { Modal, Input, Textarea, Select, Button, useToast } from '../ui';
import { Plus } from 'lucide-react';

export default function CreateTaskModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [column, setColumn] = useState('TODO');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addToast(`Task "${title}" created (UI Simulation)`, 'success');
    setTitle('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a task card to your sprint board with priority and assignments."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Implement authentication middleware"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { label: 'Low Priority', value: 'LOW' },
              { label: 'Medium Priority', value: 'MEDIUM' },
              { label: 'High Priority', value: 'HIGH' },
              { label: 'Urgent Priority', value: 'URGENT' },
            ]}
          />

          <Select
            label="Initial Column"
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            options={[
              { label: 'Backlog', value: 'BACKLOG' },
              { label: 'To Do', value: 'TODO' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Review', value: 'REVIEW' },
              { label: 'Done', value: 'DONE' },
            ]}
          />
        </div>

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" leftIcon={Plus}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
