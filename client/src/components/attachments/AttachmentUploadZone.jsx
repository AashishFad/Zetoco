/**
 * AttachmentUploadZone
 * Drag-and-drop & file picker upload component with client-side validation and feedback.
 */
import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import {
  uploadTaskAttachment,
  validateFile,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
} from '../../services/attachmentService';

export default function AttachmentUploadZone({
  organizationId,
  projectId,
  taskId,
  onUploadSuccess,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
    // reset input so the same file can be selected again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFileUpload = async (file) => {
    setErrorMessage('');
    setSuccessMessage('');

    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      const newAttachment = await uploadTaskAttachment({
        organizationId,
        projectId,
        taskId,
        file,
      });

      setSuccessMessage(`Successfully attached "${file.name}"`);
      if (onUploadSuccess) {
        onUploadSuccess(newAttachment);
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-800/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-200">
              {isUploading ? (
                <span className="text-indigo-300">Uploading attachment...</span>
              ) : (
                <>
                  <span className="text-indigo-400 hover:text-indigo-300 font-semibold">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-slate-400">
              PDF, DOC, DOCX, TXT, PNG, JPG, WEBP, ZIP (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center space-x-2 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center space-x-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
