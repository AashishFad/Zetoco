import React, { useState } from 'react';
import { Modal, Input, Textarea, Select, Button, useToast } from '../ui';
import { FolderPlus } from 'lucide-react';

export default function CreateProjectModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addToast(`Project "${name}" created (UI Simulation)`, 'success');
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Initialize a new project workspace with custom boards and sprints."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. NextGen Web Portal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Briefly describe what this project delivers..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <Select
          label="Visibility & Access"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          options={[
            { label: 'Private (Invited members only)', value: 'private' },
            { label: 'Workspace Public (All organization members)', value: 'public' },
          ]}
        />

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" leftIcon={FolderPlus}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
