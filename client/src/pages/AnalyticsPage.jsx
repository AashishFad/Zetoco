/**
 * AnalyticsPage
 * Deep-dive organization and project analytics backed by live PostgreSQL aggregations.
 * Features project & date range filtering, task completion metrics, and objective team workload.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  ArrowUpRight,
  Activity,
  Filter,
  Calendar,
  Layers,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Select,
  Badge,
  useToast,
} from '../components/ui';
import TaskStatusChart from '../components/analytics/TaskStatusChart';
import TaskPriorityChart from '../components/analytics/TaskPriorityChart';
import ProjectStatusChart from '../components/analytics/ProjectStatusChart';
import TeamWorkloadCard from '../components/analytics/TeamWorkloadCard';
import * as analyticsService from '../services/analyticsService';
import * as projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { formatRelativeTime, formatActivityMessage } from '../utils/activityFormatter';

const DATE_RANGE_OPTIONS = [
  { label: 'All Time', value: 'ALL' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
];

export default function AnalyticsPage() {
  const { user, currentOrg } = useAuth();
  const { currentOrganization } = useOrganization();
  const { addToast } = useToast();

  const orgId = currentOrg?.id || currentOrganization?.id;

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');

  // Real Data States
  const [projectsList, setProjectsList] = useState([]);
  const [overview, setOverview] = useState(null);
  const [projectsAnalytics, setProjectsAnalytics] = useState([]);
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate startDate ISO based on date filter
  const dateRangeBounds = useMemo(() => {
    if (selectedDateRange === 'ALL') return { startDate: null, endDate: null };
    const days = parseInt(selectedDateRange, 10);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return { startDate: date.toISOString(), endDate: new Date().toISOString() };
  }, [selectedDateRange]);

  // Load Projects for Dropdown
  const loadProjectsDropdown = useCallback(async () => {
    if (!orgId) return;
    try {
      const list = await projectService.getProjects(orgId);
      setProjectsList(list || []);
    } catch (err) {
      console.warn('Failed to load project dropdown:', err);
    }
  }, [orgId]);

  // Load All Analytics Data
  const loadAnalyticsData = useCallback(
    async (showSpinner = true) => {
      if (!orgId) {
        setLoading(false);
        return;
      }

      if (showSpinner) setLoading(true);
      else setRefreshing(true);

      try {
        const { startDate, endDate } = dateRangeBounds;

        const [overviewRes, projectsRes, teamRes, activityRes] = await Promise.all([
          analyticsService.getAnalyticsOverview({
            organizationId: orgId,
            projectId: selectedProjectId,
            startDate,
            endDate,
          }),
          analyticsService.getAnalyticsProjects({ organizationId: orgId }),
          analyticsService.getAnalyticsTeam({
            organizationId: orgId,
            projectId: selectedProjectId,
          }),
          analyticsService.getAnalyticsActivity({
            organizationId: orgId,
            projectId: selectedProjectId,
            limit: 10,
          }),
        ]);

        setOverview(overviewRes);
        setProjectsAnalytics(projectsRes || []);
        setTeamWorkload(teamRes || []);
        setRecentActivity(activityRes || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        addToast('Failed to load organization analytics', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orgId, selectedProjectId, dateRangeBounds, addToast]
  );

  useEffect(() => {
    loadProjectsDropdown();
  }, [loadProjectsDropdown]);

  useEffect(() => {
    loadAnalyticsData(true);
  }, [loadAnalyticsData]);

  const kpis = overview?.kpis || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    openTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Organization Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time PostgreSQL telemetry on project completion rates, sprint bottlenecks, and team workloads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            loading={refreshing}
            onClick={() => loadAnalyticsData(false)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Project Selector */}
        <div className="sm:col-span-6">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Filter by Project
          </label>
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={[
              { label: 'All Projects (Organization Wide)', value: 'ALL' },
              ...projectsList.map((p) => ({ label: p.name, value: p.id })),
            ]}
          />
        </div>

        {/* Date Range Selector */}
        <div className="sm:col-span-6">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Time Horizon
          </label>
          <Select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            options={DATE_RANGE_OPTIONS}
          />
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Completion Rate */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Task Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{kpis.completionRate}%</div>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {kpis.completedTasks} of {kpis.totalTasks} tasks finished
          </span>
        </Card>

        {/* Open Deliverables */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Open Deliverables</span>
            <CheckSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{kpis.openTasks}</div>
          <span className="text-[11px] font-semibold text-purple-400">
            Across active sprint boards
          </span>
        </Card>

        {/* Overdue Tasks */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue Items</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                kpis.overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black ${
              kpis.overdueTasks > 0 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {kpis.overdueTasks}
          </div>
          <span
            className={`text-[11px] font-semibold ${
              kpis.overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {kpis.overdueTasks > 0 ? 'Past due date' : 'Zero overdue items'}
          </span>
        </Card>

        {/* Active Projects */}
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{kpis.activeProjects}</div>
          <span className="text-[11px] font-semibold text-brand-400">
            {kpis.totalProjects} total in workspace
          </span>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Workflow Column Breakdown</CardTitle>
            <CardDescription>Distribution across Kanban columns</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskStatusChart statusBreakdown={overview?.taskStatusBreakdown} height={230} />
          </CardContent>
        </Card>

        {/* Task Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
            <CardDescription>Relative task urgency allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskPriorityChart priorityBreakdown={overview?.taskPriorityBreakdown} height={230} />
          </CardContent>
        </Card>
      </div>

      {/* Project Progress & Team Workload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Task Completion Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Task Completion</CardTitle>
            <CardDescription>
              Objective completion percentage derived purely from completed vs total tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsAnalytics.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-surface-950/60 rounded-xl border border-surface-800">
                No projects found in this organization.
              </div>
            ) : (
              projectsAnalytics.map((p) => {
                const completionPct = p.completionRate || 0;
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-surface-950/60 border border-surface-800/80 hover:border-surface-700/80 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        />
                        <h4 className="text-xs sm:text-sm font-bold text-white">{p.name}</h4>
                        <Badge variant="neutral" size="xs">
                          {p.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">
                          <strong className="text-white">{p.completedTasks}</strong> /{' '}
                          {p.totalTasks} tasks
                        </span>
                        <span className="font-bold text-brand-300 w-12 text-right">
                          {completionPct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-surface-900 rounded-full overflow-hidden flex border border-surface-800">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Workload</CardTitle>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <CardDescription>Open vs completed tasks assigned per member</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamWorkloadCard teamWorkload={teamWorkload} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
