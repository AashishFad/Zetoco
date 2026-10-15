import React, { useState } from 'react';
import { Modal, Input, Select, Button, useToast } from '../ui';
import { Send, CheckCircle2, AlertCircle, Info, Building, Shield } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { createInvitation } from '../../services/invitationService';
import { ROLES, ROLE_LABELS } from '../../constants/permissions';

export default function InviteMemberModal({ isOpen, onClose, onInvitationCreated }) {
  const { currentOrganization, can } = useOrganization();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.MEMBER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentData, setSentData] = useState(null);

  const canManageMembers = can('members.manage');

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setRole(ROLES.MEMBER);
      setError('');
      setSentSuccess(false);
      setSentData(null);
      onClose();
    }
  };

  const handleSendAnother = () => {
    setEmail('');
    setRole(ROLES.MEMBER);
    setError('');
    setSentSuccess(false);
    setSentData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canManageMembers) {
      setError('Permission denied: Only administrators can create organization invitations.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!currentOrganization?.id) {
      setError('No active organization selected.');
      return;
    }

    setLoading(true);
    try {
      const result = await createInvitation(currentOrganization.id, {
        email: email.trim().toLowerCase(),
        role,
      });

      setSentData(result);
      setSentSuccess(true);
      addToast(`Invitation sent to ${email.trim().toLowerCase()}!`, 'success');

      if (typeof onInvitationCreated === 'function') {
        onInvitationCreated(result);
      }
    } catch (err) {
      console.error('Failed to send invitation:', err);
      const msg = err.message || 'Failed to send organization invitation.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      description={`Send a direct in-app invitation to join ${currentOrganization?.name || 'this workspace'}.`}
    >
      {sentSuccess ? (
        /* Success State: Clear confirmation explaining in-app workflow */
        <div className="space-y-5 py-2">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <p className="font-bold text-sm text-emerald-200">
                Invitation Sent Successfully!
              </p>
              <p className="text-emerald-300/90 leading-relaxed text-xs">
                We sent an in-app invitation to <strong className="text-white underline">{sentData?.email || email}</strong> for the role of{' '}
                <strong className="text-white">{ROLE_LABELS[sentData?.role || role] || role}</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300/80 space-y-1 mt-2">
                <p className="font-semibold text-emerald-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> What happens next?
                </p>
                <p>
                  The user will receive an in-app notification in Zetoco and can accept or decline the invitation directly from their dashboard.
                  They must explicitly accept the invitation before gaining membership access.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-800">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Done
            </Button>
            <Button size="sm" onClick={handleSendAnother} leftIcon={Send}>
              Invite Another Member
            </Button>
          </div>
        </div>
      ) : (
        /* Default State: In-app invitation input form */
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Registered Zetoco Email
            </label>
            <Input
              type="email"
              placeholder="e.g. member@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
              disabled={loading}
              className="bg-surface-950/70"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter the email address of an existing registered Zetoco account.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Workspace Role
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              options={[
                { value: ROLES.MEMBER, label: 'Member — Standard project collaborator' },
                { value: ROLES.PROJECT_MANAGER, label: 'Project Manager — Can manage projects & tasks' },
                { value: ROLES.VIEWER, label: 'Viewer — Read-only access to workspaces & tasks' },
                ...(can('organization.update')
                  ? [{ value: ROLES.ADMIN, label: 'Admin — Full administrative management' }]
                  : []),
              ]}
              className="bg-surface-950/70"
            />
          </div>

          {/* Workflow explanation notice */}
          <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-700/60 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <span className="font-semibold text-slate-200">In-App Notification:</span>
              <p>
                The recipient will receive an in-app invitation banner on their dashboard and notifications page with Accept and Decline options.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-800">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={loading}
              leftIcon={Send}
              className="font-medium shadow-sm"
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
