import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Database,
  CheckCircle2,
  Code2,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Bell,
  Sparkles,
  BarChart3,
  GitBranch,
  Terminal,
  Activity,
  Workflow
} from 'lucide-react';
import { Button, Badge, Card, CardContent } from '../components/ui';
import { APP_NAME, APP_TAGLINE } from '../constants';
import { checkFullApiHealth } from '../services/healthService';

export default function LandingPage() {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    checkFullApiHealth()
      .then((data) => setSystemHealth(data))
      .catch((err) => setSystemHealth(err))
      .finally(() => setLoadingHealth(false));
  }, []);

  const features = [
    {
      title: 'Agile Project Tracking',
      description: 'Structured sprint boards, backlogs, and task lifecycle management inspired by Jira and Linear.',
      icon: FolderKanban,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Interactive Kanban Boards',
      description: 'Visual status workflows with granular priority tags, deadlines, and multi-assignee tracking.',
      icon: CheckSquare,
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Real-Time Team Communication',
      description: 'Dedicated topic channels, threaded discussions, and direct messages inspired by Slack.',
      icon: MessageSquare,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Intelligent Notification Engine',
      description: 'Contextual notification dispatch for task assignments, sprint deadlines, and team mentions.',
      icon: Bell,
      gradient: 'from-amber-500 to-rose-600',
    },
    {
      title: 'Role-Based Access Control',
      description: 'Multi-tenant organization architecture with granular admin, manager, and member permissions.',
      icon: Shield,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Velocity & Project Analytics',
      description: 'Real-time sprint velocity charts, burndown metrics, and project completion forecasting.',
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  const workflowSteps = [
    { step: '01', title: 'Create Workspace', desc: 'Initialize an organization with role-based member permissions.' },
    { step: '02', title: 'Create Project', desc: 'Define sprint cycles, roadmaps, and custom workflows.' },
    { step: '03', title: 'Assign Tasks', desc: 'Distribute backlog items with priority matrices and due dates.' },
    { step: '04', title: 'Collaborate', desc: 'Sync in real-time with channel discussions and live updates.' },
    { step: '05', title: 'Track Progress', desc: 'Deliver software on schedule with analytics and Kanban boards.' },
  ];

  const plannedModules = [
    { name: 'Phase 1: Project Foundation & Architecture', status: 'Completed', current: false },
    { name: 'Phase 2: UI/UX Foundation & Design System', status: 'Completed', current: true },
    { name: 'Phase 3: Database Schemas & Authentication', status: 'Planned', current: false },
    { name: 'Phase 4: Organizations & Projects Engine', status: 'Planned', current: false },
    { name: 'Phase 5: Tasks & Kanban Board System', status: 'Planned', current: false },
    { name: 'Phase 6: Real-Time Team Messaging', status: 'Planned', current: false },
    { name: 'Phase 7: Notification Dispatch & File Handling', status: 'Planned', current: false },
    { name: 'Phase 8: Testing, CI/CD & Cloud Deployment', status: 'Planned', current: false },
  ];

  return (
    <div className="space-y-28 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 lg:pt-36">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-brand-600/20 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[220px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Recruiter / Portfolio Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Full-Stack Portfolio Project • Recruiter Demonstration</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            {APP_NAME}
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-200 to-cyan-300 mt-4 max-w-2xl mx-auto">
            {APP_TAGLINE}
          </p>

          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive project and team collaboration platform inspired by Jira, Trello, and Slack. 
            Engineered to demonstrate production-grade full-stack architecture with 
            <span className="text-slate-200 font-semibold"> React</span>, 
            <span className="text-slate-200 font-semibold"> Express.js</span>, and 
            <span className="text-slate-200 font-semibold"> PostgreSQL</span>.
          </p>

          {/* Hero CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" rightIcon={ArrowRight}>
                Get Started
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button size="lg" variant="secondary" leftIcon={Layers}>
                Explore Demo
              </Button>
            </Link>
          </div>

          {/* Live System Diagnostics Widget */}
          <div className="mt-16 max-w-3xl mx-auto bg-surface-900/90 border border-surface-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-left">
            <div className="flex items-center justify-between border-b border-surface-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live System & Architecture Diagnostic
                </span>
              </div>
              <Badge variant="brand" size="xs" dot>Live Polling</Badge>
            </div>

            {loadingHealth ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Querying Express REST API (/api/health/full)...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/90">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Express REST API:</span>
                    <Badge variant={systemHealth?.success ? 'success' : 'danger'} size="xs" dot>
                      {systemHealth?.success ? 'Running (200 OK)' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="mt-2 text-slate-500 text-[11px] truncate">
                    Endpoint: <code className="text-brand-300">/api/health</code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800/90">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">PostgreSQL Pool:</span>
                    <Badge variant={systemHealth?.database?.connected ? 'success' : 'warning'} size="xs" dot>
                      {systemHealth?.database?.connected ? 'Connected' : 'Configured'}
                    </Badge>
                  </div>
                  <div className="mt-2 text-slate-500 text-[11px] truncate">
                    {systemHealth?.database?.connected
                      ? `PG: ${systemHealth?.database?.version?.substring(0, 24)}...`
                      : 'Connection pool ready in .env'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" size="sm" className="mb-3">Comprehensive Toolset</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for High-Performing Teams
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            FlowSync unifies project management, sprint planning, and team collaboration into a seamless workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-surface-900/60 border border-surface-800/80 rounded-2xl p-6 hover:border-surface-700 transition-all hover:translate-y-[-2px] hover:shadow-card group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${f.gradient} flex items-center justify-center shadow-lg mb-5 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-surface-900 to-surface-950 border border-surface-800 rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="cyan" size="sm" className="mb-3">Streamlined Process</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How FlowSync Works
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              From workspace setup to sprint completion in five simple stages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((s, idx) => (
              <div
                key={s.step}
                className="relative bg-surface-900/80 border border-surface-800/90 rounded-2xl p-5 hover:border-brand-500/50 transition-all"
              >
                <span className="text-2xl font-black text-brand-500/40">{s.step}</span>
                <h4 className="text-sm font-bold text-white mt-2 mb-1">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                {idx < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600 z-10">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progressive Roadmap Section */}
      <section id="roadmap" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="purple" size="sm" className="mb-3">Development Roadmap</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineering Phases & Milestones
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            FlowSync follows a strict modular implementation strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plannedModules.map((item, idx) => (
            <div
              key={item.name}
              className={`p-4 rounded-xl border transition-all ${
                item.current
                  ? 'bg-brand-950/40 border-brand-500/60 shadow-lg shadow-brand-500/10'
                  : item.status === 'Completed'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-surface-900/40 border-surface-800 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">Phase {idx + 1}</span>
                <Badge
                  variant={item.current ? 'brand' : item.status === 'Completed' ? 'success' : 'neutral'}
                  size="xs"
                  dot
                >
                  {item.status}
                </Badge>
              </div>
              <p className="text-xs font-medium text-slate-200">{item.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-surface-900 border border-brand-500/40 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-brand-500/20 blur-3xl pointer-events-none rounded-full" />

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bring your team's work together.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Experience how FlowSync coordinates tasks, sprints, channels, and team velocity in one modern workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" rightIcon={ArrowRight}>
                Start with FlowSync
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary">
                Explore Demo Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
