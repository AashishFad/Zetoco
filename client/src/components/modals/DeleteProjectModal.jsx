import React, { useState } from 'react';
import { Modal, Input, Button, useToast } from '../ui';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteProjectModal({ isOpen, onClose, project, onConfirmDelete }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const isConfirmed = confirmText === project?.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    await onConfirmDelete();
    setLoading(false);
    setConfirmText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project?"
      description="This action will permanently delete this project and its associated workspace records."
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-xs text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-200">Warning: Permanent Action</p>
            <p className="mt-0.5 text-red-300/80">
              Are you sure you want to delete <strong className="text-white font-semibold">"{project?.name}"</strong>? This operation cannot be undone.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Type <span className="font-mono text-white bg-surface-950 px-1.5 py-0.5 rounded border border-surface-800">{project?.name}</span> to confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type project name here..."
            autoFocus
          />
        </div>

        <div className="pt-3 border-t border-surface-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={Trash2}
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            loading={loading}
          >
            Delete Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}
