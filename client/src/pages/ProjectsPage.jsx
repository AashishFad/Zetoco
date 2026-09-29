import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  BarChart3,
  MessageSquare,
  Files,
  Settings,
  Trello,
  Calendar
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Tabs from '../components/ui/Tabs';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { useToast } from '../components/ui/Toast';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'board', label: 'Board', icon: Trello },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2, badge: '24' },
    { id: 'sprints', label: 'Sprints', icon: Calendar, badge: 'Sprint 14' },
    { id: 'files', label: 'Files', icon: Files },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const projectMembers = [
    'Aashish Fad',
    'Rahul Sharma',
    'Priya Kapoor',
    'Dhruv Mehta',
    'Sneha Patel',
  ];

  const projectMilestones = [
    { name: 'Core Architecture & Auth Setup', status: 'Completed', date: 'Sept 2026', done: true },
    { name: 'Payment Gateway Integration (Stripe)', status: 'In Progress', date: 'Oct 2026', done: false },
    { name: 'Real-Time Inventory WebSockets', status: 'Upcoming', date: 'Nov 2026', done: false },
    { name: 'Production Load Testing & Launch', status: 'Planned', date: 'Dec 2026', done: false },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Project Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-dark-900 via-slate-900 to-brand-950 border border-slate-800 p-6 sm:p-8 shadow-card-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title and Description */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant="brand" size="md">
                Active Project
              </Badge>
              <Badge variant="slate" size="md">
                EC-2026
              </Badge>
              <span className="text-xs text-slate-400">Created by Aashish Fad</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              E-Commerce Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Enterprise customer-facing storefront with multi-tenant catalog, Stripe payment gateway, and automated inventory sync.
            </p>
          </div>

          {/* Progress & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-4">
            <Button
              size="md"
              variant="primary"
              leftIcon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              New Project
            </Button>

            {/* Completion Gauge & Members */}
            <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
              <div>
                <p className="text-[11px] text-slate-400">Project Completion</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">78% Complete</p>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1">Members</p>
                <div className="flex -space-x-2">
                  {projectMembers.map((name, i) => (
                    <Avatar key={i} name={name} size="xs" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-800/80">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => {
              setActiveTab(tabId);
              addToast({
                title: `${tabs.find((t) => t.id === tabId)?.label} Tab Selected`,
                message: 'Tab view updated. Phase 2 visual shell active.',
                type: 'info',
              });
            }}
            variant="underline"
          />
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2 Cols: Milestone Tracker & Key Stats */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Milestone Roadmap</CardTitle>
                <CardDescription>Major release targets and sprint deliverables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectMilestones.map((m, idx) => (
                  <div
                    key={m.name}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          m.done
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-200">{m.name}</p>
                        <p className="text-[11px] text-slate-500">{m.date}</p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        m.status === 'Completed'
                          ? 'success'
                          : m.status === 'In Progress'
                          ? 'brand'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Project Details & Metadata */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Lead Engineer:</span>
                  <span className="text-slate-200 font-semibold">Aashish Fad</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Current Sprint:</span>
                  <span className="text-brand-400 font-semibold font-mono">Sprint 14</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Target Release:</span>
                  <span className="text-slate-200 font-semibold">Q4 2026</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Repository:</span>
                  <span className="text-accent-400 font-mono">github.com/flowsync/store</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Badge variant="brand" size="md" className="mb-3">
              Phase 2 Visual Tab
            </Badge>
            <h3 className="text-lg font-bold text-white">
              {tabs.find((t) => t.id === activeTab)?.label} View
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              This tab shell is ready for Phase 3 PostgreSQL data binding and interactive components.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
