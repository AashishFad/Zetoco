import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input, Avatar, Badge, Dropdown, DropdownItem, useToast } from '../ui';
import {
  Crown,
  Calendar,
  Briefcase,
  Folder,
  MessageSquare,
  Shield,
  Check,
  ChevronDown,
  User,
  Pencil,
  Loader2,
  X,
} from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { ROLES, ROLE_LABELS, ROLE_BADGE_VARIANTS } from '../../constants/permissions';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function MemberDetailsModal({ isOpen, onClose, member }) {
  const { user } = useAuth();
  const { currentOrganization, can, updateMemberRole, updateMemberSpecialization } = useOrganization();
  const { projects } = useProject();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isEditingSpecialization, setIsEditingSpecialization] = useState(false);
  const [specializationInput, setSpecializationInput] = useState('');
  const [isSavingSpecialization, setIsSavingSpecialization] = useState(false);

  const canManageMembers = can('members.manage');
  const isCurrentUser = member?.user_id === user?.id;
  const canEditSpecialization = canManageMembers || isCurrentUser;
  const isAdmin = member?.role === ROLES.ADMIN;
  const badgeVariant = ROLE_BADGE_VARIANTS[member?.role] || 'neutral';

  useEffect(() => {
    setIsEditingSpecialization(false);
    setSpecializationInput(member?.job_title || '');
  }, [member?.id, member?.job_title, isOpen]);

  // Fetch projects this member belongs to
  useEffect(() => {
    async function fetchMemberProjects() {
      if (!isOpen || !member?.user_id || !currentOrganization?.id) {
        setAssignedProjects([]);
        return;
      }

      setLoadingProjects(true);
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('project_members')
            .select(`
              project_role,
              project:projects!project_members_project_id_fkey (
                id,
                name,
                status,
                color,
                organization_id
              )
            `)
            .eq('user_id', member.user_id);

          if (!error && data) {
            const orgProjects = data
              .filter((pm) => pm.project && pm.project.organization_id === currentOrganization.id)
              .map((pm) => ({
                id: pm.project.id,
                name: pm.project.name,
                status: pm.project.status,
                color: pm.project.color,
                projectRole: pm.project_role,
              }));
            setAssignedProjects(orgProjects);
            setLoadingProjects(false);
            return;
          }
        }

        // Fallback using projects context
        const matched = (projects || []).filter((p) =>
          p.members?.some((m) => m.userId === member.user_id || m.id === member.user_id)
        );
        setAssignedProjects(matched);
      } catch (err) {
        console.warn('Failed to fetch member projects:', err.message);
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchMemberProjects();
  }, [isOpen, member, currentOrganization, projects]);

  const handleRoleChange = async (newRole) => {
    if (!member || member.role === newRole) return;
    setIsUpdatingRole(true);
    const res = await updateMemberRole(member.id, newRole);
    setIsUpdatingRole(false);

    if (res.success) {
      addToast(`Updated ${member.full_name}'s role to ${ROLE_LABELS[newRole]}`, 'success');
      // Update local member copy if needed
      member.role = newRole;
    } else {
      addToast(res.error || 'Failed to update role', 'error');
    }
  };

  const handleSaveSpecialization = async () => {
    if (!member) return;
    setIsSavingSpecialization(true);
    const cleanTitle = specializationInput.trim() || null;
    const res = await updateMemberSpecialization(member.id, cleanTitle);
    setIsSavingSpecialization(false);

    if (res.success) {
      addToast(
        cleanTitle
          ? `Updated specialization to "${cleanTitle}"`
          : 'Specialization cleared',
        'success'
      );
      member.job_title = cleanTitle;
      member.jobTitle = cleanTitle;
      setIsEditingSpecialization(false);
    } else {
      addToast(res.error || 'Failed to update specialization', 'error');
    }
  };

  const handleMessageClick = () => {
    onClose();
    navigate('/messages');
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Member Profile"
      description={`Collaborator details in ${currentOrganization?.name || 'Workspace'}`}
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-950 border border-surface-800">
          <Avatar name={member.full_name} size="lg" status="online" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white truncate">
                {member.full_name}
              </h3>
              {isAdmin && (
                <Crown className="w-4 h-4 text-amber-400 shrink-0" title="Workspace Administrator" />
              )}
              {isCurrentUser && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">@{member.username || 'member'}</p>

            <div className="flex items-center gap-2 mt-2.5">
              {canManageMembers ? (
                <Dropdown
                  width="w-48"
                  trigger={
                    <button
                      type="button"
                      disabled={isUpdatingRole}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                        isAdmin
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 hover:bg-brand-500/30'
                          : member.role === ROLES.PROJECT_MANAGER
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                          : member.role === ROLES.MEMBER
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                          : 'bg-surface-800 text-slate-300 border-surface-700 hover:bg-surface-700'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{isUpdatingRole ? 'Updating...' : ROLE_LABELS[member.role] || member.role}</span>
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                  }
                >
                  <div className="px-3 py-1.5 border-b border-surface-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Change Workspace Role
                  </div>
                  {Object.values(ROLES).map((roleKey) => (
                    <DropdownItem
                      key={roleKey}
                      icon={member.role === roleKey ? Check : undefined}
                      onClick={() => handleRoleChange(roleKey)}
                    >
                      <span className={member.role === roleKey ? 'font-bold text-brand-300' : ''}>
                        {ROLE_LABELS[roleKey]}
                      </span>
                    </DropdownItem>
                  ))}
                </Dropdown>
              ) : (
                <Badge variant={badgeVariant} size="sm">
                  {ROLE_LABELS[member.role] || member.role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Specialization / Title
                </span>
                {canEditSpecialization && !isEditingSpecialization && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpecializationInput(member.job_title || '');
                      setIsEditingSpecialization(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingSpecialization ? (
                <div className="mt-2 space-y-2">
                  <Input
                    size="sm"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    placeholder="e.g. Frontend Engineer, Product Designer..."
                    autoFocus
                    disabled={isSavingSpecialization}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSpecialization();
                      if (e.key === 'Escape') setIsEditingSpecialization(false);
                    }}
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={isSavingSpecialization}
                      onClick={() => setIsEditingSpecialization(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={isSavingSpecialization ? Loader2 : Check}
                      disabled={isSavingSpecialization}
                      onClick={handleSaveSpecialization}
                    >
                      {isSavingSpecialization ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="font-semibold text-slate-200">
                  {member.job_title ? (
                    member.job_title
                  ) : (
                    <span className="text-slate-500 italic font-normal">Not specified</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800">
            <span className="text-[11px] text-slate-500 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Organization Member Since
            </span>
            <span className="font-semibold text-slate-200">
              {member.joined_at ? new Date(member.joined_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Recent'}
            </span>
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 text-xs">
            <span className="text-[11px] text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
              About / Bio
            </span>
            <p className="text-slate-300 leading-relaxed">
              {member.bio}
            </p>
          </div>
        )}

        {/* Active Projects List */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-brand-400" />
              Assigned Projects ({assignedProjects.length})
            </span>
          </h4>

          {loadingProjects ? (
            <div className="text-center py-4 text-xs text-slate-500">
              Loading projects...
            </div>
          ) : assignedProjects.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {assignedProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.color || '#6366f1' }}
                    />
                    <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                  </div>
                  <Badge variant="brand" size="xs">
                    {p.projectRole || p.status || 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800/80 text-center text-xs text-slate-500">
              No active project assignments in this workspace yet.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-surface-800 flex justify-between items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            size="sm"
            leftIcon={MessageSquare}
            onClick={handleMessageClick}
          >
            Go to Channels
          </Button>
        </div>
      </div>
    </Modal>
  );
}
