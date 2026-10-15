import React, { useState, useEffect, useCallback } from 'react';
import { Building, UserCheck, UserX, Clock, Check, X, Shield, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, useToast } from '../ui';
import { getMyPendingInvitations, acceptInvitationById, declineInvitation } from '../../services/invitationService';
import { useOrganization } from '../../context/OrganizationContext';
import { useNotifications } from '../../context/NotificationContext';
import { ROLE_LABELS } from '../../constants/permissions';

export default function PendingInvitationsSection({ onActionComplete, compact = false }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept' | 'decline'

  const { fetchOrganizations, switchOrganization } = useOrganization();
  const { notifications, fetchNotifications } = useNotifications();
  const { addToast } = useToast();

  const loadPendingInvitations = useCallback(async () => {
    try {
      const data = await getMyPendingInvitations();
      setInvitations(data || []);
    } catch (err) {
      console.warn('Could not load pending invitations:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  // When a realtime notification arrives, refresh pending invitations
  useEffect(() => {
    const hasInviteNotif = notifications.some(
      (n) => n.type === 'organization_invitation_received' && !n.isRead
    );
    if (hasInviteNotif) {
      loadPendingInvitations();
    }
  }, [notifications, loadPendingInvitations]);

  const handleAccept = async (invite) => {
    setProcessingId(invite.id);
    setActionType('accept');
    try {
      const res = await acceptInvitationById(invite.id);
      addToast(`Joined ${res.organizationName || invite.organizationName} successfully!`, 'success');

      // Remove from local list
      setInvitations((prev) => prev.filter((i) => i.id !== invite.id));

      // Refresh organizations
      if (typeof fetchOrganizations === 'function') {
        await fetchOrganizations();
      }

      // Switch to the newly joined organization
      if (res.organizationId && typeof switchOrganization === 'function') {
        await switchOrganization(res.organizationId);
      }

      // Refresh notifications list
      if (typeof fetchNotifications === 'function') {
        fetchNotifications();
      }

      if (typeof onActionComplete === 'function') {
        onActionComplete('accept', invite);
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      addToast(err.message || 'Failed to accept invitation', 'error');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  const handleDecline = async (invite) => {
    if (!window.confirm(`Decline the invitation to join ${invite.organizationName}?`)) {
      return;
    }

    setProcessingId(invite.id);
    setActionType('decline');
    try {
      await declineInvitation(invite.id);
      addToast(`Declined invitation to join ${invite.organizationName}`, 'info');

      // Remove from local list
      setInvitations((prev) => prev.filter((i) => i.id !== invite.id));

      // Refresh notifications list
      if (typeof fetchNotifications === 'function') {
        fetchNotifications();
      }

      if (typeof onActionComplete === 'function') {
        onActionComplete('decline', invite);
      }
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      addToast(err.message || 'Failed to decline invitation', 'error');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  if (loading && invitations.length === 0) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950/70 via-surface-900 to-indigo-950/60 border border-brand-500/30 p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Pending Workspace Invitations</h3>
                <Badge variant="brand" size="xs">
                  {invitations.length} new
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                You have been invited to collaborate in the following workspaces. Accept to join.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invitations.map((invite) => {
            const isAccepting = processingId === invite.id && actionType === 'accept';
            const isDeclining = processingId === invite.id && actionType === 'decline';
            const isBusy = processingId === invite.id;

            return (
              <div
                key={invite.id}
                className="bg-surface-950/80 rounded-xl border border-surface-700/70 p-4 flex flex-col justify-between gap-4 hover:border-brand-500/40 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center font-bold text-slate-300 text-sm shrink-0">
                    {invite.organizationLogo ? (
                      <img
                        src={invite.organizationLogo}
                        alt={invite.organizationName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Building className="w-5 h-5 text-brand-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{invite.organizationName}</h4>
                      <Badge variant="cyan" size="xs">
                        {ROLE_LABELS[invite.role] || invite.role}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      Invited by <strong className="text-slate-200">{invite.inviterName}</strong>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-800/80">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    leftIcon={X}
                    disabled={isBusy}
                    loading={isDeclining}
                    onClick={() => handleDecline(invite)}
                  >
                    Decline
                  </Button>
                  <Button
                    size="xs"
                    leftIcon={Check}
                    disabled={isBusy}
                    loading={isAccepting}
                    onClick={() => handleAccept(invite)}
                  >
                    Accept Invitation
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
