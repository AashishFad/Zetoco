import React, { useState } from 'react';
import {
  Trello,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Clock,
  Tag,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { useToast } from '../components/ui/Toast';

export default function KanbanPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const { addToast } = useToast();

  const columns = [
    { id: 'BACKLOG', name: 'Backlog', count: 3, accent: 'border-slate-700 bg-slate-900/40' },
    { id: 'TODO', name: 'To Do', count: 4, accent: 'border-brand-500/40 bg-brand-950/20' },
    { id: 'IN_PROGRESS', name: 'In Progress', count: 3, accent: 'border-accent-500/40 bg-accent-950/20' },
    { id: 'REVIEW', name: 'Review', count: 2, accent: 'border-amber-500/40 bg-amber-950/20' },
    { id: 'DONE', name: 'Done', count: 5, accent: 'border-emerald-500/40 bg-emerald-950/20' },
  ];

  const tasks = [
    {
      id: 'TASK-101',
      title: 'Implement Login API & JWT Middleware',
      column: 'TODO',
      priority: 'HIGH',
      priorityVariant: 'danger',
      assignee: 'Rahul Sharma',
      labels: ['Backend', 'Security'],
      dueDate: 'Oct 02',
    },
    {
      id: 'TASK-102',
      title: 'Build Product Search & Multi-Filter',
      column: 'BACKLOG',
      priority: 'MEDIUM',
      priorityVariant: 'warning',
      assignee: 'Priya Kapoor',
      labels: ['Frontend', 'Search'],
      dueDate: 'Oct 08',
    },
    {
      id: 'TASK-103',
      title: 'Payment Integration (Stripe Webhooks)',
      column: 'IN_PROGRESS',
      priority: 'HIGH',
      priorityVariant: 'danger',
      assignee: 'Aashish Fad',
      labels: ['API', 'Payments'],
      dueDate: 'Today',
    },
    {
      id: 'TASK-104',
      title: 'Navbar Redesign & Mobile Drawer',
      column: 'REVIEW',
      priority: 'LOW',
      priorityVariant: 'slate',
      assignee: 'Sneha Patel',
      labels: ['UI/UX'],
      dueDate: 'Oct 01',
    },
    {
      id: 'TASK-105',
      title: 'PostgreSQL Connection Pooling Setup',
      column: 'DONE',
      priority: 'HIGH',
      priorityVariant: 'danger',
      assignee: 'Aashish Fad',
      labels: ['Database', 'Core'],
      dueDate: 'Yesterday',
    },
    {
      id: 'TASK-106',
      title: 'Audit Logs and Activity Feed Engine',
      column: 'IN_PROGRESS',
      priority: 'MEDIUM',
      priorityVariant: 'warning',
      assignee: 'Dhruv Mehta',
      labels: ['Backend'],
      dueDate: 'Oct 04',
    },
    {
      id: 'TASK-107',
      title: 'Email Notification Dispatcher Setup',
      column: 'BACKLOG',
      priority: 'LOW',
      priorityVariant: 'slate',
      assignee: 'Vikram Rao',
      labels: ['Async', 'Email'],
      dueDate: 'Oct 12',
    },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority === 'ALL') return true;
    return t.priority === filterPriority;
  });

  return (
    <div className="space-y-6 max-w-full">
      {/* Kanban Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kanban Board
            </h1>
            <Badge variant="brand" size="sm">
              Sprint 14
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual task management and stage progression across development queues.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Priority Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterPriority === p
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="primary"
            leftIcon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board 5 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.column === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.accent} p-3.5 flex flex-col min-w-[260px] max-w-full`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {col.name}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Add task in this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() =>
                      addToast({
                        title: task.id,
                        message: `Task details for "${task.title}". (Phase 2 UI demo).`,
                        type: 'info',
                      })
                    }
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 hover:border-brand-500/50 hover:shadow-card-subtle transition-all cursor-pointer group"
                  >
                    {/* Top: Task ID & Priority */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-semibold text-slate-500 group-hover:text-brand-300">
                        {task.id}
                      </span>
                      <Badge variant={task.priorityVariant} size="sm">
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug line-clamp-2">
                      {task.title}
                    </h4>

                    {/* Labels */}
                    <div className="flex flex-wrap gap-1 mt-2.5 mb-3">
                      {task.labels.map((label) => (
                        <span
                          key={label}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Bottom: Assignee & Due Date */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{task.dueDate}</span>
                      </div>
                      <Avatar name={task.assignee} size="xs" />
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="h-24 rounded-xl border border-dashed border-slate-800/60 flex items-center justify-center text-[11px] text-slate-500">
                    No tasks in {col.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
