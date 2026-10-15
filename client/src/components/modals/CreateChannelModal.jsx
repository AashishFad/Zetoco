import React, { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Select, Button, useToast } from '../ui';
import { Hash, Folder, Sparkles, AlertCircle } from 'lucide-react';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { createChannel, normalizeChannelName } from '../../services/channelService';

export default function CreateChannelModal({ isOpen, onClose, onChannelCreated }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { projects } = useProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState('custom'); // 'custom' | 'project'
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizeChannelName(name);

  // Auto-sync project selection if switching type
  useEffect(() => {
    if (channelType === 'project' && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      if (!name) {
        setName(normalizeChannelName(projects[0].name));
      }
    }
  }, [channelType, projects, selectedProjectId, name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!normalized || normalized.length < 2) {
      setError('Channel name must be at least 2 characters.');
      return;
    }

    if (!currentOrganization) {
      setError('No active organization selected.');
      return;
    }

    setLoading(true);
    const res = await createChannel({
      organizationId: currentOrganization.id,
      name: normalized,
      description: description.trim(),
      projectId: channelType === 'project' ? selectedProjectId : null,
      type: channelType === 'project' ? 'project' : 'custom',
      userId: user?.id,
    });
    setLoading(false);

    if (res.success) {
      addToast(`Channel #${normalized} created successfully!`, 'success');
      setName('');
      setDescription('');
      setChannelType('custom');
      setSelectedProjectId('');
      if (onChannelCreated) {
        onChannelCreated(res.channel);
      }
      onClose();
    } else {
      setError(res.error || 'Failed to create channel');
      addToast(res.error || 'Failed to create channel', 'error');
    }
  };

  const projectOptions = (projects || []).map((p) => ({
    label: p.name,
    value: p.id,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Communication Channel"
      description={`Add a new dedicated channel to ${currentOrganization?.name || 'this workspace'}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Channel Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. frontend-team, release-v2, announcements"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              required
              autoFocus
              className="w-full bg-surface-950 border border-surface-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          {normalized && (
            <p className="text-[11px] text-slate-400 mt-1">
              Preview: <span className="font-mono text-brand-400 font-semibold">#{normalized}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Channel Type / Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChannelType('custom')}
              className={`p-3 rounded-xl border text-left transition-all ${
                channelType === 'custom'
                  ? 'bg-brand-500/10 border-brand-500 text-brand-300'
                  : 'bg-surface-950 border-surface-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Hash className="w-4 h-4" />
                <span>Workspace Channel</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Open to all workspace team members
              </p>
            </button>

            <button
              type="button"
              onClick={() => setChannelType('project')}
              className={`p-3 rounded-xl border text-left transition-all ${
                channelType === 'project'
                  ? 'bg-purple-500/10 border-purple-500 text-purple-300'
                  : 'bg-surface-950 border-surface-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Folder className="w-4 h-4" />
                <span>Project Channel</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Linked directly to a project team
              </p>
            </button>
          </div>
        </div>

        {channelType === 'project' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Linked Project <span className="text-red-400">*</span>
            </label>
            {projectOptions.length > 0 ? (
              <Select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const p = projects.find((proj) => proj.id === e.target.value);
                  if (p && (!name || name === normalized)) {
                    setName(normalizeChannelName(p.name));
                  }
                }}
                options={projectOptions}
              />
            ) : (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                No active projects found. Create a project first or use a Workspace Channel.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Channel Topic / Description (Optional)
          </label>
          <Textarea
            placeholder="What is this channel for? e.g. Daily sprint standups, bug triages, UX feedback..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            leftIcon={Hash}
            loading={loading}
            disabled={loading || (channelType === 'project' && !selectedProjectId)}
          >
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
