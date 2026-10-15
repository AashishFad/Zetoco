/**
 * ImagePreviewModal
 * Full-screen lightbox modal to preview image attachments with zoom, metadata, and download link.
 */
import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { formatFileSize, downloadFile } from '../../services/attachmentService';

export default function ImagePreviewModal({ isOpen, onClose, attachment }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !attachment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate">
                {attachment.fileName || 'Image Preview'}
              </h3>
              <p className="text-xs text-slate-400">
                {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploaderName || 'Team Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {(attachment.viewUrl || attachment.downloadUrl) && (
              <button
                onClick={() => {
                  const url = attachment.viewUrl || attachment.downloadUrl;
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Open full size in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}

            {(attachment.downloadUrl || attachment.viewUrl) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  downloadFile(attachment.downloadUrl || attachment.viewUrl, attachment.fileName);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700"
                title="Download image"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950/50">
          <img
            src={attachment.viewUrl || attachment.downloadUrl}
            alt={attachment.fileName}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
