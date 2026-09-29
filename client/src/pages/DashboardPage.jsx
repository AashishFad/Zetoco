import React, { useState } from 'react';
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
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
  MoreVertical
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';

export default function DashboardPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const stats = [
    {
      title: 'Total Projects',
      value: '12',
      change: '+2 this month',
      trend: 'up',
      icon: FolderKanban,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      border: 'border-brand-500/20',
    },
    {
      title: 'Active Tasks',
      value: '28',
      change: '8 due this week',
      trend: 'neutral',
      icon: CheckSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      title: 'Completed',
      value: '84',
      change: '+14% from last sprint',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Team Members',
      value: '16',
      change: '4 active now',
      trend: 'up',
      icon: Users,
      color: 'text-accent-400',
      bg: 'bg-accent-500/10',
      border: 'border-accent-500/20',
    },
  ];

  const recentProjects = [
    {
      id: 1,
      name: 'E-Commerce Platform',
      category: 'Engineering',
      progress: 78,
      tasks: '24 / 32 tasks',
      status: 'On Track',
      statusVariant: 'success',
      members: ['Aashish Fad', 'Rahul S.', 'Priya K.', 'Dhruv M.'],
      updated: '15 mins ago',
    },
    {
      id: 2,
      name: 'Mobile App Redesign',
      category: 'Product & Design',
      progress: 54,
      tasks: '14 / 26 tasks',
      status: 'In Review',
      statusVariant: 'brand',
      members: ['Priya K.', 'Sneha P.', 'Aashish Fad'],
      updated: '2 hours ago',
    },
    {
      id: 3,
      name: 'DevOps & CI/CD Pipeline',
      category: 'Infrastructure',
      progress: 30,
      tasks: '6 / 20 tasks',
      status: 'Sprint Planning',
      statusVariant: 'warning',
      members: ['Rahul S.', 'Vikram R.'],
      updated: 'Yesterday',
    },
  ];

  const myTasks = [
    {
      id: 1,
      title: 'Payment API',
      priority: 'High',
      priorityVariant: 'danger',
      status: 'In Progress',
      statusVariant: 'brand',
      due: 'Today',
      project: 'E-Commerce',
    },
    {
      id: 2,
      title: 'Navbar redesign',
      priority: 'Medium',
      priorityVariant: 'warning',
      status: 'Review',
      statusVariant: 'accent',
      due: 'Tomorrow',
      project: 'Mobile App',
    },
    {
      id: 3,
      title: 'Database optimization',
      priority: 'High',
      priorityVariant: 'danger',
      status: 'Todo',
      statusVariant: 'slate',
      due: 'Oct 3',
      project: 'Infrastructure',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: 'Rahul S.',
      action: 'completed',
      target: 'Login API',
      time: '12m ago',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    {
      id: 2,
      user: 'Priya K.',
      action: 'commented on',
      target: 'Dashboard UI',
      time: '45m ago',
      icon: MessageSquare,
      iconColor: 'text-brand-400',
    },
    {
      id: 3,
      user: 'Dhruv M.',
      action: 'moved',
      target: 'Payment API to Review',
      time: '2h ago',
      icon: TrendingUp,
      iconColor: 'text-accent-400',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-950 via-slate-900 to-dark-950 border border-brand-500/25 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-card-subtle overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-brand-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Sprint 14 • Q4 Engineering Goal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Good morning, Aashish 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
            Here is your current team workload, sprint velocity, and active project milestones for today.
          </p>
        </div>

        {/* Quick Action CTA Buttons */}
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={CheckSquare}
            onClick={() => setIsTaskModalOpen(true)}
          >
            New Task
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsProjectModalOpen(true)}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`p-5 rounded-2xl bg-dark-900/90 border border-slate-800/80 shadow-sm transition-all hover:border-slate-700/80 hover:translate-y-[-1px]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-slate-400">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Projects, Tasks, and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recent Projects & My Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Projects Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Track milestones and progress across active team workspaces</CardDescription>
              </div>
              <Link to="/projects">
                <Button variant="ghost" size="sm" rightIcon={ArrowRight}>
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-bold text-white hover:text-brand-300 cursor-pointer">
                        {project.name}
                      </h4>
                      <Badge variant={project.statusVariant} size="sm">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{project.category}</span>
                      <span>•</span>
                      <span>{project.tasks}</span>
                      <span>•</span>
                      <span className="text-slate-500">Updated {project.updated}</span>
                    </div>
                  </div>

                  {/* Progress Bar & Avatars */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:w-48">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="flex -space-x-1.5 overflow-hidden">
                      {project.members.map((m, i) => (
                        <Avatar key={i} name={m} size="xs" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* My Tasks Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>Tasks currently assigned to your development queue</CardDescription>
              </div>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" rightIcon={ArrowRight}>
                  All Tasks
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-800/80">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-800/80 flex items-center justify-center cursor-pointer hover:border-brand-500">
                        <span className="text-[10px] text-transparent hover:text-brand-400">✓</span>
                      </div>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white cursor-pointer truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{task.project}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge variant={task.priorityVariant} size="sm">
                        {task.priority}
                      </Badge>
                      <Badge variant={task.statusVariant} size="sm">
                        {task.status}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                        {task.due}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Activity Feed & Quick Recruiter Overview */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Live events across your workspace team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <Avatar name={act.user} size="sm" />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-slate-300 leading-snug">
                        <strong className="text-white font-semibold">{act.user}</strong>{' '}
                        <span className="text-slate-400">{act.action}</span>{' '}
                        <strong className="text-brand-300 font-medium">"{act.target}"</strong>
                      </p>
                      <p className="text-[10px] text-slate-500">{act.time}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Kanban Preview Shortcut */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-950 to-dark-900 border border-brand-500/30 text-left space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="brand" size="sm">
                Phase 2 UI Showcase
              </Badge>
              <span className="text-xs text-slate-400">5 Columns Ready</span>
            </div>
            <h4 className="text-sm font-bold text-white">Interactive Kanban Board</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore the multi-stage board with priority tags, task attribution, and visual columns.
            </p>
            <Link to="/kanban" className="block pt-1">
              <Button size="sm" variant="primary" rightIcon={ArrowRight} className="w-full">
                Open Kanban Board
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
