import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Tag,
  Paperclip,
  MessageSquare,
  AlertCircle,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  User,
  GripVertical,
  ChevronsUp,
  ChevronUp,
  Minus,
  ChevronDown,
  Bookmark,
} from 'lucide-react';
import { Badge, Avatar, Button, Input, Select, useToast } from '../ui';
import CreateTaskModal from '../modals/CreateTaskModal';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import * as taskService from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', dotColor: '#52525B' },
  { id: 'todo', title: 'To Do', dotColor: '#71717A' },
  { id: 'in_progress', title: 'In Progress', dotColor: '#6366F1' },
  { id: 'review', title: 'In Review', dotColor: '#818CF8' },
  { id: 'done', title: 'Done', dotColor: '#10B981' },
];

export default function KanbanBoardView({
  projectId,
  projectMembers = [],
  initialTasks = null,
  onTaskCountChange,
}) {
  const { user } = useAuth();
  const { can, members: orgMembers } = useOrganization();
  const { addToast } = useToast();

  const allEligibleMembers = useMemo(() => {
    const userMap = new Map();
    (orgMembers || []).forEach((m) => {
      const id = m.userId || m.user_id || m.id;
      if (id) userMap.set(id, m);
    });
    (projectMembers || []).forEach((m) => {
      const id = m.userId || m.user_id || m.id;
      if (id && !userMap.has(id)) {
        userMap.set(id, m);
      }
    });
    return Array.from(userMap.values());
  }, [orgMembers, projectMembers]);

  const [tasks, setTasks] = useState(initialTasks || []);
  const [loading, setLoading] = useState(!initialTasks || initialTasks.length === 0);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createColumnTarget, setCreateColumnTarget] = useState('todo');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Stable ref for parent callback to avoid re-triggering fetch loops
  const onTaskCountChangeRef = useRef(onTaskCountChange);
  useEffect(() => {
    onTaskCountChangeRef.current = onTaskCountChange;
  }, [onTaskCountChange]);

  const currentProjectIdRef = useRef(projectId);
  const isInitialMountRef = useRef(true);

  const fetchTasks = useCallback(async (showSkeleton = false) => {
    if (!projectId) return;
    if (showSkeleton) {
      setLoading(true);
    }
    currentProjectIdRef.current = projectId;

    try {
      const data = await taskService.getTasksByProject(projectId);
      setTasks(data || []);
      if (onTaskCountChangeRef.current) {
        onTaskCountChangeRef.current((data || []).length);
      }
    } catch (err) {
      console.warn('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      const isNewProject = currentProjectIdRef.current !== projectId;
      const isFirst = isInitialMountRef.current || isNewProject;
      isInitialMountRef.current = false;

      // Only show skeleton if we have no tasks for this project yet
      const needsSkeleton = isFirst && (!initialTasks || initialTasks.length === 0);
      fetchTasks(needsSkeleton);
    }
  }, [projectId, fetchTasks]);

  // Keep tasks synced if parent updates initialTasks
  useEffect(() => {
    if (initialTasks && Array.isArray(initialTasks) && initialTasks.length > 0) {
      setTasks(initialTasks);
      setLoading(false);
    }
  }, [initialTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (!t) return false;
      const titleStr = typeof t.title === 'string' ? t.title : '';
      const descStr = typeof t.description === 'string' ? t.description : '';
      const searchStr = (search || '').toLowerCase();
      const matchesSearch =
        !searchStr ||
        titleStr.toLowerCase().includes(searchStr) ||
        descStr.toLowerCase().includes(searchStr);

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      let matchesAssignee = true;
      if (assigneeFilter === 'UNASSIGNED') {
        matchesAssignee = !t.assigned_to;
      } else if (assigneeFilter !== 'ALL') {
        matchesAssignee = t.assigned_to === assigneeFilter;
      }

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, search, priorityFilter, assigneeFilter]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const map = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    filteredTasks.forEach((t) => {
      const col = t.status || 'todo';
      if (map[col]) {
        map[col].push(t);
      } else {
        map.todo.push(t);
      }
    });

    // Sort each column by order_index
    Object.keys(map).forEach((col) => {
      map[col].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    });

    return map;
  }, [filteredTasks]);

  // Drag and Drop handlers (HTML5 Drag & Drop)
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    if (targetTask.status === targetColumnId) {
      return;
    }

    // Compute next order index in the target column
    const columnTasks = tasks.filter((t) => t.status === targetColumnId);
    const nextOrder =
      columnTasks.length > 0
        ? Math.max(...columnTasks.map((t) => t.order_index || 0)) + 1
        : 1;

    // Optimistic UI update
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: targetColumnId, order_index: nextOrder } : t
    );
    setTasks(updatedTasks);

    // Persist to backend / Supabase
    const res = await taskService.updateTask(taskId, {
      status: targetColumnId,
      order_index: nextOrder,
    });

    if (res.success) {
      addToast(`Moved to ${targetColumnId.replace('_', ' ')}`, 'info');
    } else {
      // Rollback on failure
      setTasks(previousTasks);
      addToast(res.error || 'Failed to update task status', 'error');
    }

    setDraggedTaskId(null);
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleOpenCreateInColumn = (columnId) => {
    setCreateColumnTarget(columnId);
    setIsCreateOpen(true);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    if (onTaskCountChange) onTaskCountChange(tasks.length + 1);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };

  const handleTaskDeleted = (deletedTaskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId));
    if (onTaskCountChange) onTaskCountChange(Math.max(0, tasks.length - 1));
  };

  // Jira Priority Icon and Badge
  const renderPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <div className="flex items-center gap-1 text-rose-400 font-bold" title="Urgent / Highest Priority">
            <ChevronsUp className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase">URGENT</span>
          </div>
        );
      case 'high':
        return (
          <div className="flex items-center gap-1 text-orange-400 font-bold" title="High Priority">
            <ChevronUp className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] uppercase">HIGH</span>
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center gap-1 text-amber-400 font-medium" title="Medium Priority">
            <Minus className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase">MED</span>
          </div>
        );
      case 'low':
        return (
          <div className="flex items-center gap-1 text-emerald-400 font-medium" title="Low Priority">
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase">LOW</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-slate-400">
            <Minus className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] uppercase">MED</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Board Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111114] p-3 rounded-lg border border-[#292930]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { label: 'All Priorities', value: 'ALL' },
                { label: 'Urgent (Highest)', value: 'urgent' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' },
              ]}
            />

            <Select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              options={[
                { label: 'All Assignees', value: 'ALL' },
                { label: 'Unassigned', value: 'UNASSIGNED' },
                ...allEligibleMembers.filter(Boolean).map((m) => ({
                  label: m.fullName || m.full_name || 'Member',
                  value: m.userId || m.user_id || m.id,
                })),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          <span className="text-xs font-medium text-[#A1A1AA] px-2.5 py-1 bg-[#17171C] rounded-md border border-[#1F1F24]">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'Issue' : 'Issues'}
          </span>

          <Button
            size="xs"
            leftIcon={Plus}
            onClick={() => handleOpenCreateInColumn('todo')}
          >
            Create Issue
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="bg-[#0B0B0E] rounded-lg p-3 min-h-[450px] border border-[#1F1F24] animate-pulse space-y-3"
            >
              <div className="h-5 bg-[#17171C] rounded w-2/3 mb-3" />
              <div className="h-24 bg-[#17171C] rounded-md border border-[#1F1F24]" />
              <div className="h-24 bg-[#17171C] rounded-md border border-[#1F1F24]" />
            </div>
          ))}
        </div>
      )}

      {/* 5-Column Kanban Board Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4 items-start min-w-full">
          {COLUMNS.map((col) => {
            const columnTasks = tasksByColumn[col.id] || [];
            const isDropTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-[#0B0B0E] border rounded-lg p-2.5 flex flex-col min-h-[540px] transition-all ${
                  isDropTarget
                    ? 'border-indigo-500/60 bg-[#111114] ring-1 ring-indigo-500/30'
                    : 'border-[#1F1F24]'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1F1F24]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.dotColor }}
                    />
                    <span className="text-xs font-medium text-[#F5F5F7]">
                      {col.title}
                    </span>
                    <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-[#17171C] text-[#71717A] border border-[#1F1F24]">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenCreateInColumn(col.id)}
                    className="p-1 rounded-md text-[#71717A] hover:text-[#F5F5F7] hover:bg-[#17171C] transition-colors"
                    title={`Create Issue in ${col.title}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 border border-dashed border-[#1F1F24] rounded-md flex items-center justify-center text-center p-3">
                      <span className="text-[11px] text-[#71717A]">
                        {isDropTarget ? 'Drop issue here' : 'No issues'}
                      </span>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isOverdue =
                        task.due_date &&
                        task.status !== 'done' &&
                        new Date(task.due_date) < new Date();

                      const isDragging = draggedTaskId === task.id;
                      const issueKey = task.id ? `ZET-${task.id.substring(0, 4).toUpperCase()}` : 'ZET-TASK';

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => handleCardClick(task)}
                          className={`p-3 rounded-md bg-[#17171C] hover:bg-[#202027] border transition-all cursor-grab active:cursor-grabbing group space-y-2 shadow-sm ${
                            isDragging
                              ? 'opacity-40 border-indigo-500'
                              : 'border-[#292930] hover:border-[#3D3D48]'
                          }`}
                        >
                          {/* Top Row: Issue Key & Priority */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-medium text-[#A1A1AA] bg-[#111114] px-1.5 py-0.5 rounded border border-[#1F1F24] group-hover:text-indigo-400">
                              {issueKey}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {renderPriorityIcon(task.priority)}
                              <GripVertical className="w-3 h-3 text-[#71717A] group-hover:text-[#A1A1AA] transition-colors shrink-0" />
                            </div>
                          </div>

                          {/* Issue Title */}
                          <h4 className="text-xs font-medium text-[#F5F5F7] leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Bottom Row: Due date & Assignee */}
                          <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between text-[11px]">
                            {task.due_date ? (
                              <span
                                className={`flex items-center gap-1 text-[10px] font-normal ${
                                  isOverdue
                                    ? 'text-red-400 font-medium'
                                    : 'text-[#71717A]'
                                }`}
                              >
                                <Calendar className="w-3 h-3 text-[#71717A]" />
                                <span>
                                  {new Date(task.due_date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#71717A]">No due date</span>
                            )}

                            <div
                              className="flex items-center gap-1.5"
                              title={task.assigneeName || 'Unassigned'}
                            >
                              <Avatar name={task.assigneeName || 'Unassigned'} size="xs" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        initialStatus={createColumnTarget}
        projectMembers={allEligibleMembers}
        onTaskCreated={handleTaskCreated}
      />

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        projectMembers={allEligibleMembers}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}
