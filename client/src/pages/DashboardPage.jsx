import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  Users,
  Activity,
  Plus,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Server,
  Filter,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Avatar, AvatarGroup, Dropdown, DropdownItem, useToast } from '../components/ui';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { checkFullApiHealth } from '../services/healthService';

export default function DashboardPage() {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    checkFullApiHealth()
      .then((data) => setHealthData(data))
      .catch((err) => setHealthData(err))
      .finally(() => setLoadingHealth(false));
  }, []);

  // Section 11 Requirements: Total Projects: 12, Active Tasks: 28, Completed: 84, Team Members: 16
  const statistics = [
    {
      title: 'Total Projects',
      value: '12',
      change: '+2 this month',
      trend: 'up',
      icon: FolderKanban,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
    },
    {
      title: 'Active Tasks',
      value: '28',
      change: '8 due this week',
      trend: 'up',
      icon: CheckSquare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Completed',
      value: '84',
      change: '+14% vs last sprint',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Team Members',
      value: '16',
      change: '4 active now',
      trend: 'neutral',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  // Recent Projects Mockup
  const recentProjects = [
    {
      id: 1,
      name: 'E-Commerce Platform Redesign',
      code: 'ECP',
      progress: 78,
      status: 'In Progress',
      statusVariant: 'brand',
      tasksCount: '24/32 tasks',
      members: ['Rahul Sharma', 'Priya Patel', 'Dhruv Mehta', 'Aashish Lead'],
      updated: '12m ago',
    },
    {
      id: 2,
      name: 'FlowSync Mobile App (iOS & Android)',
      code: 'FMA',
      progress: 45,
      status: 'In Progress',
      statusVariant: 'brand',
      tasksCount: '18/40 tasks',
      members: ['Sarah Jenkins', 'Dhruv Mehta', 'Aashish Lead'],
      updated: '1h ago',
    },
    {
      id: 3,
      name: 'Authentication & Role-Based Access Engine',
      code: 'AUTH',
      progress: 92,
      status: 'Review',
      statusVariant: 'warning',
      tasksCount: '12/13 tasks',
      members: ['Rahul Sharma', 'Aashish Lead'],
      updated: '3h ago',
    },
  ];

  // Section 11 Requirements: My Tasks (Payment API, Navbar redesign, Database optimization)
  const myTasks = [
    {
      id: 101,
      title: 'Payment API Integration',
      project: 'E-Commerce Platform',
      priority: 'High',
      priorityVariant: 'danger',
      status: 'In Progress',
      statusVariant: 'brand',
      dueDate: 'Tomorrow',
    },
    {
      id: 102,
      title: 'Navbar Redesign & Theme Tokens',
      project: 'FlowSync Core',
      priority: 'Medium',
      priorityVariant: 'warning',
      status: 'Review',
      statusVariant: 'warning',
      dueDate: 'Oct 3',
    },
    {
      id: 103,
      title: 'Database Query Optimization & Indexes',
      project: 'Data Infrastructure',
      priority: 'High',
      priorityVariant: 'danger',
      status: 'Todo',
      statusVariant: 'neutral',
      dueDate: 'Oct 5',
    },
  ];

  // Section 11 Requirements: Recent Activity (Rahul completed "Login API", Priya commented on "Dashboard UI", Dhruv moved "Payment API" to Review)
  const recentActivities = [
    {
      id: 1,
      user: 'Rahul Sharma',
      action: 'completed task',
      target: 'Login API',
      time: '15 mins ago',
      avatar: 'Rahul Sharma',
    },
    {
      id: 2,
      user: 'Priya Patel',
      action: 'commented on',
      target: 'Dashboard UI',
      time: '45 mins ago',
      avatar: 'Priya Patel',
    },
    {
      id: 3,
      user: 'Dhruv Mehta',
      action: 'moved to Review',
      target: 'Payment API',
      time: '2 hours ago',
      avatar: 'Dhruv Mehta',
    },
    {
      id: 4,
      user: 'Sarah Jenkins',
      action: 'uploaded file',
      target: 'Mobile_Design_v2.fig',
      time: '4 hours ago',
      avatar: 'Sarah Jenkins',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Overview Header */}
      <div className="relative bg-gradient-to-r from-surface-900 via-surface-900 to-brand-950/40 border border-surface-800 rounded-3xl p-6 sm:p-8 shadow-card overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-brand-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sprint Cycle 14 • On Track</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good morning, Aashish 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Here is what is happening across your projects and sprint boards today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={FolderKanban}
              onClick={() => setIsProjectModalOpen(true)}
            >
              New Project
            </Button>
            <Button
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Create Task
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statistics.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="bg-surface-900/80 border border-surface-800/80 rounded-2xl p-5 hover:border-surface-700 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{s.title}</span>
                <div className={`p-2.5 rounded-xl border ${s.bg}`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-white tracking-tight">{s.value}</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {s.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Projects & My Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Projects Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Active workspaces with sprint completion metrics</CardDescription>
              </div>
              <Link to="/projects">
                <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-surface-950/60 border border-surface-800/80 hover:border-surface-700/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600/30 to-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-xs text-brand-300 shrink-0">
                      {p.code}
                    </div>
                    <div>
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-brand-300 transition-colors flex items-center gap-2"
                      >
                        <span>{p.name}</span>
                      </Link>
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-1">
                        <span>{p.tasksCount}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {p.updated}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-52 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <AvatarGroup max={3} size="xs">
                        {p.members.map((m) => (
                          <Avatar key={m} name={m} size="xs" />
                        ))}
                      </AvatarGroup>
                      <span className="font-bold text-slate-300">{p.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* My Tasks Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Assigned Tasks</CardTitle>
                <CardDescription>Items scheduled for your active development sprint</CardDescription>
              </div>
              <Link to="/tasks">
                <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
                  View All Tasks
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-surface-950/60 border border-surface-800/80 hover:border-surface-700/80 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => addToast(`Completed task "${t.title}" (UI Demo)`, 'success')}
                      className="w-5 h-5 rounded-lg border border-surface-700 hover:border-brand-500 hover:bg-brand-500/20 flex items-center justify-center text-transparent hover:text-brand-400 transition-colors shrink-0"
                      title="Mark task completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200">{t.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t.project}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant={t.priorityVariant} size="xs">{t.priority}</Badge>
                    <Badge variant={t.statusVariant} size="xs" dot>{t.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Recent Activity Feed & Diagnostics */}
        <div className="space-y-6">
          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Team updates across channels and sprint boards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <Avatar name={act.avatar} size="sm" />
                  <div className="flex-1 text-xs">
                    <p className="text-slate-300">
                      <span className="font-bold text-white">{act.user}</span>{' '}
                      <span className="text-slate-400">{act.action}</span>{' '}
                      <span className="font-semibold text-brand-300">"{act.target}"</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Real-Time Express & DB Health Status */}
          <Card className="border-brand-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-brand-400" />
                  <span>System Diagnostics</span>
                </CardTitle>
                <Badge variant="brand" size="xs" dot>Live</Badge>
              </div>
              <CardDescription>Real-time telemetry from Express API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
                <span className="text-slate-400">REST API Status:</span>
                <Badge variant={healthData?.success ? 'success' : 'danger'} size="xs" dot>
                  {loadingHealth ? 'Checking...' : healthData?.success ? '200 OK' : 'Offline'}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
                <span className="text-slate-400">PostgreSQL Pool:</span>
                <Badge variant={healthData?.database?.connected ? 'success' : 'warning'} size="xs" dot>
                  {loadingHealth ? 'Checking...' : healthData?.database?.connected ? 'Connected' : 'Configured'}
                </Badge>
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-2">
                Phase 2 UI Architecture Active
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
      <CreateProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
    </div>
  );
}
