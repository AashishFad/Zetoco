import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  Check,
  Filter,
  CheckSquare,
  UserMinus,
  Users,
  Shield,
  Building,
  Trash2,
  ExternalLink,
  FileText,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Tabs,
  Avatar,
  useToast
} from '../components/ui';
import { useNotifications } from '../context/NotificationContext';
import PendingInvitationsSection from '../components/invitations/PendingInvitationsSection';

const NOTIFICATION_CONFIGS = {
  task_assigned: {
    icon: CheckSquare,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  task_unassigned: {
    icon: UserMinus,
    iconColor: 'text-amber-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  task_status_changed: {
    icon: CheckCircle2,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  task_priority_changed: {
    icon: AlertCircle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  task_updated: {
    icon: CheckSquare,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  comment_added: {
    icon: MessageSquare,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  file_uploaded: {
    icon: FileText,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'tasks',
  },
  channel_message: {
    icon: MessageSquare,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'organization',
  },
  project_member_added: {
    icon: Users,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'projects',
  },
  project_role_changed: {
    icon: Shield,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'projects',
  },
  organization_role_changed: {
    icon: Building,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'organization',
  },
  organization_invitation_received: {
    icon: Building,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'organization',
  },
  organization_invitation_accepted: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'organization',
  },
  organization_invitation_declined: {
    icon: AlertCircle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-[#17171C] border-[#1F1F24]',
    category: 'organization',
  },
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationItem,
  } = useNotifications();

  const formatNotificationTimestamp = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      try {
        return date.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      } catch {
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch {
      return 'Recently';
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    addToast('All notifications marked as read', 'success');
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }

    if (n.type === 'project_member_added' || n.type === 'project_role_changed') {
      navigate(`/projects/${n.metadata?.projectId || n.entityId || ''}`);
    } else if (n.type?.startsWith('organization_') || n.entityType === 'organization') {
      navigate('/team');
    } else if (n.type === 'file_uploaded') {
      if (n.entityType === 'task' || n.metadata?.taskId) {
        navigate('/tasks');
      } else {
        navigate('/files');
      }
    } else if (n.type === 'channel_message') {
      navigate('/messages');
    } else {
      navigate('/tasks');
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'tasks', label: 'Tasks' },
    { id: 'projects', label: 'Projects' },
    { id: 'organization', label: 'Organization' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    const config = NOTIFICATION_CONFIGS[n.type];
    return config?.category === activeTab;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F5F7] tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="brand" size="xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Stay updated with real-time issue assignments, comments, and project updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="xs"
            leftIcon={Check}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* In-App Workspace Invitations */}
      <PendingInvitationsSection />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab)}
      />

      {/* Notifications List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-[#0B0B0E] border border-[#1F1F24] animate-pulse flex items-start gap-3.5"
              >
                <div className="w-9 h-9 rounded-md bg-[#17171C] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#17171C] rounded w-1/3" />
                  <div className="h-3 bg-[#17171C] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center text-[#71717A]">
            <div className="w-10 h-10 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-[#F5F5F7]">You're all caught up!</p>
            <p className="text-xs text-[#71717A] mt-1">
              Important updates about your projects and issues will appear here in real-time.
            </p>
          </Card>
        ) : (
          filteredNotifications.map((n) => {
            const config = NOTIFICATION_CONFIGS[n.type] || {
              icon: Bell,
              iconColor: 'text-indigo-400',
              iconBg: 'bg-[#17171C] border-[#1F1F24]',
            };
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                className={`p-3.5 rounded-lg border transition-all flex items-start justify-between gap-4 group ${
                  !n.isRead
                    ? 'bg-[#111114] border-indigo-500/40 shadow-sm'
                    : 'bg-[#0B0B0E] border-[#1F1F24] hover:border-[#292930]'
                }`}
              >
                <div
                  className="flex items-start gap-3 flex-1 cursor-pointer min-w-0"
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`p-2 rounded-md border shrink-0 ${config.iconBg}`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-medium text-[#F5F5F7] group-hover:text-indigo-400 transition-colors">
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#71717A]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatNotificationTimestamp(n.createdAt)}
                      </span>
                      {n.actorName && (
                        <span>By {n.actorName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead ? (
                    <button
                      onClick={() => markNotificationAsRead(n.id)}
                      className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-[#17171C] transition-colors"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#71717A] font-normal px-2 py-1">
                      Read
                    </span>
                  )}

                  <button
                    onClick={() => deleteNotificationItem(n.id)}
                    className="p-1 rounded text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
