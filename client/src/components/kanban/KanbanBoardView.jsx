import React, { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Tag,
  Paperclip,
  MessageSquare,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { Badge, Avatar, Button, Input, useToast } from '../ui';

export default function KanbanBoardView({ onAddTask }) {
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  // Section 13 Requirements: BACKLOG, TODO, IN PROGRESS, REVIEW, DONE
  const initialColumns = [
    {
      id: 'BACKLOG',
      title: 'BACKLOG',
      color: 'border-t-slate-500',
      badgeColor: 'neutral',
      cards: [
        {
          id: 'FS-105',
          title: 'Build Product Search & Filters',
          priority: 'MEDIUM',
          priorityVariant: 'warning',
          assignee: 'Dhruv Mehta',
          labels: ['Search', 'Frontend'],
          dueDate: 'Oct 12',
          comments: 2,
          attachments: 1,
        },
        {
          id: 'FS-106',
          title: 'Automated E2E Test Suite Setup',
          priority: 'LOW',
          priorityVariant: 'neutral',
          assignee: 'Priya Patel',
          labels: ['QA', 'Testing'],
          dueDate: 'Oct 15',
          comments: 0,
          attachments: 0,
        },
      ],
    },
    {
      id: 'TODO',
      title: 'TODO',
      color: 'border-t-sky-500',
      badgeColor: 'brand',
      cards: [
        {
          id: 'FS-104',
          title: 'Navbar Redesign with Tailwind Tokens',
          priority: 'LOW',
          priorityVariant: 'neutral',
          assignee: 'Sarah Jenkins',
          labels: ['UI/UX', 'Design'],
          dueDate: 'Oct 08',
          comments: 4,
          attachments: 2,
        },
        {
          id: 'FS-107',
          title: 'PostgreSQL Migration Scripts for RBAC',
          priority: 'HIGH',
          priorityVariant: 'danger',
          assignee: 'Aashish Lead',
          labels: ['Database', 'Security'],
          dueDate: 'Oct 09',
          comments: 1,
          attachments: 0,
        },
      ],
    },
    {
      id: 'IN_PROGRESS',
      title: 'IN PROGRESS',
      color: 'border-t-brand-500',
      badgeColor: 'brand',
      cards: [
        {
          id: 'FS-103',
          title: 'Payment Integration (Stripe Webhooks)',
          priority: 'HIGH',
          priorityVariant: 'danger',
          assignee: 'Rahul Sharma',
          labels: ['Backend', 'Billing'],
          dueDate: 'Tomorrow',
          comments: 6,
          attachments: 3,
        },
        {
          id: 'FS-108',
          title: 'Real-Time WebSocket Protocol Definition',
          priority: 'HIGH',
          priorityVariant: 'danger',
          assignee: 'Aashish Lead',
          labels: ['Architecture', 'WebSockets'],
          dueDate: 'Oct 11',
          comments: 3,
          attachments: 1,
        },
      ],
    },
    {
      id: 'REVIEW',
      title: 'REVIEW',
      color: 'border-t-amber-500',
      badgeColor: 'warning',
      cards: [
        {
          id: 'FS-101',
          title: 'Implement Login API & JWT Middleware',
          priority: 'HIGH',
          priorityVariant: 'danger',
          assignee: 'Rahul Sharma',
          labels: ['Backend', 'Auth'],
          dueDate: 'Today',
          comments: 8,
          attachments: 2,
        },
      ],
    },
    {
      id: 'DONE',
      title: 'DONE',
      color: 'border-t-emerald-500',
      badgeColor: 'success',
      cards: [
        {
          id: 'FS-100',
          title: 'Project Architecture & Express Boilerplate',
          priority: 'HIGH',
          priorityVariant: 'brand',
          assignee: 'Aashish Lead',
          labels: ['DevOps', 'Foundation'],
          dueDate: 'Completed',
          comments: 5,
          attachments: 4,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Board Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-900/80 p-3.5 rounded-2xl border border-surface-800">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Filter tasks in board..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Badge variant="brand" size="sm">
            Phase 2 Visual Kanban (Drag-and-Drop arrives in Phase 7)
          </Badge>
          <Button size="xs" leftIcon={Plus} onClick={onAddTask}>
            Add Card
          </Button>
        </div>
      </div>

      {/* 5-Column Kanban Board Grid (Horizontal Scroll on Small Screens) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {initialColumns.map((col) => {
          const filteredCards = col.cards.filter((c) =>
            c.title.toLowerCase().includes(search.toLowerCase())
          );

          return (
            <div
              key={col.id}
              className={`bg-surface-900/60 border border-surface-800 rounded-2xl p-3.5 flex flex-col min-h-[500px] border-t-4 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-800/80">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-800 text-slate-400">
                    {filteredCards.length}
                  </span>
                </div>

                <button
                  onClick={onAddTask}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
                  title="Add Task to Column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => addToast(`Selected card ${card.id}: ${card.title}`, 'info')}
                    className="p-3.5 rounded-xl bg-surface-950 border border-surface-800/90 hover:border-brand-500/60 hover:shadow-card transition-all cursor-pointer group space-y-3"
                  >
                    {/* Top row: ID & Priority */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-brand-300">
                        {card.id}
                      </span>
                      <Badge variant={card.priorityVariant} size="xs">
                        {card.priority}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">
                      {card.title}
                    </h4>

                    {/* Labels */}
                    <div className="flex flex-wrap gap-1">
                      {card.labels.map((lbl) => (
                        <span
                          key={lbl}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-surface-900 text-slate-400 border border-surface-800"
                        >
                          {lbl}
                        </span>
                      ))}
                    </div>

                    {/* Bottom row: Due date, comments, assignee */}
                    <div className="pt-2 border-t border-surface-850 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {card.dueDate}
                        </span>
                        {card.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-500" />
                            {card.comments}
                          </span>
                        )}
                      </div>

                      <Avatar name={card.assignee} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
