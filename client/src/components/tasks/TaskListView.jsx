import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Plus
} from 'lucide-react';
import { Badge, Avatar, Button, Input, Select } from '../ui';
import TaskDetailsModal from '../modals/TaskDetailsModal';
import CreateTaskModal from '../modals/CreateTaskModal';

export default function TaskListView({
  projectId,
  tasks = [],
  projectMembers = [],
  onTaskUpdated,
  onTaskDeleted,
  onTaskCreated,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredTasks = (tasks || []).filter((t) => {
    if (!t) return false;
    const titleStr = typeof t.title === 'string' ? t.title : '';
    const descStr = typeof t.description === 'string' ? t.description : '';
    const searchStr = (search || '').toLowerCase();
    const matchesSearch =
      !searchStr ||
      titleStr.toLowerCase().includes(searchStr) ||
      descStr.toLowerCase().includes(searchStr);

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-900/80 p-3.5 rounded-2xl border border-surface-800">
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Backlog', value: 'backlog' },
              { label: 'To Do', value: 'todo' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Review', value: 'review' },
              { label: 'Done', value: 'done' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          <Badge variant="brand" size="sm">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
          </Badge>

          <Button size="xs" leftIcon={Plus} onClick={() => setIsCreateOpen(true)}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Task List Table / Cards */}
      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl overflow-hidden divide-y divide-surface-800">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-white">No tasks found</p>
            <p className="text-xs mt-1">Create a new task or adjust your search filters.</p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isOverdue =
              t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();

            return (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTask(t);
                  setIsDetailsOpen(true);
                }}
                className="p-4 hover:bg-surface-850/60 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="pt-0.5">
                    <span className="w-2 h-2 rounded-full block bg-brand-400 mt-1.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
                  <Badge variant={getPriorityVariant(t.priority)} size="xs">
                    {t.priority}
                  </Badge>

                  <Badge variant={getStatusVariant(t.status)} size="xs" dot>
                    {t.status?.replace('_', ' ')}
                  </Badge>

                  <div className="flex items-center gap-1.5 min-w-[100px]" title={t.assigneeName || 'Unassigned'}>
                    <Avatar name={t.assigneeName || 'Unassigned'} size="xs" />
                    <span className="text-[11px] text-slate-300 truncate max-w-[80px]">
                      {t.assigneeName?.split(' ')[0] || 'Unassigned'}
                    </span>
                  </div>

                  {t.due_date && (
                    <span
                      className={`text-[11px] whitespace-nowrap ${
                        isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        projectMembers={projectMembers}
        onTaskUpdated={(updated) => {
          if (onTaskUpdated) onTaskUpdated(updated);
          setSelectedTask(updated);
        }}
        onTaskDeleted={onTaskDeleted}
      />

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        projectMembers={projectMembers}
        onTaskCreated={onTaskCreated}
      />
    </div>
  );
}
