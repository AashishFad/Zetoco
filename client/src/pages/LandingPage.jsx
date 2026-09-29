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
  FolderKanban,
  Trello,
  MessageSquare,
  Bell,
  BarChart3,
  ChevronRight,
  Terminal,
  Sparkles,
  GitPullRequest,
  Check
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../constants';
import { checkFullApiHealth } from '../services/healthService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

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
      title: 'Project Management',
      description: 'Structured projects, milestone delivery tracking, and sprint scoping inspired by Jira workflows.',
      icon: FolderKanban,
      color: 'from-brand-500 to-indigo-700',
    },
    {
      title: 'Task Boards',
      description: 'Flexible Kanban boards with priority tags, assignee attribution, and column lifecycle management.',
      icon: Trello,
      color: 'from-accent-500 to-teal-700',
    },
    {
      title: 'Team Collaboration',
      description: 'Dedicated discussion channels, role-based workspace permissions, and member activity streams.',
      icon: Users,
      color: 'from-purple-500 to-indigo-700',
    },
    {
      title: 'Real-Time Updates',
      description: 'Live task state synchronizations, concurrent presence badges, and instant event propagation.',
      icon: Zap,
      color: 'from-amber-500 to-rose-700',
    },
    {
      title: 'Smart Notifications',
      description: 'Targeted in-app alerts, mention notifications, and deadline reminders to keep teams aligned.',
      icon: Bell,
      color: 'from-rose-500 to-pink-700',
    },
    {
      title: 'Velocity Analytics',
      description: 'Comprehensive workload charts, sprint burndown metrics, and project completion diagnostics.',
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-800',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Create Workspace',
      desc: 'Set up your multi-tenant organization or team hub with customized access controls.',
    },
    {
      step: '02',
      title: 'Create Project',
      desc: 'Define scopes, milestone timelines, categories, and member permissions.',
    },
    {
      step: '03',
      title: 'Assign Tasks',
      desc: 'Break projects down into backlog items, priority tags, assignees, and deadlines.',
    },
    {
      step: '04',
      title: 'Collaborate',
      desc: 'Exchange feedback in real-time channels, comment threads, and attachment drops.',
    },
    {
      step: '05',
      title: 'Track Progress',
      desc: 'Advance tasks across Kanban stages and monitor live velocity metrics.',
    },
  ];

  return (
    <div className="space-y-28 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 lg:pt-32">
        {/* Glowing Background Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[250px] bg-accent-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Recruiter / Portfolio Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-brand-400 animate-ping"></span>
            <span>Recruiter Portfolio Demonstration • Phase 2 UI/UX System</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            {APP_TAGLINE}
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            FlowSync helps teams manage projects, tasks, and collaboration from one unified, beautifully designed workspace.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary" rightIcon={ArrowRight}>
                Get Started
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button size="lg" variant="secondary" leftIcon={Sparkles}>
                Explore Demo
              </Button>
            </Link>
          </div>

          {/* Hero App Mockup / Dashboard Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto bg-dark-900/90 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl backdrop-blur-xl relative">
            <div className="bg-dark-950 rounded-2xl border border-slate-800/80 p-5 sm:p-8 text-left">
              {/* Fake Window Controls & Tab */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-3 text-xs font-mono text-slate-400">
                    flowsync.dev/workspace/acme-core
                  </span>
                </div>
                <Badge variant="brand" size="sm" hasDot>
                  Live System Shell
                </Badge>
              </div>

              {/* Grid Preview inside Hero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric 1 */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Active Sprint</p>
                  <p className="text-xl font-bold text-white mt-1">Sprint 14 — Core Platform</p>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full w-[78%]"></div>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Team Velocity</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">94% on schedule</p>
                  <p className="text-[11px] text-slate-400 mt-2">28 tasks closed this week</p>
                </div>

                {/* Metric 3: Live Backend Health Diagnostic */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">REST API & DB</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        systemHealth?.success
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {loadingHealth ? 'Checking...' : systemHealth?.success ? '200 OK' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 font-mono truncate">
                    {systemHealth?.message || 'Express REST API running'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Database: {systemHealth?.database?.connected ? 'Connected' : 'Configured / Ready'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planned Capabilities / Feature Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" size="md" className="mb-3">
            Core Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Modern Engineering & Product Teams
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            FlowSync unifies agile project tracking, responsive Kanban workflows, and team communication in a single intuitive interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-card-subtle group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center shadow-md mb-5 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-dark-900 to-dark-950 border border-slate-800 rounded-3xl p-8 sm:p-14">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="accent" size="md" className="mb-3">
              Lifecycle
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How FlowSync Works
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              A structured flow from idea to delivery without friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {workflowSteps.map((item, idx) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-2xl font-extrabold text-brand-400 font-mono">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 pointer-events-none">
                    {/* Visual Connector */}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl bg-gradient-to-r from-brand-950 via-slate-900 to-dark-950 border border-brand-500/30 p-10 sm:p-16 shadow-glow-brand overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Bring your team's work together.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Experience an intuitive collaboration platform engineered for clarity, performance, and seamless workflow synchronizations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary" rightIcon={ArrowRight}>
                Start with FlowSync
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                Open Dashboard Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
