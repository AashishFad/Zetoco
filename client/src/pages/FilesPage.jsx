import React, { useState } from 'react';
import { FileText, Upload, Folder, Search, Download, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, useToast } from '../components/ui';

export default function FilesPage() {
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const files = [
    { name: 'FlowSync_Design_System_v2.fig', size: '24.5 MB', type: 'Design', updated: '2 hours ago', uploader: 'Sarah Jenkins' },
    { name: 'PostgreSQL_Schema_Architecture.pdf', size: '2.1 MB', type: 'Documentation', updated: 'Yesterday', uploader: 'Aashish Lead' },
    { name: 'API_Contract_REST_Endpoints.yaml', size: '340 KB', type: 'Code', updated: 'Sep 24, 2026', uploader: 'Rahul Sharma' },
    { name: 'Sprint_14_Retrospective_Report.docx', size: '1.2 MB', type: 'Report', updated: 'Sep 22, 2026', uploader: 'Priya Patel' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workspace Files & Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centralized document and asset repository for project teams.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={Upload}
          onClick={() => addToast('File upload is a Phase 2 UI preview', 'info')}
        >
          Upload Asset
        </Button>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
        <Input
          placeholder="Filter files by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={Search}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <Card key={file.name} hover className="p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <Badge variant="neutral" size="xs">{file.type}</Badge>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={file.name}>
                {file.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">{file.size} • by {file.uploader}</p>
            </div>

            <div className="pt-2 border-t border-surface-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">{file.updated}</span>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={Download}
                onClick={() => addToast(`Downloading ${file.name} (Simulation)`, 'success')}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
