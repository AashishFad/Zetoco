/**
 * UploadFileModal
 * Modal dialog for uploading workspace files with project selection, optional task association,
 * drag-and-drop file picker, client-side validation, and progress states.
 */
import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, File, AlertCircle, X } from 'lucide-react';
import { Modal, Button, Select, useToast } from '../ui';
import * as attachmentService from '../../services/attachmentService';
import * as taskService from '../../services/taskService';

export default function UploadFileModal({
  isOpen,
  onClose,
  organizationId,
  projects = [],
  initialProjectId = 'ALL',
  onUploadSuccess,
}) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Set default selected project when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSelectedFile(null);
      if (initialProjectId && initialProjectId !== 'ALL') {
        setSelectedProjectId(initialProjectId);
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      } else {
        setSelectedProjectId('');
      }
    }
  }, [isOpen, initialProjectId, projects]);

  // Load tasks when selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setSelectedTaskId('');
      return;
    }

    let isMounted = true;
    setTasksLoading(true);
    taskService
      .getTasksByProject(selectedProjectId)
      .then((data) => {
        if (!isMounted) return;
        setTasks(data || []);
        setSelectedTaskId('');
      })
      .catch((err) => {
        console.warn('Failed to load tasks for selected project:', err);
        if (isMounted) setTasks([]);
      })
      .finally(() => {
        if (isMounted) setTasksLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleSelectFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      handleSelectFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = (file) => {
    setErrorMessage('');
    const validation = attachmentService.validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }
    if (!selectedProjectId) {
      setErrorMessage('Please select a project.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');

      const result = await attachmentService.uploadWorkspaceAttachment({
        organizationId,
        projectId: selectedProjectId,
        taskId: selectedTaskId || null,
        file: selectedFile,
      });

      addToast(`"${selectedFile.name}" uploaded successfully!`, 'success');
      if (onUploadSuccess) {
        onUploadSuccess(result?.data || result);
      }
      onClose();
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isUploading && onClose()}
      title="Upload Workspace File"
      description="Upload a document, image, or asset to this workspace."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Project <span className="text-rose-400">*</span>
          </label>
          {projects.length === 0 ? (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
              No projects available. Please create a project before uploading files.
            </p>
          ) : (
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isUploading}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
            />
          )}
        </div>

        {/* Task Selection (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Task <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <Select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={isUploading || tasksLoading || !selectedProjectId}
            options={[
              {
                label: tasksLoading ? 'Loading tasks...' : 'General / Workspace Attachment',
                value: '',
              },
              ...tasks.map((t) => ({ label: t.title, value: t.id })),
            ]}
          />
        </div>

        {/* Dropzone / File Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select File <span className="text-rose-400">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={attachmentService.ALLOWED_EXTENSIONS.join(',')}
            disabled={isUploading}
          />

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-surface-700 hover:border-surface-600 bg-surface-800/40 hover:bg-surface-800/70'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-surface-700/60 border border-surface-600 text-slate-300 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-brand-400" />
              </div>
              <p className="text-xs font-semibold text-white text-center">
                Click to browse or drag and drop a file
              </p>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                PDF, Word, Images, Zip, Text files up to 10 MB
              </p>
            </div>
          ) : (
            <div className="p-4 bg-surface-800/60 border border-surface-700 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {attachmentService.formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-surface-700 rounded-lg transition-colors ml-2"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-surface-800 flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isUploading}
            disabled={!selectedFile || !selectedProjectId || isUploading}
            leftIcon={UploadCloud}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
