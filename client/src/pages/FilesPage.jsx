import React from 'react';
import { Files, Upload, FileText, Image, FileCode, Clock, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';

export default function FilesPage() {
  const { addToast } = useToast();

  const mockFiles = [
    { name: 'architecture-diagram-v2.png', size: '2.4 MB', type: 'Image', uploadedBy: 'Aashish Fad', date: 'Sept 28, 2026', icon: Image },
    { name: 'api-specification-openapi.yaml', size: '142 KB', type: 'Code', uploadedBy: 'Rahul Sharma', date: 'Sept 27, 2026', icon: FileCode },
    { name: 'sprint-14-planning-notes.pdf', size: '840 KB', type: 'Document', uploadedBy: 'Priya Kapoor', date: 'Sept 26, 2026', icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Workspace Files & Assets
            </h1>
            <Badge variant="brand" size="sm">
              Phase 2 Shell
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized document, image, and asset repository for project attachments.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          leftIcon={Upload}
          onClick={() =>
            addToast({
              title: 'File Upload (Demo)',
              message: 'Cloud object storage integration is scheduled for Phase 6.',
              type: 'info',
            })
          }
        >
          Upload Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockFiles.map((file) => {
          const Icon = file.icon;
          return (
            <Card key={file.name} hover>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="slate" size="sm">
                    {file.size}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Uploaded by {file.uploadedBy}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{file.date}</span>
                  <button
                    type="button"
                    onClick={() =>
                      addToast({
                        title: 'Download (Demo)',
                        message: `Downloading ${file.name}`,
                        type: 'info',
                      })
                    }
                    className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
