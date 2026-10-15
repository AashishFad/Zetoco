/**
 * FilesPage
 * Full-featured workspace file & asset directory displaying all files across projects and tasks.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Folder,
  Search,
  Download,
  Trash2,
  Filter,
  Eye,
  RefreshCw,
  HardDrive,
  FileImage,
  FileArchive,
  File,
  Layers,
  ExternalLink,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  useToast,
  Avatar,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import * as attachmentService from '../services/attachmentService';
import * as projectService from '../services/projectService';
import ImagePreviewModal from '../components/attachments/ImagePreviewModal';
import UploadFileModal from '../components/attachments/UploadFileModal';


const FILE_TYPE_OPTIONS = [
  { label: 'All File Types', value: 'ALL' },
  { label: 'Images (PNG, JPG, WEBP)', value: 'IMAGE' },
  { label: 'PDF Documents', value: 'PDF' },
  { label: 'Word Documents (DOC, DOCX)', value: 'DOC' },
  { label: 'Archives (ZIP)', value: 'ZIP' },
  { label: 'Other Files', value: 'OTHER' },
];

export default function FilesPage() {
  const { user, currentOrg } = useAuth();
  const { currentOrganization } = useOrganization();
  const { addToast } = useToast();

  const orgId = currentOrg?.id || currentOrganization?.id;

  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [selectedFileType, setSelectedFileType] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Image Preview Lightbox
  const [previewFile, setPreviewFile] = useState(null);

  // Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fetch projects list for dropdown
  const loadProjects = useCallback(async () => {
    if (!orgId) return;
    try {
      const projectList = await projectService.getProjects(orgId);
      setProjects(projectList || []);
    } catch (err) {
      console.warn('Failed to load projects for files page:', err);
    }
  }, [orgId]);

  // Fetch workspace attachments
  const loadFiles = useCallback(async (showSpinner = true) => {
    if (!orgId) return;
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const params = { organizationId: orgId };
      if (selectedProjectId !== 'ALL') {
        params.projectId = selectedProjectId;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const data = await attachmentService.getWorkspaceAttachments(params);
      setFiles(data || []);
    } catch (err) {
      console.error('Failed to load workspace files:', err);
      addToast('Failed to load workspace files', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgId, selectedProjectId, search, addToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Client-side filtering for file types
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (selectedFileType === 'ALL') return true;
      const lower = (f.fileName || '').toLowerCase();
      const mime = (f.mimeType || '').toLowerCase();

      if (selectedFileType === 'IMAGE') {
        return (
          mime.startsWith('image/') ||
          ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => lower.endsWith(ext))
        );
      }
      if (selectedFileType === 'PDF') {
        return lower.endsWith('.pdf') || mime === 'application/pdf';
      }
      if (selectedFileType === 'DOC') {
        return (
          lower.endsWith('.doc') ||
          lower.endsWith('.docx') ||
          mime.includes('word') ||
          mime.includes('officedocument')
        );
      }
      if (selectedFileType === 'ZIP') {
        return lower.endsWith('.zip') || mime.includes('zip') || mime.includes('compressed');
      }
      if (selectedFileType === 'OTHER') {
        const isKnown =
          mime.startsWith('image/') ||
          lower.endsWith('.pdf') ||
          lower.endsWith('.doc') ||
          lower.endsWith('.docx') ||
          lower.endsWith('.zip');
        return !isKnown;
      }
      return true;
    });
  }, [files, selectedFileType]);

  // Storage Stats Calculation
  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  }, [files]);

  const handleDeleteFile = async (fileId) => {
    try {
      const res = await attachmentService.deleteAttachment(fileId);
      if (res.success) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        addToast('File deleted successfully', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete file', 'error');
    }
  };

  const handleOpenFile = async (file) => {
    if (!file) return;
    const badge = getFileBadge(file);
    if (badge.isImage) {
      setPreviewFile(file);
      return;
    }

    let url = file.viewUrl || file.downloadUrl;
    if (!url) {
      try {
        const fresh = await attachmentService.getAttachment(file.id);
        url = fresh?.viewUrl || fresh?.downloadUrl;
      } catch (err) {
        console.warn('Failed to get fresh attachment URL:', err);
      }
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      addToast('Unable to open file. Preview URL is not available.', 'error');
    }
  };

  const handleDownloadFile = async (e, file) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!file) return;

    let url = file.downloadUrl || file.viewUrl;
    if (!url) {
      try {
        const fresh = await attachmentService.getAttachment(file.id);
        url = fresh?.downloadUrl || fresh?.viewUrl;
      } catch (err) {
        console.warn('Failed to get fresh download URL:', err);
      }
    }

    if (url) {
      attachmentService.downloadFile(url, file.fileName);
    } else {
      addToast('Unable to download file. Download URL is not available.', 'error');
    }
  };


  const getFileBadge = (file) => {
    const lower = (file.fileName || '').toLowerCase();
    const mime = (file.mimeType || '').toLowerCase();

    if (
      mime.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => lower.endsWith(ext))
    ) {
      return {
        icon: <FileImage className="w-5 h-5 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        tag: 'IMAGE',
        isImage: true,
      };
    }
    if (lower.endsWith('.pdf') || mime === 'application/pdf') {
      return {
        icon: <FileText className="w-5 h-5 text-rose-400" />,
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        tag: 'PDF',
        isImage: false,
      };
    }
    if (lower.endsWith('.doc') || lower.endsWith('.docx') || mime.includes('word')) {
      return {
        icon: <FileText className="w-5 h-5 text-blue-400" />,
        bg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        tag: 'DOC',
        isImage: false,
      };
    }
    if (lower.endsWith('.zip') || mime.includes('zip')) {
      return {
        icon: <FileArchive className="w-5 h-5 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        tag: 'ZIP',
        isImage: false,
      };
    }
    return {
      icon: <File className="w-5 h-5 text-slate-400" />,
      bg: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
      tag: 'FILE',
      isImage: false,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
            Files & Attachments
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Centralized library of uploaded documents, images, and attachments across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            loading={refreshing}
            onClick={() => loadFiles(false)}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={UploadCloud}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload File
          </Button>
        </div>
      </div>

      {/* Storage Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#111114] border border-[#292930] rounded-lg flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-md bg-[#17171C] border border-[#1F1F24] text-indigo-400 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#71717A]">Storage Used</p>
            <h3 className="text-base font-semibold text-[#F5F5F7] mt-0.5">
              {attachmentService.formatFileSize(totalSizeBytes)}
            </h3>
          </div>
        </div>

        <div className="p-4 bg-[#111114] border border-[#292930] rounded-lg flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-md bg-[#17171C] border border-[#1F1F24] text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#71717A]">Total Files</p>
            <h3 className="text-base font-semibold text-[#F5F5F7] mt-0.5">{files.length} Files</h3>
          </div>
        </div>

        <div className="p-4 bg-[#111114] border border-[#292930] rounded-lg flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-md bg-[#17171C] border border-[#1F1F24] text-indigo-400 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#71717A]">Storage Provider</p>
            <h3 className="text-base font-semibold text-[#F5F5F7] mt-0.5">Supabase Storage</h3>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111114] border border-[#292930] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        {/* Search */}
        <div className="sm:col-span-5">
          <Input
            placeholder="Search files by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </div>

        {/* Project Selector */}
        <div className="sm:col-span-4">
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={[
              { label: 'All Projects', value: 'ALL' },
              ...projects.map((p) => ({ label: p.name, value: p.id })),
            ]}
          />
        </div>

        {/* File Type Selector */}
        <div className="sm:col-span-3">
          <Select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            options={FILE_TYPE_OPTIONS}
          />
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading workspace files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-12 text-center bg-surface-900 border border-surface-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No files found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || selectedProjectId !== 'ALL' || selectedFileType !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'Files attached to tasks or uploaded directly will automatically appear in this centralized library.'}
            </p>
            <div className="pt-3">
              <Button
                variant="primary"
                size="sm"
                leftIcon={UploadCloud}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload File
              </Button>
            </div>
          </div>
        </div>

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const badge = getFileBadge(file);
            const canDelete =
              file.isUploader || user?.role === 'admin' || currentOrg?.role === 'admin';

            return (
              <Card
                key={file.id}
                hover
                className="p-4 flex flex-col justify-between space-y-3.5 group bg-surface-900 border-surface-800 hover:border-surface-700 transition-all"
              >
                {/* Top header: Icon & Type badge */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => handleOpenFile(file)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      badge.bg
                    } cursor-pointer hover:opacity-90 transition-opacity ${badge.isImage ? 'overflow-hidden' : ''}`}
                    title={badge.isImage ? 'Preview Image' : 'Open / View File'}
                  >
                    {badge.isImage && (file.viewUrl || file.downloadUrl) ? (
                      <img
                        src={file.viewUrl || file.downloadUrl}
                        alt={file.fileName}
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                      />
                    ) : (
                      badge.icon
                    )}
                  </div>
                  <Badge variant="neutral" size="xs">
                    {badge.tag}
                  </Badge>
                </div>

                {/* File Details */}
                <div className="space-y-1">
                  <h4
                    className="text-xs font-bold text-white truncate group-hover:text-brand-400 transition-colors cursor-pointer"
                    onClick={() => handleOpenFile(file)}
                    title={file.fileName}
                  >
                    {file.fileName}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {attachmentService.formatFileSize(file.fileSize)} • By {file.uploaderName || 'Team Member'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Task: <span className="text-slate-400">{file.taskTitle || 'Project Task'}</span>
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-surface-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center space-x-1">
                    {badge.isImage && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Preview Image"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* View in new tab button */}
                    <button
                      onClick={() => handleOpenFile(file)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Open / View File"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {/* Download button */}
                    <button
                      onClick={(e) => handleDownloadFile(e, file)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>


                    {canDelete && (
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      <ImagePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        attachment={previewFile}
      />

      {/* Workspace File Upload Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        organizationId={orgId}
        projects={projects}
        initialProjectId={selectedProjectId}
        onUploadSuccess={() => {
          loadFiles(false);
        }}
      />
    </div>
  );
}

