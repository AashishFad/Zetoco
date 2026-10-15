import React, { useState } from 'react';
import { Modal, Input, Button, useToast } from '../ui';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DeleteOrganizationModal({
  isOpen,
  onClose,
  organization,
  onConfirmDelete,
}) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const isConfirmed = confirmText.trim() === organization?.name?.trim();

  const handleDelete = async () => {
    if (!isConfirmed || loading) return;

    setLoading(true);
    const res = await onConfirmDelete(organization?.id);
    setLoading(false);

    if (res?.success) {
      setConfirmText('');
      onClose();
    }
  };

  const handleClose = () => {
    if (loading) return;
    setConfirmText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Workspace Permanently?"
      description="This action is irreversible and will permanently destroy this organization."
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-200">Critical Warning: Immediate Data Destruction</p>
            <p className="text-rose-300/90 leading-relaxed">
              Deleting <strong className="text-white font-semibold">"{organization?.name}"</strong> will immediately and permanently erase:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-rose-300/80 pt-1 text-[11px]">
              <li>All projects and active sprint boards</li>
              <li>All tasks, subtasks, and Kanban pipelines</li>
              <li>All comments, attachments, and uploaded storage files</li>
              <li>All organization discussion channels and messages</li>
              <li>All member roles, pending invitations, and workspace logs</li>
            </ul>
            <p className="pt-1.5 text-[11px] text-zinc-400">
              User accounts and data in other workspaces will not be affected.
            </p>
          </div>
        </div>

        {/* Typed Confirmation Field */}
        <div>
          <label className="block text-xs font-semibold text-[#D4D4D8] mb-1.5">
            Type <span className="font-mono text-white bg-[#17171C] px-1.5 py-0.5 rounded border border-[#292930] select-all">{organization?.name}</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type exact organization name here..."
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#1F1F24] flex items-center justify-end gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="text-[#A1A1AA] hover:text-[#F5F5F7] border border-[#292930]"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={Trash2}
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            loading={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/50"
          >
            {loading ? 'Deleting Workspace...' : 'Delete Organization'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
