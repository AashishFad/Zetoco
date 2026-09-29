import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

export default function CreateProjectModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    category: 'Engineering',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast({
      title: 'Project Created (Demo)',
      message: `Project "${formData.name || 'New Project'}" initialized in workspace. (Phase 3 will persist to PostgreSQL).`,
      type: 'success',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Set up a new collaborative project board for your team."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. Mobile App Redesign"
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value;
            const key = name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 4);
            setFormData({ ...formData, name, key: key || formData.key });
          }}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Project Key / Prefix"
            placeholder="e.g. MAR"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
            helperText="Short identifier for task IDs (e.g. MAR-101)"
            maxLength={6}
            required
          />

          <Select
            label="Category"
            options={[
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Design', label: 'Product & Design' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'Operations', label: 'Operations' },
            ]}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>

        <Textarea
          label="Description (Optional)"
          placeholder="What is the primary goal and milestone for this project?"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
