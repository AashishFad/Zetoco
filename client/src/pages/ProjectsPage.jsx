import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  CheckSquare,
  Clock,
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Avatar, AvatarGroup, Dropdown, DropdownItem, useToast } from '../components/ui';
import CreateProjectModal from '../components/modals/CreateProjectModal';

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { addToast } = useToast();

  const projects = [
    {
      id: 'e-commerce-platform',
      name: 'E-Commerce Platform',
      description: 'Full-stack multi-vendor shopping engine with real-time checkout and payment gateway.',
      code: 'ECP',
      progress: 78,
      status: 'In Progress',
      statusVariant: 'brand',
      completedTasks: 24,
      totalTasks: 32,
      members: ['Rahul Sharma', 'Priya Patel', 'Dhruv Mehta', 'Aashish Lead'],
      lead: 'Aashish Lead',
      updated: '12 mins ago',
    },
    {
      id: 'flowsync-mobile-app',
      name: 'FlowSync Mobile App',
      description: 'React Native companion app providing push notifications, offline board views and chat.',
      code: 'FMA',
      progress: 45,
      status: 'In Progress',
      statusVariant: 'brand',
      completedTasks: 18,
      totalTasks: 40,
      members: ['Sarah Jenkins', 'Dhruv Mehta', 'Aashish Lead'],
      lead: 'Sarah Jenkins',
      updated: '1 hour ago',
    },
    {
      id: 'auth-rbac-engine',
      name: 'Authentication & RBAC Engine',
      description: 'Centralized OAuth2 and JWT authorization microservice with multi-tenant permissions.',
      code: 'AUTH',
      progress: 92,
      status: 'Review',
      statusVariant: 'warning',
      completedTasks: 12,
      totalTasks: 13,
      members: ['Rahul Sharma', 'Aashish Lead'],
      lead: 'Rahul Sharma',
      updated: '3 hours ago',
    },
    {
      id: 'analytics-dashboard',
      name: 'Analytics & Reporting Suite',
      description: 'Real-time velocity tracking, team burndown charts and project KPI forecasting engine.',
      code: 'ANL',
      progress: 15,
      status: 'Planning',
      statusVariant: 'neutral',
      completedTasks: 3,
      totalTasks: 20,
      members: ['Priya Patel', 'Dhruv Mehta'],
      lead: 'Priya Patel',
      updated: 'Yesterday',
    },
  ];

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your organization workspaces, roadmaps, and sprint boards.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={Plus}
          onClick={() => setIsCreateOpen(true)}
        >
          New Project
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-900/60 p-3 rounded-2xl border border-surface-800">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Badge variant="brand" size="md">
            {filteredProjects.length} Active Projects
          </Badge>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((p) => (
          <Card key={p.id} hover className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-sm text-brand-300">
                  {p.code}
                </div>
                <div>
                  <Link
                    to={`/projects/${p.id}`}
                    className="text-base font-bold text-white hover:text-brand-300 transition-colors"
                  >
                    {p.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 mt-0.5">Lead: {p.lead}</p>
                </div>
              </div>

              <Badge variant={p.statusVariant} size="xs" dot>
                {p.status}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {p.description}
              </p>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">
                    {p.completedTasks} / {p.totalTasks} tasks
                  </span>
                  <span className="font-bold text-slate-200">{p.progress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>

            <div className="p-5 pt-3 border-t border-surface-800 flex items-center justify-between">
              <AvatarGroup max={3} size="xs">
                {p.members.map((m) => (
                  <Avatar key={m} name={m} size="xs" />
                ))}
              </AvatarGroup>

              <Link to={`/projects/${p.id}`}>
                <Button variant="outline" size="xs" rightIcon={ArrowRight}>
                  View Board
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
