import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  Check,
  Filter,
  Sparkles,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Tabs, useToast } from '../components/ui';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { addToast } = useToast();

  // Section 16 Requirements: Rahul assigned you a task, Priya mentioned you, Payment API completed, Task deadline approaching
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'task',
      icon: Bell,
      iconColor: 'text-brand-400',
      iconBg: 'bg-brand-500/15 border-brand-500/30',
      title: 'Rahul assigned you a task',
      description: 'You were assigned to "Implement Login API & JWT Middleware" on FlowSync Core.',
      time: '10 mins ago',
      unread: true,
      category: 'tasks',
    },
    {
      id: 2,
      type: 'mention',
      icon: MessageSquare,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      title: 'Priya mentioned you',
      description: 'In #frontend: "@Aashish can you review the new accessible modal focus traps?"',
      time: '1 hour ago',
      unread: true,
      category: 'mentions',
    },
    {
      id: 3,
      type: 'complete',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      title: 'Payment API completed',
      description: 'Dhruv moved "Stripe Webhooks & Reconciliation" to the Done column.',
      time: '2 hours ago',
      unread: false,
      category: 'tasks',
    },
    {
      id: 4,
      type: 'deadline',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      title: 'Task deadline approaching',
      description: '"Database Indexing & PostgreSQL Config" is due tomorrow at 5:00 PM.',
      time: '4 hours ago',
      unread: false,
      category: 'system',
    },
    {
      id: 5,
      type: 'project',
      icon: FolderKanban,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      title: 'New Sprint 14 created',
      description: 'Sprint 14 has begun for project "E-Commerce Platform" with 32 story points.',
      time: 'Yesterday',
      unread: false,
      category: 'system',
    },
  ]);

  const tabs = [
    { id: 'all', label: 'All Notifications', count: notifications.length },
    { id: 'unread', label: 'Unread', count: notifications.filter((n) => n.unread).length },
    { id: 'tasks', label: 'Tasks' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'system', label: 'System Alerts' },
  ];

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    addToast('All notifications marked as read', 'success');
  };

  const toggleRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return n.unread;
    return n.category === activeTab;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Stay updated with task assignments, team mentions, and sprint alerts.
          </p>
        </div>

        <Button
          variant="outline"
          size="xs"
          leftIcon={Check}
          onClick={markAllRead}
        >
          Mark all as read
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab)}
      />

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-white">No notifications in this category</p>
            <p className="text-xs mt-1">You are all caught up!</p>
          </Card>
        ) : (
          filteredNotifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.unread
                    ? 'bg-surface-900 border-brand-500/40 shadow-sm'
                    : 'bg-surface-950/60 border-surface-800/80 hover:border-surface-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${n.iconBg}`}>
                    <Icon className={`w-4 h-4 ${n.iconColor}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        {n.title}
                      </h3>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {n.description}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-2 block flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {n.time}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => toggleRead(n.id)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-surface-800 transition-colors"
                  >
                    {n.unread ? 'Mark read' : 'Mark unread'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
