import React, { useState } from 'react';
import { Modal, Input, Select, Button, useToast } from '../ui';
import { UserPlus } from 'lucide-react';

export default function InviteMemberModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    addToast(`Invitation sent to ${email} as ${role} (UI Simulation)`, 'success');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Send an invitation email to collaborate on your FlowSync workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Select
          label="Workspace Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { label: 'Developer (Full task & board access)', value: 'Developer' },
            { label: 'Project Manager (Create projects & assign)', value: 'Project Manager' },
            { label: 'Admin (Workspace settings & member billing)', value: 'Admin' },
            { label: 'Viewer (Read-only access)', value: 'Viewer' },
          ]}
        />

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" leftIcon={UserPlus}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
