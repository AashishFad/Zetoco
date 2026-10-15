import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, Bell, Key, Globe, Database, Check, Building, AlertTriangle, Lock, Sun, Moon, Laptop, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select, Badge, useToast } from '../components/ui';
import DeleteOrganizationModal from '../components/modals/DeleteOrganizationModal';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_LABELS } from '../constants/permissions';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { currentOrganization, currentRole, can, updateOrganization, deleteOrganization } = useOrganization();
  const { theme, setTheme, isDark } = useTheme();

  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  const canUpdateOrg = can('organization.update');
  const isOwner = currentOrganization?.created_by ? currentOrganization.created_by === user?.id : true;
  const isAdmin = currentRole === 'admin';
  const canDeleteOrg = can('organization.delete') && (isOwner || !currentOrganization?.created_by);

  useEffect(() => {
    if (currentOrganization) {
      setWorkspaceName(currentOrganization.name || '');
      setDescription(currentOrganization.description || '');
    }
  }, [currentOrganization]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canUpdateOrg) {
      addToast('Permission denied: Only Admins can modify workspace settings.', 'error');
      return;
    }

    if (!workspaceName.trim()) {
      addToast('Workspace name cannot be empty', 'warning');
      return;
    }

    setSaving(true);
    const res = await updateOrganization({
      name: workspaceName.trim(),
      description: description.trim(),
    });
    setSaving(false);

    if (res.success) {
      addToast('Organization settings updated successfully!', 'success');
    } else {
      addToast(res.error || 'Failed to update organization settings', 'error');
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    setDeletingOrg(true);
    const orgName = currentOrganization?.name || 'Workspace';
    const res = await deleteOrganization(orgId);
    setDeletingOrg(false);

    if (res?.success) {
      addToast(`Organization "${orgName}" was permanently deleted.`, 'success');
      setIsDeleteModalOpen(false);
      navigate('/dashboard', { replace: true });
      return { success: true };
    } else {
      addToast(res?.error || 'Failed to delete organization', 'error');
      return { success: false, error: res?.error };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
            Settings & Preferences
          </h1>
          <Badge variant={canUpdateOrg ? 'brand' : 'warning'} size="xs">
            {canUpdateOrg ? 'Admin Access' : `${ROLE_LABELS[currentRole] || 'Member'} (Read-Only)`}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
          Configure workspace preferences, security boundaries, and theme appearance.
        </p>
      </div>

      {/* Appearance / Theme Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <CardTitle>Appearance & Theme</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred interface theme. Switch between Blackout Dark, Light Mode, or match system settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Dark Mode (Recommended) */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2.5 p-3.5 rounded-lg border text-left transition-all ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-sm'
                  : 'border-[#1F1F24] bg-[#0B0B0E] hover:bg-[#17171C]'
              }`}
            >
              <div className="w-full h-16 rounded-md bg-[#080808] border border-[#1F1F24] p-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <div className="w-10 h-1.5 rounded bg-[#1F1F24]"></div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-full h-4 rounded bg-[#111114] border border-[#1F1F24]"></div>
                  <div className="w-full h-4 rounded bg-[#111114] border border-[#1F1F24]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-[#F5F5F7]">Blackout Dark</span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto" />}
              </div>
            </button>

            {/* Light Mode */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2.5 p-3.5 rounded-lg border text-left transition-all ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-sm'
                  : 'border-[#1F1F24] bg-[#0B0B0E] hover:bg-[#17171C]'
              }`}
            >
              <div className="w-full h-16 rounded-md bg-[#F4F5F7] border border-[#E4E4E7] p-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <div className="w-10 h-1.5 rounded bg-[#E4E4E7]"></div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-full h-4 rounded bg-white border border-[#E4E4E7]"></div>
                  <div className="w-full h-4 rounded bg-white border border-[#E4E4E7]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-[#F5F5F7]">Light</span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto" />}
              </div>
            </button>

            {/* System Mode */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2.5 p-3.5 rounded-lg border text-left transition-all ${
                theme === 'system'
                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-sm'
                  : 'border-[#1F1F24] bg-[#0B0B0E] hover:bg-[#17171C]'
              }`}
            >
              <div className="w-full h-16 rounded-md bg-gradient-to-r from-[#F4F5F7] to-[#080808] border border-[#1F1F24] p-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <div className="w-10 h-1.5 rounded bg-[#292930]"></div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-full h-4 rounded bg-white dark:bg-[#111114] border border-[#292930]"></div>
                  <div className="w-full h-4 rounded bg-white dark:bg-[#111114] border border-[#292930]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Laptop className="w-3.5 h-3.5 text-[#71717A]" />
                <span className="text-xs font-medium text-[#F5F5F7]">System</span>
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto" />}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {!canUpdateOrg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-700 dark:text-amber-200">Read-Only Permission Mode</p>
            <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Your current role is <strong className="text-surface-100">{ROLE_LABELS[currentRole] || currentRole}</strong>. Only Organization Administrators can modify workspace configuration.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Identity</CardTitle>
            <CardDescription>Primary identification for {currentOrganization?.name || 'this workspace'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Organization Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={!canUpdateOrg}
              placeholder="e.g. Zetoco Technologies"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                Workspace Slug / URL Identifier
              </label>
              <Input
                value={currentOrganization?.slug || 'workspace-slug'}
                disabled
                className="opacity-70 cursor-not-allowed bg-surface-950 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                Description & Purpose
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canUpdateOrg}
                rows={3}
                placeholder="Brief description of your organization's projects and focus..."
                className="w-full bg-surface-950/80 border border-surface-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <Select
              label="Default Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!canUpdateOrg}
              options={[
                { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
                { label: 'EST (Eastern Standard Time)', value: 'EST' },
                { label: 'PST (Pacific Standard Time)', value: 'PST' },
                { label: 'IST (India Standard Time)', value: 'IST' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RBAC Security Policies</CardTitle>
            <CardDescription>Organization security and member governance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <div>
                <p className="font-semibold text-surface-100">Multi-Factor Authentication (MFA)</p>
                <p className="text-[11px] text-surface-400">Enforce MFA authentication for Workspace Admins</p>
              </div>
              <Badge variant="success" size="xs">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800">
              <div>
                <p className="font-semibold text-surface-100">Strict Row-Level Security (RLS)</p>
                <p className="text-[11px] text-surface-400">PostgreSQL policies protect cross-organization data isolation</p>
              </div>
              <Badge variant="brand" size="xs">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {canUpdateOrg && (
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              size="sm"
              leftIcon={Check}
              loading={saving}
              disabled={saving}
            >
              Save Organization Settings
            </Button>
          </div>
        )}
      </form>

      {/* Danger Zone */}
      <Card className="border-rose-950/60 bg-[#111114] shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <CardTitle className="text-rose-300">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for <strong className="text-[#F5F5F7]">{currentOrganization?.name || 'this workspace'}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#080808] border border-rose-950/50">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#F5F5F7]">Delete this organization</h4>
              <p className="text-xs text-[#A1A1AA] max-w-xl leading-relaxed">
                Permanently delete this workspace and all associated projects, tasks, Kanban boards, attachments, discussions, and member associations. This operation cannot be undone.
              </p>
              {!canDeleteOrg && (
                <p className="text-[11px] text-amber-400/90 pt-1">
                  {isAdmin && !isOwner
                    ? 'Only the workspace owner who created this organization can delete it.'
                    : 'Administrator privileges are required to delete this organization.'}
                </p>
              )}
            </div>

            <Button
              variant="danger"
              size="sm"
              leftIcon={Trash2}
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={!canDeleteOrg || deletingOrg}
              loading={deletingOrg}
              className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 whitespace-nowrap"
            >
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteOrganizationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        organization={currentOrganization}
        onConfirmDelete={handleDeleteOrganization}
      />
    </div>
  );
}
