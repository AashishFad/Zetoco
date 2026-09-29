import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { useToast } from '../components/ui/Toast';

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const { addToast } = useToast();

  const allTasks = [
    {
      id: 'TASK-101',
      title: 'Payment API & Stripe Webhook Handler',
      project: 'E-Commerce Platform',
      priority: 'HIGH',
      priorityVariant: 'danger',
      status: 'In Progress',
      statusVariant: 'brand',
      dueDate: 'Today',
      assignee: 'Aashish Fad',
    },
    {
      id: 'TASK-102',
      title: 'Navbar Redesign & Responsive Drawer',
      project: 'Mobile App',
      priority: 'MEDIUM',
      priorityVariant: 'warning',
      status: 'Review',
      statusVariant: 'accent',
      dueDate: 'Tomorrow',
      assignee: 'Sneha Patel',
    },
    {
      id: 'TASK-103',
      title: 'Database Connection Pool Tuning',
      project: 'Infrastructure',
      priority: 'HIGH',
      priorityVariant: 'danger',
      status: 'Todo',
      statusVariant: 'slate',
      dueDate: 'Oct 04',
      assignee: 'Aashish Fad',
    },
    {
      id: 'TASK-104',
      title: 'PostgreSQL Health Diagnostics Endpoint',
      project: 'Core Platform',
      priority: 'HIGH',
      priorityVariant: 'danger',
      status: 'Done',
      statusVariant: 'success',
      dueDate: 'Completed',
      assignee: 'Aashish Fad',
    },
    {
      id: 'TASK-105',
      title: 'User Avatar Initials Color Generator',
      project: 'Design System',
      priority: 'LOW',
      priorityVariant: 'slate',
      status: 'Done',
      statusVariant: 'success',
      dueDate: 'Completed',
      assignee: 'Priya Kapoor',
    },
  ];

  const filteredTasks = allTasks.filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'TODO') return t.status === 'Todo';
    if (filter === 'IN_PROGRESS') return t.status === 'In Progress';
    if (filter === 'DONE') return t.status === 'Done';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Task Queue
            </h1>
            <Badge variant="brand" size="sm">
              {allTasks.length} Assigned
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personal task tracking and sprint deliverable queue across all active projects.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          leftIcon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Add Task
        </Button>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-2">
        {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === st
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks Table / Card List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() =>
                  addToast({
                    title: task.id,
                    message: task.title,
                    type: 'info',
                  })
                }
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center">
                    {task.status === 'Done' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-slate-500">○</span>
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">{task.id}</span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white truncate">
                        {task.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">{task.project}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={task.priorityVariant} size="sm">
                    {task.priority}
                  </Badge>
                  <Badge variant={task.statusVariant} size="sm">
                    {task.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {task.dueDate}
                  </span>
                  <Avatar name={task.assignee} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
