/**
 * DashboardPage
 * Zetoco Workspace Command Center
 * Displays real-time database KPIs, task/project charts, assigned tasks, upcoming deadlines, and activity logs.
 */
import React, { useEffect, useState, useCallback } from 'react';
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
  Server,
  AlertTriangle,
  Calendar,
  Layers,
  BarChart3,
  RefreshCw,
  Building,
  CheckCircle,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Avatar,
  AvatarGroup,
  useToast,
} from '../components/ui';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import CreateOrganizationModal from '../components/modals/CreateOrganizationModal';
import TaskDetailsModal from '../components/modals/TaskDetailsModal';
import TaskStatusChart from '../components/analytics/TaskStatusChart';
import TaskPriorityChart from '../components/analytics/TaskPriorityChart';
import ProjectStatusChart from '../components/analytics/ProjectStatusChart';
import PendingInvitationsSection from '../components/invitations/PendingInvitationsSection';
import { checkFullApiHealth } from '../services/healthService';
import * as analyticsService from '../services/analyticsService';
import * as projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { useProject } from '../context/ProjectContext';
import { formatRelativeTime, formatActivityMessage } from '../utils/activityFormatter';

export default function DashboardPage() {
  const { user, profile, currentOrg } = useAuth();
  const { organizations, currentOrganization, members, can, loading: orgsLoading } = useOrganization();
  const { projects: contextProjects, refreshProjects } = useProject();
  const { addToast } = useToast();

  const orgId = currentOrg?.id || currentOrganization?.id;

  // Real Analytics State
  const [overview, setOverview] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Health Data
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Modals State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  // Selected Task for Details Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Tasks Tab inside Dashboard ('my_tasks' | 'upcoming' | 'overdue')
  const [taskFilterTab, setTaskFilterTab] = useState('my_tasks');

  // Load Dashboard Data
  const loadDashboardData = useCallback(
    async (showSpinner = true) => {
      if (!orgId) {
        setLoadingDashboard(false);
        return;
      }

      if (showSpinner) setLoadingDashboard(true);
      else setRefreshing(true);

      try {
        const [overviewRes, myTasksRes, upcomingRes, overdueRes, actRes] = await Promise.allSettled([
          analyticsService.getAnalyticsOverview({ organizationId: orgId }),
          analyticsService.getAnalyticsTasks({ organizationId: orgId, filter: 'my_tasks', limit: 6 }),
          analyticsService.getAnalyticsTasks({ organizationId: orgId, filter: 'upcoming', limit: 6 }),
          analyticsService.getAnalyticsTasks({ organizationId: orgId, filter: 'overdue', limit: 6 }),
          analyticsService.getAnalyticsActivity({ organizationId: orgId, limit: 8 }),
        ]);

        if (overviewRes.status === 'fulfilled' && overviewRes.value) {
          setOverview(overviewRes.value);
        }
        if (myTasksRes.status === 'fulfilled') {
          setMyTasks(myTasksRes.value || []);
        }
        if (upcomingRes.status === 'fulfilled') {
          setUpcomingTasks(upcomingRes.value || []);
        }
        if (overdueRes.status === 'fulfilled') {
          setOverdueTasks(overdueRes.value || []);
        }
        if (actRes.status === 'fulfilled') {
          setRecentActivities(actRes.value || []);
        }

        // Only trigger an error notification if the primary overview query failed
        if (overviewRes.status === 'rejected') {
          console.error('Failed to load dashboard overview:', overviewRes.reason);
          addToast('Failed to load dashboard statistics', 'error');
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        addToast('Failed to load dashboard statistics', 'error');
      } finally {
        setLoadingDashboard(false);
        setRefreshing(false);
      }
    },
    [orgId, addToast]
  );

  // Refetch when organization changes
  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Check health on mount
  useEffect(() => {
    checkFullApiHealth()
      .then((data) => setHealthData(data))
      .catch((err) => setHealthData(err))
      .finally(() => setLoadingHealth(false));
  }, []);

  const userName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Team Lead';
  const orgName = currentOrganization?.name || currentOrg?.name || 'Workspace';

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

  const handleOpenTask = (task) => {
    setSelectedTask({
      ...task,
      project_id: task.projectId || task.project_id,
      organization_id: orgId,
    });
    setIsDetailsModalOpen(true);
  };

  const handleTaskUpdated = () => {
    loadDashboardData(false);
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'brand';
      case 'low':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in_progress':
        return 'brand';
      case 'review':
        return 'warning';
      case 'todo':
        return 'cyan';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Direct In-App Pending Invitations */}
      <PendingInvitationsSection />

      {/* First-time onboarding banner if user has 0 organizations */}
      {!orgsLoading && organizations.length === 0 && (
        <div className="bg-[#111114] border border-[#292930] rounded-lg p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base sm:text-lg font-semibold text-[#F5F5F7]">
                Create your first workspace
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-xl">
              Workspaces allow your team to create sprint projects, track issues, and collaborate in real-time.
            </p>
          </div>
          <Button size="sm" leftIcon={Plus} onClick={() => setIsCreateOrgModalOpen(true)}>
            Create Workspace
          </Button>
        </div>
      )}

      {/* Welcome & Overview Header */}
      <div className="relative bg-[#111114] border border-[#292930] rounded-lg p-6 sm:p-7 shadow-sm overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>{orgName} • Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
              Welcome back, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-xl leading-relaxed">
              Summary of active projects, sprint issues, and milestones in{' '}
              <span className="text-[#F5F5F7] font-medium">{orgName}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              loading={refreshing}
              onClick={() => loadDashboardData(false)}
            >
              Refresh
            </Button>

            {can('projects.create') && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={FolderKanban}
                onClick={() => setIsProjectModalOpen(true)}
              >
                New Project
              </Button>
            )}

            <Button size="sm" leftIcon={Plus} onClick={() => setIsTaskModalOpen(true)}>
              Create Issue
            </Button>
          </div>
        </div>
      </div>

      {/* Real KPI Cards (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Projects */}
        <div className="bg-[#111114] border border-[#292930] rounded-md p-4 hover:border-[#3D3D48] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Total Projects</span>
            <div className="p-2 rounded-md bg-[#17171C] border border-[#1F1F24] text-[#A1A1AA]">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#F5F5F7] tracking-tight">
              {kpis.totalProjects}
            </span>
            <span className="text-[11px] font-medium text-indigo-400">
              {kpis.activeProjects} active
            </span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-[#111114] border border-[#292930] rounded-md p-4 hover:border-[#3D3D48] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Active Projects</span>
            <div className="p-2 rounded-md bg-[#17171C] border border-[#1F1F24] text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#F5F5F7] tracking-tight">
              {kpis.activeProjects}
            </span>
            <span className="text-[11px] font-medium text-[#A1A1AA]">In execution</span>
          </div>
        </div>

        {/* Open Tasks */}
        <div className="bg-[#111114] border border-[#292930] rounded-md p-4 hover:border-[#3D3D48] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Open Issues</span>
            <div className="p-2 rounded-md bg-[#17171C] border border-[#1F1F24] text-[#A1A1AA]">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#F5F5F7] tracking-tight">
              {kpis.openTasks}
            </span>
            <span className="text-[11px] font-medium text-indigo-400">In sprint</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-[#111114] border border-[#292930] rounded-md p-4 hover:border-[#3D3D48] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Completed</span>
            <div className="p-2 rounded-md bg-[#17171C] border border-[#1F1F24] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-[#F5F5F7] tracking-tight">
              {kpis.completedTasks}
            </span>
            <span className="text-[11px] font-medium text-emerald-400">
              {kpis.completionRate}% rate
            </span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-[#111114] border border-[#292930] rounded-md p-4 hover:border-[#3D3D48] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Overdue</span>
            <div
              className={`p-2 rounded-md border ${
                kpis.overdueTasks > 0
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-[#17171C] border-[#1F1F24] text-[#71717A]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span
              className={`text-2xl font-semibold tracking-tight ${
                kpis.overdueTasks > 0 ? 'text-red-400' : 'text-[#F5F5F7]'
              }`}
            >
              {kpis.overdueTasks}
            </span>
            <span
              className={`text-[11px] font-medium ${
                kpis.overdueTasks > 0 ? 'text-red-400' : 'text-[#71717A]'
              }`}
            >
              {kpis.overdueTasks > 0 ? 'Action required' : 'On track'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics 3-Column Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Task Status Chart */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Task Status Overview</CardTitle>
              <Link to="/analytics">
                <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
                  Deep Dive
                </Button>
              </Link>
            </div>
            <CardDescription>Live distribution across workflow sprint columns</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskStatusChart statusBreakdown={overview?.taskStatusBreakdown} height={200} />
          </CardContent>
        </Card>

        {/* Task Priority Chart */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
            <CardDescription>Breakdown by urgency level</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskPriorityChart priorityBreakdown={overview?.taskPriorityBreakdown} height={200} />
          </CardContent>
        </Card>

        {/* Project Status Chart */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Status Breakdown</CardTitle>
              <Link to="/projects">
                <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
                  Projects
                </Button>
              </Link>
            </div>
            <CardDescription>Active workspaces across organization lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectStatusChart projectStatusBreakdown={overview?.projectStatusBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-brand-400" />
              <CardTitle>Workspace Projects</CardTitle>
            </div>
            <CardDescription>
              Active roadmap projects and sprint workspaces in {orgName} ({contextProjects?.length || 0})
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {can('projects.create') && (
              <Button
                size="xs"
                variant="outline"
                leftIcon={Plus}
                onClick={() => setIsProjectModalOpen(true)}
              >
                New Project
              </Button>
            )}
            <Link to="/projects">
              <Button variant="ghost" size="xs" rightIcon={ArrowUpRight}>
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!contextProjects || contextProjects.length === 0 ? (
            <div className="p-8 text-center text-[#71717A] bg-[#0B0B0E] rounded-md border border-[#1F1F24] text-xs">
              <FolderKanban className="w-8 h-8 text-[#52525B] mx-auto mb-2" />
              <p className="font-semibold text-[#F5F5F7]">No projects created yet</p>
              <p className="text-[#71717A] mt-0.5">
                Create a project to start planning sprints, assigning issues, and tracking progress.
              </p>
              {can('projects.create') && (
                <div className="pt-3">
                  <Button
                    size="xs"
                    leftIcon={Plus}
                    onClick={() => setIsProjectModalOpen(true)}
                  >
                    Create First Project
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contextProjects.slice(0, 6).map((p) => {
                const code = p.name ? p.name.substring(0, 3).toUpperCase() : 'PRJ';
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="p-4 rounded-md bg-[#17171C] border border-[#1F1F24] hover:border-[#292930] hover:bg-[#202027]/40 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                          {code}
                        </div>
                        <Badge
                          variant={
                            p.status === 'completed'
                              ? 'success'
                              : p.status === 'active'
                              ? 'brand'
                              : 'neutral'
                          }
                          size="xs"
                          dot
                        >
                          {p.status?.replace('_', ' ')}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-semibold text-[#F5F5F7] group-hover:text-indigo-400 transition-colors truncate">
                        {p.name}
                      </h4>
                      <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1 leading-relaxed">
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#71717A] pt-2 border-t border-[#1F1F24]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'No deadline'}
                      </span>
                      <span>
                        {p.membersCount || p.members?.length || 1} {(p.membersCount || p.members?.length || 1) === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main 2-Column Section: Deliverables & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Task Lists (My Tasks, Upcoming, Overdue) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Sprint Issues & Deadlines</CardTitle>
                <CardDescription>Real-time issues assigned to you and target milestones</CardDescription>
              </div>

              {/* Filter Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                <button
                  type="button"
                  onClick={() => setTaskFilterTab('my_tasks')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    taskFilterTab === 'my_tasks'
                      ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  }`}
                >
                  My Issues ({myTasks.length})
                </button>

                <button
                  type="button"
                  onClick={() => setTaskFilterTab('upcoming')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    taskFilterTab === 'upcoming'
                      ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  }`}
                >
                  Upcoming ({upcomingTasks.length})
                </button>

                <button
                  type="button"
                  onClick={() => setTaskFilterTab('overdue')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    taskFilterTab === 'overdue'
                      ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30'
                      : 'text-[#71717A] hover:text-red-400'
                  }`}
                >
                  Overdue ({overdueTasks.length})
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {/* My Tasks List */}
              {taskFilterTab === 'my_tasks' && (
                <>
                  {myTasks.length === 0 ? (
                    <div className="p-8 text-center text-[#71717A] bg-[#0B0B0E] rounded-md border border-[#1F1F24] text-xs">
                      <CheckCircle className="w-6 h-6 text-[#52525B] mx-auto mb-2" />
                      <p className="font-semibold text-[#F5F5F7]">No issues currently assigned to you</p>
                      <p className="text-[#71717A] mt-0.5">
                        Issues assigned to your profile will appear here.
                      </p>
                    </div>
                  ) : (
                    myTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenTask(t)}
                        className="p-3 rounded-md bg-[#17171C] border border-[#1F1F24] hover:border-[#292930] hover:bg-[#202027]/40 transition-all flex items-center justify-between gap-4 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F7] group-hover:text-indigo-400 transition-colors truncate">
                              {t.title}
                            </h4>
                            <p className="text-[11px] text-[#71717A] mt-0.5 truncate">
                              {t.projectName}{' '}
                              {t.dueDate && (
                                <>
                                  • <span className="text-[#71717A]">Due {new Date(t.dueDate).toLocaleDateString()}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={getPriorityVariant(t.priority)} size="xs">
                            {t.priority?.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusVariant(t.status)} size="xs" dot>
                            {t.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Upcoming Tasks List */}
              {taskFilterTab === 'upcoming' && (
                <>
                  {upcomingTasks.length === 0 ? (
                    <div className="p-8 text-center text-[#71717A] bg-[#0B0B0E] rounded-md border border-[#1F1F24] text-xs">
                      <Clock className="w-6 h-6 text-[#52525B] mx-auto mb-2" />
                      <p className="font-semibold text-[#F5F5F7]">No upcoming deadlines found</p>
                      <p className="text-[#71717A] mt-0.5">
                        Issues with target due dates will be tracked here.
                      </p>
                    </div>
                  ) : (
                    upcomingTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenTask(t)}
                        className="p-3 rounded-md bg-[#17171C] border border-[#1F1F24] hover:border-[#292930] hover:bg-[#202027]/40 transition-all flex items-center justify-between gap-4 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F7] group-hover:text-indigo-400 transition-colors truncate">
                              {t.title}
                            </h4>
                            <p className="text-[11px] text-[#71717A] mt-0.5 truncate">
                              {t.projectName} • Assignee: {t.assigneeName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                          <Badge variant={getStatusVariant(t.status)} size="xs">
                            {t.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* Overdue Tasks List */}
              {taskFilterTab === 'overdue' && (
                <>
                  {overdueTasks.length === 0 ? (
                    <div className="p-8 text-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="font-semibold">All issues are currently on schedule!</p>
                      <p className="text-emerald-400/80 mt-0.5">
                        No overdue issues found in this workspace.
                      </p>
                    </div>
                  ) : (
                    overdueTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenTask(t)}
                        className="p-3 rounded-md bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-between gap-4 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F7] group-hover:text-red-400 transition-colors truncate">
                              {t.title}
                            </h4>
                            <p className="text-[11px] text-red-400/80 mt-0.5 truncate">
                              {t.projectName} • Assignee: {t.assigneeName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Due {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                          <Badge variant="danger" size="xs">
                            OVERDUE
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Recent Activity Feed & Diagnostics */}
        <div className="space-y-6">
          {/* Recent Activity Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Workspace audit history</CardDescription>
              </div>
              <Activity className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-[#71717A] text-xs bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                  No activity history recorded yet.
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs group">
                    <Avatar name={act.actorName} size="xs" />
                    <div className="flex-1 bg-[#0B0B0E] p-2.5 rounded-md border border-[#1F1F24]">
                      <p className="text-[#F5F5F7] font-normal leading-snug">
                        {formatActivityMessage(act)}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[#71717A] mt-1">
                        <span>{formatRelativeTime(act.createdAt)}</span>
                        {act.projectName && (
                          <span className="text-indigo-400 font-medium">{act.projectName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Real-Time Express & DB Health Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>System Diagnostics</span>
                </CardTitle>
                <Badge variant="brand" size="xs" dot>
                  Live
                </Badge>
              </div>
              <CardDescription>Real-time telemetry from Express API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-md bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-between">
                <span className="text-[#A1A1AA]">REST API Status:</span>
                <Badge variant={healthData?.success ? 'success' : 'danger'} size="xs" dot>
                  {loadingHealth ? 'Checking...' : healthData?.success ? '200 OK' : 'Offline'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-md bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-between">
                <span className="text-[#A1A1AA]">PostgreSQL Pool:</span>
                <Badge
                  variant={healthData?.database?.connected ? 'success' : 'warning'}
                  size="xs"
                  dot
                >
                  {loadingHealth
                    ? 'Checking...'
                    : healthData?.database?.connected
                    ? 'Connected'
                    : 'Configured'}
                </Badge>
              </div>

              <div className="text-[11px] text-[#71717A] text-center pt-1">
                System Telemetry & Live Sync Active
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskUpdated}
        />
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          loadDashboardData(false);
        }}
      />
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          loadDashboardData(false);
          if (refreshProjects) refreshProjects();
        }}
        onProjectCreated={() => {
          loadDashboardData(false);
          if (refreshProjects) refreshProjects();
        }}
      />
      <CreateOrganizationModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
      />
    </div>
  );
}
