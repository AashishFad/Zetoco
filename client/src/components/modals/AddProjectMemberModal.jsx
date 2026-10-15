import React, { useState } from 'react';
import { Modal, Select, Button, useToast, Badge, Avatar } from '../ui';
import { UserPlus, Check } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import * as projectService from '../../services/projectService';

export default function AddProjectMemberModal({ isOpen, onClose, projectId, currentProjectMembers = [], onMemberAdded }) {
  const { members: orgMembers } = useOrganization();
  const { addToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [projectRole, setProjectRole] = useState('member');
  const [loading, setLoading] = useState(false);

  // Filter org members who are NOT already in the project
  const existingUserIds = new Set(currentProjectMembers.map((m) => m.userId || m.user_id));
  const availableMembers = orgMembers.filter((m) => !existingUserIds.has(m.user_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      addToast('Please select an organization member to add', 'warning');
      return;
    }

    setLoading(true);
    const res = await projectService.addProjectMember(projectId, selectedUserId, projectRole);
    setLoading(false);

    if (res.success) {
      addToast('Member added to project successfully!', 'success');
      setSelectedUserId('');
      setProjectRole('member');
      if (onMemberAdded) onMemberAdded(res.member);
      onClose();
    } else {
      addToast(res.error || 'Failed to add member to project', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Project Member"
      description="Select an existing member from your organization to collaborate on this project."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Organization Member <span className="text-red-400">*</span>
          </label>
          {availableMembers.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 bg-surface-950 rounded-xl border border-surface-800">
              All organization members are already assigned to this project.
            </p>
          ) : (
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={[
                { label: 'Select a team member...', value: '' },
                ...availableMembers.map((m) => ({
                  label: `${m.full_name} (@${m.username || 'member'}) • ${m.job_title || 'Member'}`,
                  value: m.user_id,
                })),
              ]}
              required
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Project Role
          </label>
          <Select
            value={projectRole}
            onChange={(e) => setProjectRole(e.target.value)}
            options={[
              { label: 'Manager (Can manage project settings and members)', value: 'manager' },
              { label: 'Member (Can work on tasks and sprint deliverables)', value: 'member' },
              { label: 'Viewer (Read-only access)', value: 'viewer' },
            ]}
          />
        </div>

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            leftIcon={UserPlus}
            loading={loading}
            disabled={loading || availableMembers.length === 0}
          >
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
