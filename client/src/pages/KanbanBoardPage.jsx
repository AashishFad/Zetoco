import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Kanban, Plus, Filter, CheckSquare, FolderKanban, Search, Calendar, User } from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input, Select, Avatar, useToast } from '../components/ui';
import KanbanBoardView from '../components/kanban/KanbanBoardView';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import TaskDetailsModal from '../components/modals/TaskDetailsModal';
import { useProject } from '../context/ProjectContext';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import * as taskService from '../services/taskService';

export default function KanbanBoardPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProject();
  const { currentOrganization, members: orgMembers } = useOrganization();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'my-tasks'
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [myTasks, setMyTasks] = useState([]);
  const [loadingMyTasks, setLoadingMyTasks] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Default to first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const fetchMyTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMyTasks(true);
    const tasks = await taskService.getMyTasks(user.id);
    setMyTasks(tasks);
    setLoadingMyTasks(false);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'my-tasks') {
      fetchMyTasks();
    }
  }, [activeTab, fetchMyTasks]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const projectMembers = useMemo(() => {
    const userMap = new Map();
    (orgMembers || []).forEach((m) => {
      const mid = m.userId || m.user_id || m.id;
      if (mid) userMap.set(mid, m);
    });
    (activeProject?.members || []).forEach((m) => {
      const mid = m.userId || m.user_id || m.id;
      if (mid && !userMap.has(mid)) {
        userMap.set(mid, m);
      }
    });
    return Array.from(userMap.values());
  }, [orgMembers, activeProject?.members]);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
              Issues & Board
            </h1>
            <Badge variant="brand" size="xs">
              {currentOrganization?.name || 'Workspace'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Visual issue lifecycle management across workflow columns with live drag-and-drop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsTaskModalOpen(true)}
            disabled={projects.length === 0}
          >
            Create Issue
          </Button>
        </div>
      </div>

      {/* View Switcher & Project Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111114] p-2.5 rounded-lg border border-[#292930]">
        <div className="flex items-center gap-1.5 p-1 bg-[#0B0B0E] rounded-md border border-[#1F1F24]">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'board'
                ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            Project Board
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'my-tasks'
                ? 'bg-[#17171C] text-[#F5F5F7] shadow-sm border border-[#292930]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            My Assigned Issues
          </button>
        </div>

        {activeTab === 'board' && projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#71717A] font-medium hidden md:inline">Project:</span>
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              options={projects.map((p) => ({
                label: `${p.name} (${p.slug})`,
                value: p.id,
              }))}
            />
          </div>
        )}
      </div>

      {/* Zero Projects State */}
      {projects.length === 0 && !projectsLoading && (
        <Card className="p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-[#F5F5F7]">No Projects in Workspace</h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-md mx-auto">
            Issues belong to projects. Create your first project to start organizing issues and board stages.
          </p>
        </Card>
      )}

      {/* Active Project Kanban Board */}
      {activeTab === 'board' && selectedProjectId && (
        <KanbanBoardView
          key={selectedProjectId}
          projectId={selectedProjectId}
          projectMembers={projectMembers}
        />
      )}

      {/* My Assigned Tasks View */}
      {activeTab === 'my-tasks' && (
        <div className="space-y-4">
          {loadingMyTasks ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : myTasks.length === 0 ? (
            <Card className="p-12 text-center text-[#71717A]">
              <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-medium text-[#F5F5F7]">You're all caught up!</h3>
              <p className="text-xs text-[#71717A] mt-1">No pending issues are currently assigned to your account.</p>
            </Card>
          ) : (
            <div className="bg-[#111114] border border-[#292930] rounded-lg overflow-hidden divide-y divide-[#1F1F24]">
              {myTasks.map((t) => {
                const isOverdue =
                  t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setIsDetailsOpen(true);
                    }}
                    className="p-3.5 hover:bg-[#17171C] transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#0B0B0E] text-[#A1A1AA] border border-[#1F1F24]">
                          {t.projectSlug || 'ZET'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-medium text-[#F5F5F7] group-hover:text-indigo-400 transition-colors">
                          {t.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#71717A] mt-1">
                        Workspace: <span className="text-[#A1A1AA]">{t.projectName}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end text-xs">
                      <Badge variant={getPriorityVariant(t.priority)} size="xs">
                        {t.priority}
                      </Badge>

                      <Badge variant={getStatusVariant(t.status)} size="xs" dot>
                        {t.status?.replace('_', ' ')}
                      </Badge>

                      {t.due_date && (
                        <span
                          className={`text-[11px] whitespace-nowrap ${
                            isOverdue ? 'text-red-400 font-medium' : 'text-[#71717A]'
                          }`}
                        >
                          {new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Global Task Creation Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={selectedProjectId}
        projectMembers={projectMembers}
        onTaskCreated={() => {
          if (activeTab === 'my-tasks') fetchMyTasks();
        }}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        projectMembers={projectMembers}
        onTaskUpdated={() => {
          if (activeTab === 'my-tasks') fetchMyTasks();
        }}
        onTaskDeleted={() => {
          if (activeTab === 'my-tasks') fetchMyTasks();
        }}
      />
    </div>
  );
}
