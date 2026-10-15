import React, { useState } from 'react';
import { Modal, Input, Textarea, Button, useToast } from '../ui';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { validateOrgName, MAX_ORG_NAME_LENGTH } from '../../utils/orgUtils';

export default function CreateOrganizationModal({ isOpen, onClose }) {
  const { createOrganization } = useOrganization();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (!loading) {
      setError('');
      setName('');
      setDescription('');
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation before sending request
    const validation = validateOrgName(name);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError('');

    const res = await createOrganization({
      name: validation.normalizedName,
      description: description.trim(),
    });

    setLoading(false);

    if (res.success) {
      addToast(`Organization "${res.organization.name}" created successfully!`, 'success');
      setName('');
      setDescription('');
      setError('');
      onClose();
    } else {
      // Keep the entered name in state so the user can easily adjust it
      setError(res.error || 'Failed to create organization');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Organization"
      description="Set up a new workspace for your team, projects, and collaborative boards."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Organization / Company Name"
          placeholder="e.g. FlowSync Technologies"
          value={name}
          maxLength={MAX_ORG_NAME_LENGTH}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          leftIcon={Building2}
          disabled={loading}
          required
        />

        <Textarea
          label="Description (Optional)"
          placeholder="What does your team or workspace build?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={loading}
        />

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading} leftIcon={Plus}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
}
