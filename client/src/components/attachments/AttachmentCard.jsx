/**
 * AttachmentCard
 * Displays file information, icon/thumbnail, download trigger, delete action, and image preview trigger.
 */
import React, { useState } from 'react';
import {
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  File,
  Download,
  Trash2,
  Eye,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { formatFileSize, downloadFile, getAttachment } from '../../services/attachmentService';


export default function AttachmentCard({
  attachment,
  onDelete,
  onPreview,
  canDelete = false,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileName = attachment.fileName || '';
  const lowerName = fileName.toLowerCase();
  const isImage =
    attachment.mimeType?.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => lowerName.endsWith(ext));
  const isPdf = lowerName.endsWith('.pdf') || attachment.mimeType === 'application/pdf';
  const isDoc =
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx') ||
    attachment.mimeType?.includes('word');
  const isZip =
    lowerName.endsWith('.zip') ||
    attachment.mimeType?.includes('zip') ||
    attachment.mimeType?.includes('compressed');

  // File Icon & Color theme
  const getFileBadge = () => {
    if (isImage) {
      return {
        icon: <FileImage className="w-5 h-5 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        label: 'IMAGE',
      };
    }
    if (isPdf) {
      return {
        icon: <FileText className="w-5 h-5 text-rose-400" />,
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        label: 'PDF',
      };
    }
    if (isDoc) {
      return {
        icon: <FileText className="w-5 h-5 text-blue-400" />,
        bg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        label: 'DOC',
      };
    }
    if (isZip) {
      return {
        icon: <FileArchive className="w-5 h-5 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        label: 'ZIP',
      };
    }
    return {
      icon: <File className="w-5 h-5 text-slate-400" />,
      bg: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
      label: 'FILE',
    };
  };

  const badge = getFileBadge();

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(attachment.id);
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleOpen = async () => {
    if (isImage && onPreview) {
      onPreview(attachment);
      return;
    }
    let url = attachment.viewUrl || attachment.downloadUrl;
    if (!url && attachment.id) {
      try {
        const fresh = await getAttachment(attachment.id);
        url = fresh?.viewUrl || fresh?.downloadUrl;
      } catch (err) {
        console.warn('Failed to get fresh attachment URL:', err);
      }
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    let url = attachment.downloadUrl || attachment.viewUrl;
    if (!url && attachment.id) {
      try {
        const fresh = await getAttachment(attachment.id);
        url = fresh?.downloadUrl || fresh?.viewUrl;
      } catch (err) {
        console.warn('Failed to get fresh download URL:', err);
      }
    }
    if (url) {
      downloadFile(url, fileName);
    }
  };

  return (
    <div className="group relative flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600/80 rounded-xl transition-all duration-200">
      {/* File Info Left */}
      <div className="flex items-center space-x-3.5 min-w-0 pr-2">
        {/* Thumbnail / Icon */}
        <div
          onClick={handleOpen}
          className={`relative w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${
            badge.bg
          } cursor-pointer hover:opacity-90 ${isImage ? 'overflow-hidden' : ''}`}
          title={isImage ? "Preview Image" : "Open File"}
        >
          {isImage && (attachment.viewUrl || attachment.downloadUrl) ? (
            <img
              src={attachment.viewUrl || attachment.downloadUrl}
              alt={fileName}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            badge.icon
          )}
        </div>

        {/* Title, size, timestamp */}
        <div className="min-w-0">
          <p
            className="text-xs font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs md:max-w-md group-hover:text-indigo-400 transition-colors cursor-pointer"
            onClick={handleOpen}
            title={fileName}
          >
            {fileName}
          </p>
          <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
            <span>{formatFileSize(attachment.fileSize)}</span>
            <span>•</span>
            <span className="truncate">By {attachment.uploaderName || 'Team Member'}</span>
            <span>•</span>
            <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Right */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {isImage && onPreview && (
          <button
            onClick={() => onPreview(attachment)}
            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/60 rounded-lg transition-colors"
            title="Preview Image"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        {/* View in new tab for non-images */}
        {!isImage && (
          <button
            onClick={handleOpen}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 rounded-lg transition-colors"
            title="Open / View File"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleDownload}
          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-700/60 rounded-lg transition-colors"
          title="Download file"
        >
          <Download className="w-4 h-4" />
        </button>


        {canDelete && (
          <>
            {showConfirm ? (
              <div className="flex items-center space-x-1 animate-fade-in">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 rounded-md transition-colors flex items-center space-x-1"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Confirm</span>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                title="Delete attachment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
