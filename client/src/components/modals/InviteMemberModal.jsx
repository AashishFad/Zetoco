import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

export default function InviteMemberModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast({
      title: 'Invitation Dispatched (Demo)',
      message: `Invited "${email}" as "${role}". (Phase 2 UI demo).`,
      type: 'success',
    });
    setEmail('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Send an invitation link to collaborate in this FlowSync workspace."
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
          options={[
            { value: 'Admin', label: 'Admin (Full workspace control & settings)' },
            { value: 'Manager', label: 'Manager (Project & sprint management)' },
            { value: 'Member', label: 'Member (Create & edit assigned tasks)' },
            { value: 'Guest', label: 'Guest (View only & comment)' },
          ]}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
