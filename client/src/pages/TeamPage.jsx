import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Shield,
  CheckSquare,
  MoreVertical,
  Circle,
  Building,
  Crown,
  Calendar,
  ChevronDown,
  ShieldCheck,
  Check,
  MessageSquare,
  Info,
  Clock,
  Trash2,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  useToast,
} from '../components/ui';
import InviteMemberModal from '../components/modals/InviteMemberModal';
import CreateOrganizationModal from '../components/modals/CreateOrganizationModal';
import MemberDetailsModal from '../components/modals/MemberDetailsModal';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS } from '../constants/permissions';
import { getOrganizationInvitations, revokeInvitation } from '../services/invitationService';

export default function TeamPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  // Invitations State
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const { currentOrganization, organizations, members, currentRole, can, updateMemberRole, loading } = useOrganization();
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const canManageMembers = can('members.manage');

  // Load pending/active invitations for this organization
  const fetchInvitations = useCallback(async () => {
    if (!currentOrganization?.id || !can('members.read')) {
      setInvitations([]);
      return;
    }

    setLoadingInvitations(true);
    try {
      const data = await getOrganizationInvitations(currentOrganization.id);
      setInvitations(data);
    } catch (err) {
      console.warn('Could not load organization invitations:', err.message);
    } finally {
      setLoadingInvitations(false);
    }
  }, [currentOrganization?.id, can]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Handle invitation revocation
  const handleRevokeInvitation = async (invitationId, inviteEmail) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${inviteEmail}?`)) {
      return;
    }

    setRevokingId(invitationId);
    try {
      await revokeInvitation(invitationId);
      addToast(`Invitation for ${inviteEmail} revoked`, 'success');
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status: 'revoked' } : inv))
      );
    } catch (err) {
      addToast(err.message || 'Failed to revoke invitation', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  // Fallback to logged-in user as Admin if members list is loading or empty
  const displayMembers = members.length > 0 ? members : (
    currentOrganization ? [
      {
        id: user?.id || 'current-user',
        user_id: user?.id,
        full_name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Zetoco User',
        username: profile?.username || user?.email?.split('@')[0] || 'admin',
        role: currentOrganization?.userRole || ROLES.ADMIN,
        job_title: profile?.job_title || 'Workspace Administrator',
        bio: profile?.bio || 'Creator and admin of this workspace.',
        joined_at: currentOrganization?.created_at || new Date().toISOString(),
      }
    ] : []
  );

  const filteredMembers = displayMembers.filter((m) => {
    const matchesSearch =
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.username?.toLowerCase().includes(search.toLowerCase()) ||
      m.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (member, targetRole) => {
    if (member.role === targetRole) return;

    setUpdatingMemberId(member.id);
    const res = await updateMemberRole(member.id, targetRole);
    setUpdatingMemberId(null);

    if (res.success) {
      addToast(
        `Updated ${member.full_name}'s role to ${ROLE_LABELS[targetRole]}`,
        'success'
      );
    } else {
      addToast(res.error || 'Failed to update member role', 'error');
    }
  };

  if (!currentOrganization && !loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Building className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-semibold text-[#F5F5F7]">No Workspace Selected</h2>
        <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
          Create or join a workspace to collaborate with team members, manage roles, and coordinate projects.
        </p>
        <div className="pt-4">
          <Button onClick={() => setIsCreateOrgOpen(true)} leftIcon={Building}>
            Create Workspace
          </Button>
        </div>
        <CreateOrganizationModal isOpen={isCreateOrgOpen} onClose={() => setIsCreateOrgOpen(false)} />
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
              {currentOrganization?.name || 'Workspace'} Team
            </h1>
            <Badge variant="brand" size="xs">
              {ROLE_LABELS[currentRole] || 'Member'} View
            </Badge>
            <span className="text-xs text-[#71717A] font-normal">
              ({displayMembers.length} {displayMembers.length === 1 ? 'member' : 'members'})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Manage workspace members, role permissions, and collaborator access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageMembers && (
            <Button
              size="sm"
              leftIcon={UserPlus}
              onClick={() => setIsInviteOpen(true)}
            >
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#111114] p-2.5 rounded-lg border border-[#292930]">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name, role, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.MEMBER, ROLES.VIEWER].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                roleFilter === r
                  ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                  : 'bg-[#0B0B0E] text-[#71717A] hover:text-[#F5F5F7] border border-[#1F1F24]'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Active Members Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Active Members ({filteredMembers.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => {
            const isAdmin = m.role === ROLES.ADMIN;
            const badgeVariant = ROLE_BADGE_VARIANTS[m.role] || 'neutral';
            const isCurrentUser = m.user_id === user?.id;

            return (
              <Card key={m.id} hover className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setSelectedMember(m)}
                  >
                    <Avatar name={m.full_name} size="md" status="online" />
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-brand-300 transition-colors">
                        <span>{m.full_name}</span>
                        {isAdmin && (
                          <Crown className="w-3.5 h-3.5 text-amber-400" title="Workspace Administrator" />
                        )}
                        {isCurrentUser && (
                          <span className="text-[10px] text-brand-400 font-normal">(You)</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">@{m.username || 'member'}</p>
                    </div>
                  </div>

                  {/* Role Switcher for Admins, or Static Badge for Non-Admins */}
                  {canManageMembers ? (
                    <Dropdown
                      width="w-44"
                      trigger={
                        <button
                          type="button"
                          disabled={updatingMemberId === m.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                            isAdmin
                              ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 hover:bg-brand-500/30'
                              : m.role === ROLES.PROJECT_MANAGER
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                              : m.role === ROLES.MEMBER
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                              : 'bg-surface-800 text-slate-300 border-surface-700 hover:bg-surface-700'
                          }`}
                        >
                          <span>{updatingMemberId === m.id ? 'Saving...' : ROLE_LABELS[m.role]}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      }
                    >
                      <div className="px-3 py-1.5 border-b border-surface-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Assign Role
                      </div>
                      {Object.values(ROLES).map((roleKey) => (
                        <DropdownItem
                          key={roleKey}
                          icon={m.role === roleKey ? Check : undefined}
                          onClick={() => handleRoleChange(m, roleKey)}
                        >
                          <span className={m.role === roleKey ? 'font-bold text-brand-300' : ''}>
                            {ROLE_LABELS[roleKey]}
                          </span>
                        </DropdownItem>
                      ))}
                    </Dropdown>
                  ) : (
                    <Badge variant={badgeVariant} size="xs">
                      {ROLE_LABELS[m.role] || m.role}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Specialization:</span>
                    {m.job_title ? (
                      <span className="font-semibold text-slate-200">{m.job_title}</span>
                    ) : (
                      <span className="text-slate-500 italic">Not specified</span>
                    )}
                  </div>

                  {m.bio && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 px-1">
                      {m.bio}
                    </p>
                  )}
                </CardContent>

                <div className="p-4 pt-2 border-t border-surface-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Joined {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : 'Recently'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedMember(m)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={MessageSquare}
                      onClick={() => navigate('/messages')}
                    >
                      Chat
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand-400" />
              <CardTitle>Pending & Recent Invitations</CardTitle>
            </div>
            <CardDescription>
              Shareable workspace invitations generated for {currentOrganization?.name || 'this workspace'}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              leftIcon={RefreshCw}
              onClick={fetchInvitations}
              disabled={loadingInvitations}
            >
              Refresh
            </Button>
            {canManageMembers && (
              <Button
                variant="outline"
                size="xs"
                leftIcon={UserPlus}
                onClick={() => setIsInviteOpen(true)}
              >
                New Invite
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loadingInvitations ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-surface-950/60 rounded-xl border border-surface-800 text-xs">
              <Mail className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="font-semibold text-white">No invitations created</p>
              <p className="text-slate-500 mt-0.5">
                Generate an invitation link to invite team members to this organization.
              </p>
              {canManageMembers && (
                <div className="pt-3">
                  <Button size="xs" leftIcon={UserPlus} onClick={() => setIsInviteOpen(true)}>
                    Invite Team Member
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-surface-800/80">
              {invitations.map((inv) => {
                const isPending = inv.status === 'pending';
                const isRevoked = inv.status === 'revoked';
                const isAccepted = inv.status === 'accepted';
                const isDeclined = inv.status === 'declined';
                const isExpired = inv.status === 'expired';

                const statusVariant = isAccepted
                  ? 'success'
                  : isPending
                  ? 'brand'
                  : isDeclined
                  ? 'warning'
                  : isRevoked
                  ? 'danger'
                  : 'neutral';

                return (
                  <div
                    key={inv.id}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                        <Mail className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">
                            {inv.email}
                          </p>
                          <Badge variant={statusVariant} size="xs" dot={isPending}>
                            {inv.status.toUpperCase()}
                          </Badge>
                          <Badge variant="cyan" size="xs">
                            {ROLE_LABELS[inv.role] || inv.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>
                            Created {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {isPending
                              ? `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`
                              : isAccepted
                              ? `Accepted ${inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString() : ''}`
                              : isDeclined
                              ? 'Declined by recipient'
                              : isRevoked
                              ? 'Revoked by admin'
                              : `Status: ${inv.status}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isPending && canManageMembers && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          leftIcon={Trash2}
                          disabled={revokingId === inv.id}
                          onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                        >
                          {revokingId === inv.id ? 'Revoking...' : 'Revoke'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvitationCreated={() => {
          fetchInvitations();
        }}
      />
      <CreateOrganizationModal isOpen={isCreateOrgOpen} onClose={() => setIsCreateOrgOpen(false)} />
      <MemberDetailsModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={members.find((m) => m.id === selectedMember?.id) || selectedMember}
      />
    </div>
  );
}
