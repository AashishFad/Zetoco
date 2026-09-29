import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Check,
  Filter,
  Trash2,
  Sparkles
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'task',
      icon: Bell,
      iconBg: 'bg-brand-500/10 text-brand-400',
      title: 'Rahul assigned you a task',
      description: 'You were assigned to "Implement Payment Gateway Integration (Stripe)" in E-Commerce Platform.',
      time: '10 mins ago',
      unread: true,
    },
    {
      id: 2,
      type: 'mention',
      icon: MessageSquare,
      iconBg: 'bg-accent-500/10 text-accent-400',
      title: 'Priya mentioned you in #frontend',
      description: '"@Aashish what do you think of the new design tokens and button focus rings?"',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      type: 'success',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      title: 'Payment API completed',
      description: 'The task was verified and moved to "Done" column by QA.',
      time: '2 hours ago',
      unread: false,
    },
    {
      id: 4,
      type: 'warning',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/10 text-amber-400',
      title: 'Task deadline approaching',
      description: '"Navbar Redesign & Mobile Drawer" is due in 24 hours.',
      time: '4 hours ago',
      unread: false,
    },
  ]);

  const tabs = [
    { id: 'all', label: 'All Alerts', badge: notifications.length },
    { id: 'unread', label: 'Unread', badge: notifications.filter((n) => n.unread).length },
    { id: 'task', label: 'Tasks' },
    { id: 'mention', label: 'Mentions' },
  ];

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    addToast({
      title: 'Notifications Updated',
      message: 'All notifications marked as read.',
      type: 'success',
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'task') return n.type === 'task';
    if (filter === 'mention') return n.type === 'mention';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Notification Center
            </h1>
            <Badge variant="brand" size="sm">
              {notifications.filter((n) => n.unread).length} Unread
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stay updated on assignments, team mentions, and milestone progress.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          leftIcon={Check}
          onClick={handleMarkAllRead}
        >
          Mark all as read
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={filter} onChange={setFilter} />

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                n.unread
                  ? 'bg-brand-950/20 border-brand-500/30 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${n.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-xs sm:text-sm font-bold ${n.unread ? 'text-white' : 'text-slate-200'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{n.description}</p>
              </div>

              {n.unread && (
                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2"></span>
              )}
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No notifications matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
