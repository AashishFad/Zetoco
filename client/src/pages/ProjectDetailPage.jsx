import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Calendar,
  Users,
  UserPlus,
  Trash2,
  Save,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Crown
} from 'lucide-react';
import { Button, Badge, Avatar, AvatarGroup, Tabs, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Textarea, Dropdown, DropdownItem, useToast } from '../components/ui';
import KanbanBoardView from '../components/kanban/KanbanBoardView';
import TaskListView from '../components/tasks/TaskListView';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import AddProjectMemberModal from '../components/modals/AddProjectMemberModal';
import DeleteProjectModal from '../components/modals/DeleteProjectModal';
import * as projectService from '../services/projectService';
import * as taskService from '../services/taskService';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { currentOrganization, can, members: orgMembers, fetchOrgMembers } = useOrganization();
  const { updateProject: updateProjectContext, deleteProject: deleteProjectContext } = useProject();

  // Normalize project ID (e.g. handle UUIDs with spaces or raw 32-char hex)
  const cleanId = useMemo(() => {
    if (!id) return '';
    let formatted = id.trim().replace(/\s+/g, '-');
    if (/^[0-9a-fA-F]{32}$/.test(formatted)) {
      formatted = `${formatted.slice(0, 8)}-${formatted.slice(8, 12)}-${formatted.slice(12, 16)}-${formatted.slice(16, 20)}-${formatted.slice(20)}`;
    }
    return formatted;
  }, [id]);

  useEffect(() => {
    if (id && cleanId && cleanId !== id) {
      navigate(`/projects/${cleanId}`, { replace: true });
    }
  }, [id, cleanId, navigate]);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Settings form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProjectData = useCallback(async () => {
    const targetId = cleanId || id;
    if (!targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [projectData, taskData] = await Promise.all([
        projectService.getProjectById(targetId),
        taskService.getTasksByProject(targetId),
      ]);

      setProject(projectData);
      setTasks(Array.isArray(taskData) ? taskData : []);

      if (projectData) {
        if (projectData.organization_id && typeof fetchOrgMembers === 'function') {
          fetchOrgMembers(projectData.organization_id);
        }
        setEditForm({
          name: projectData.name || '',
          description: projectData.description || '',
          status: projectData.status || 'planning',
          priority: projectData.priority || 'medium',
          startDate: projectData.start_date ? projectData.start_date.split('T')[0] : '',
          dueDate: projectData.due_date ? projectData.due_date.split('T')[0] : '',
        });
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  }, [cleanId, id, fetchOrgMembers]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const eligibleAssignees = useMemo(() => {
    const userMap = new Map();
    (orgMembers || []).filter(Boolean).forEach((m) => {
      const mid = m.userId || m.user_id || m.id;
      if (mid) userMap.set(mid, m);
    });
    (project?.members || []).filter(Boolean).forEach((m) => {
      const mid = m.userId || m.user_id || m.id;
      if (mid && !userMap.has(mid)) {
        userMap.set(mid, m);
      }
    });
    return Array.from(userMap.values());
  }, [orgMembers, project?.members]);

  const isOrgAdmin = typeof can === 'function' ? can('organization.update') : false;
  const currentMember = (project?.members || []).filter(Boolean).find((m) => m.userId === user?.id || m.user_id === user?.id);
  const isProjectManager = currentMember?.projectRole === 'manager' || isOrgAdmin;

  // Real task metrics
  const taskList = Array.isArray(tasks) ? tasks : [];
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t) => t && t.status === 'done').length;
  const inProgressTasks = taskList.filter((t) => t && t.status === 'in_progress').length;
  const overdueTasks = taskList.filter((t) => {
    return t && t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();
  }).length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (!isProjectManager) {
      addToast('Only Project Managers or Admins can edit project settings', 'error');
      return;
    }

    if (!editForm.name.trim()) {
      addToast('Project name is required', 'warning');
      return;
    }

    setSaving(true);
    const updates = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
      priority: editForm.priority,
      start_date: editForm.startDate ? new Date(editForm.startDate).toISOString() : null,
      due_date: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
    };

    const res = await updateProjectContext(project.id, updates);
    setSaving(false);

    if (res.success) {
      addToast('Project settings updated successfully!', 'success');
      setProject((prev) => ({ ...prev, ...updates }));
    } else {
      addToast(res.error || 'Failed to update project settings', 'error');
    }
  };

  const handleMemberRoleChange = async (member, newRole) => {
    if (member.projectRole === newRole) return;

    const res = await projectService.updateProjectMemberRole(
      project.id,
      member.id,
      newRole,
      project.members
    );

    if (res.success) {
      addToast(`Updated ${member.fullName}'s role to ${newRole}`, 'success');
      setProject((prev) => ({
        ...prev,
        members: prev.members.map((m) => (m.id === member.id ? { ...m, projectRole: newRole } : m)),
      }));
    } else {
      addToast(res.error || 'Failed to update project member role', 'error');
    }
  };

  const handleRemoveMember = async (member) => {
    const res = await projectService.removeProjectMember(project.id, member.id, project.members);

    if (res.success) {
      addToast(`Removed ${member.fullName} from project`, 'info');
      setProject((prev) => ({
        ...prev,
        membersCount: Math.max(0, (prev.membersCount || 1) - 1),
        members: prev.members.filter((m) => m.id !== member.id),
      }));
    } else {
      addToast(res.error || 'Failed to remove member', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    const res = await deleteProjectContext(project.id);
    if (res.success) {
      addToast(`Project "${project.name}" deleted`, 'info');
      navigate('/projects', { replace: true });
    } else {
      addToast(res.error || 'Failed to delete project', 'error');
    }
  };

  const handleTaskCountChange = useCallback((cnt) => {
    setTasks((prev) => {
      if (prev.length === cnt) return prev;
      taskService.getTasksByProject(id).then((t) => setTasks(t || []));
      return prev;
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-12 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Project Not Found</h2>
        <p className="text-sm text-slate-400 mt-1">
          The requested project does not exist or you do not have permission to access it within this organization.
        </p>
        <div className="pt-4">
          <Link to="/projects">
            <Button leftIcon={ArrowLeft}>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'board', label: 'Board', icon: Kanban, count: totalTasks },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: totalTasks },
    { id: 'sprints', label: 'Sprints', icon: Milestone },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const code = project.slug ? project.slug.substring(0, 4).toUpperCase() : 'PRJ';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#F5F5F7] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Top Section Header */}
      <div className="bg-[#111114] border border-[#292930] rounded-xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                {code}
              </span>
              <Badge variant="brand" size="xs" dot>
                {project.status?.replace('_', ' ')}
              </Badge>
              <Badge variant="neutral" size="xs">
                {project.priority} priority
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
              {project.description || 'No description provided for this project workspace.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Real Progress Indicator */}
            <div className="bg-[#0B0B0E] p-3 px-4 rounded-lg border border-[#1F1F24]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[#71717A]">Progress:</span>
                <span className="text-sm font-semibold text-[#F5F5F7]">{progressPercent}%</span>
              </div>
              <div className="w-32 h-1.5 bg-[#17171C] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-[#71717A] block">Project Team</span>
              <AvatarGroup max={4} size="sm">
                {(project.members || []).filter(Boolean).map((m) => (
                  <Avatar key={m.id || m.userId} name={m.fullName} size="sm" />
                ))}
              </AvatarGroup>
            </div>

            {/* Action */}
            <Button
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add Issue
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Navigation Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Board Tab Content (Real Kanban Drag & Drop) */}
      {activeTab === 'board' && (
        <KanbanBoardView
          projectId={project.id}
          projectMembers={eligibleAssignees}
          initialTasks={tasks}
          onTaskCountChange={handleTaskCountChange}
        />
      )}

      {/* Tasks Tab Content (List View) */}
      {activeTab === 'tasks' && (
        <TaskListView
          projectId={project.id}
          tasks={tasks}
          projectMembers={eligibleAssignees}
          onTaskCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
          onTaskUpdated={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
          onTaskDeleted={(deletedId) => setTasks((prev) => prev.filter((t) => t.id !== deletedId))}
        />
      )}

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Task Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[#111114] border border-[#292930]">
                <span className="text-[11px] text-[#71717A] block">Total Issues</span>
                <span className="text-2xl font-semibold text-[#F5F5F7] mt-1 block">{totalTasks}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#111114] border border-[#292930]">
                <span className="text-[11px] text-[#71717A] block">In Progress</span>
                <span className="text-2xl font-semibold text-indigo-400 mt-1 block">{inProgressTasks}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#111114] border border-[#292930]">
                <span className="text-[11px] text-[#71717A] block">Completed</span>
                <span className="text-2xl font-semibold text-emerald-400 mt-1 block">{completedTasks}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#111114] border border-[#292930]">
                <span className="text-[11px] text-[#71717A] block">Overdue</span>
                <span className={`text-2xl font-semibold mt-1 block ${overdueTasks > 0 ? 'text-red-400' : 'text-[#71717A]'}`}>
                  {overdueTasks}
                </span>
              </div>
            </div>

            {/* Scope Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Scope</CardTitle>
                <CardDescription>Timeline and deliverables for this workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="text-[#A1A1AA] leading-relaxed">
                  {project.description || 'No detailed scope description provided.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                    <span className="text-[#71717A] block text-[11px]">Start Date</span>
                    <span className="text-xs font-medium text-[#F5F5F7] mt-0.5 block">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
                    <span className="text-[#71717A] block text-[11px]">Due Date</span>
                    <span className="text-xs font-medium text-indigo-400 mt-0.5 block">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Ongoing'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Project Members */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Project Members ({project.members?.length || 0})</span>
                  </CardTitle>
                </div>

                {isProjectManager && (
                  <Button
                    size="xs"
                    leftIcon={UserPlus}
                    onClick={() => setIsAddMemberOpen(true)}
                  >
                    Add
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {(project.members || []).filter(Boolean).map((m) => {
                  const isManager = m.projectRole === 'manager';
                  const isCurrentUser = m.userId === user?.id || m.user_id === user?.id;

                  return (
                    <div
                      key={m.id || m.userId}
                      className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={m.fullName} size="sm" />
                        <div className="truncate">
                          <p className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{m.fullName}</span>
                            {isManager && <Crown className="w-3 h-3 text-amber-400" title="Project Manager" />}
                            {isCurrentUser && <span className="text-[10px] text-brand-400">(You)</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">@{m.username || 'member'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isProjectManager ? (
                          <Dropdown
                            width="w-36"
                            trigger={
                              <button
                                type="button"
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-surface-700 bg-surface-800 text-slate-300 hover:bg-surface-700 flex items-center gap-1"
                              >
                                <span className="capitalize">{m.projectRole}</span>
                                <ChevronDown className="w-2.5 h-2.5" />
                              </button>
                            }
                          >
                            <DropdownItem onClick={() => handleMemberRoleChange(m, 'manager')}>
                              Manager
                            </DropdownItem>
                            <DropdownItem onClick={() => handleMemberRoleChange(m, 'member')}>
                              Member
                            </DropdownItem>
                            <DropdownItem onClick={() => handleMemberRoleChange(m, 'viewer')}>
                              Viewer
                            </DropdownItem>
                            <DropdownItem danger onClick={() => handleRemoveMember(m)}>
                              Remove
                            </DropdownItem>
                          </Dropdown>
                        ) : (
                          <Badge variant={isManager ? 'brand' : 'neutral'} size="xs">
                            {m.projectRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Configure project metadata, status, priority, and timeline boundaries</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    disabled={!isProjectManager}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description
                  </label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    disabled={!isProjectManager}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Status
                    </label>
                    <Select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      disabled={!isProjectManager}
                      options={[
                        { label: 'Planning', value: 'planning' },
                        { label: 'Active', value: 'active' },
                        { label: 'On Hold', value: 'on_hold' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Archived', value: 'archived' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Priority
                    </label>
                    <Select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      disabled={!isProjectManager}
                      options={[
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' },
                        { label: 'Urgent', value: 'urgent' },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      disabled={!isProjectManager}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                      disabled={!isProjectManager}
                    />
                  </div>
                </div>

                {isProjectManager && (
                  <div className="pt-3 border-t border-surface-800 flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      leftIcon={Save}
                      loading={saving}
                      disabled={saving}
                    >
                      Save Settings
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {isProjectManager && (
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Project</span>
                </CardTitle>
                <CardDescription>
                  Permanently remove this project and all associated tasks from {currentOrganization?.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  This action cannot be undone. All tasks in this workspace will be deleted.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contextual Guidance for Auxiliary Tabs */}
      {activeTab !== 'overview' && activeTab !== 'board' && activeTab !== 'tasks' && activeTab !== 'settings' && (
        <Card className="p-12 text-center text-slate-400">
          <p className="text-base font-bold text-white">
            {tabs.find((t) => t.id === activeTab)?.label} Module
          </p>
          <p className="text-xs mt-1 max-w-md mx-auto text-slate-400">
            {activeTab === 'chat' && 'Live team messaging and discussions are available in dedicated Channels.'}
            {activeTab === 'files' && 'Task attachments and document uploads are managed directly within each task modal on the Kanban Board.'}
            {activeTab === 'analytics' && 'Project analytics and organization telemetry are accessible from the global Analytics dashboard.'}
            {activeTab === 'sprints' && 'Sprint status, backlog items, and WIP columns are actively managed on the Board tab.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {activeTab === 'chat' && (
              <Link to="/channels">
                <Button size="sm">Open Channels</Button>
              </Link>
            )}
            {activeTab === 'analytics' && (
              <Link to="/analytics">
                <Button size="sm">View Analytics</Button>
              </Link>
            )}
            {(activeTab === 'files' || activeTab === 'sprints') && (
              <Button size="sm" onClick={() => setActiveTab('board')}>
                Go to Board
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={project.id}
        projectMembers={eligibleAssignees}
        onTaskCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
      />

      <AddProjectMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        projectId={project.id}
        currentProjectMembers={project.members || []}
        onMemberAdded={(newMember) => {
          setProject((prev) => ({
            ...prev,
            membersCount: (prev.membersCount || 0) + 1,
            members: [...(prev.members || []), newMember],
          }));
        }}
      />

      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        project={project}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
