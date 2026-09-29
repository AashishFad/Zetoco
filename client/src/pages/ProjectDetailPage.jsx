import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  Kanban,
  CheckSquare,
  Milestone,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Clock,
  ArrowLeft,
  Share2,
  Calendar,
  Users
} from 'lucide-react';
import { Button, Badge, Avatar, AvatarGroup, Tabs, Card, CardHeader, CardTitle, CardContent, useToast } from '../components/ui';
import KanbanBoardView from '../components/kanban/KanbanBoardView';
import CreateTaskModal from '../components/modals/CreateTaskModal';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { addToast } = useToast();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: 32 },
    { id: 'sprints', label: 'Sprints', icon: Milestone, count: 2 },
    { id: 'files', label: 'Files', icon: FileText, count: 8 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const members = ['Aashish Lead', 'Rahul Sharma', 'Priya Patel', 'Dhruv Mehta', 'Sarah Jenkins'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Top Section Header (Section 12 Requirements) */}
      <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                ECP-CORE
              </span>
              <Badge variant="brand" size="xs" dot>Sprint 14 Active</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              E-Commerce Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Full-stack multi-vendor shopping engine with real-time checkout, inventory reconciliation, and payment gateway.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* 78% Complete Gauge */}
            <div className="bg-surface-950/80 p-3.5 px-5 rounded-2xl border border-surface-800">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">Progress:</span>
                <span className="text-sm font-black text-white">78% Complete</span>
              </div>
              <div className="w-36 h-2 bg-surface-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                  style={{ width: '78%' }}
                />
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Team Members</span>
              <AvatarGroup max={4} size="sm">
                {members.map((m) => (
                  <Avatar key={m} name={m} size="sm" />
                ))}
              </AvatarGroup>
            </div>

            {/* Action */}
            <Button
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Navigation Tabs (Section 12 Requirements) */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Tab Content Display */}
      {activeTab === 'board' && (
        <KanbanBoardView onAddTask={() => setIsTaskModalOpen(true)} />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sprint Objectives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <p>• Finalize Stripe webhooks and payment confirmation endpoints.</p>
              <p>• Implement role-based permission checks for vendor admin panels.</p>
              <p>• Conduct performance benchmarks on high-concurrency cart checkouts.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-surface-800">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold text-white">Aashish Lead</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-800">
                <span className="text-slate-400">Created:</span>
                <span className="text-slate-300">Sep 15, 2026</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-800">
                <span className="text-slate-400">Target Launch:</span>
                <span className="text-brand-300 font-semibold">Oct 30, 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab !== 'board' && activeTab !== 'overview' && (
        <Card className="p-8 text-center text-slate-400">
          <p className="text-sm font-semibold text-white">
            {tabs.find((t) => t.id === activeTab)?.label} View
          </p>
          <p className="text-xs mt-1">
            This tab establishes the visual design architecture for Phase 2. Data management will arrive in future phases.
          </p>
        </Card>
      )}

      <CreateTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
    </div>
  );
}
