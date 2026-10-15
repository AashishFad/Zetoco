import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  MessageSquare,
  Bell,
  Search,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  FileText,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Shield,
  ExternalLink,
  Check,
  Building,
  Crown,
  Sun,
  Moon,
} from 'lucide-react';
import ApiStatusBadge from '../components/common/ApiStatusBadge';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { Avatar, Badge, Dropdown, DropdownItem, DropdownDivider, Button, useToast } from '../components/ui';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import CreateOrganizationModal from '../components/modals/CreateOrganizationModal';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { useProject } from '../context/ProjectContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import ZetocoLogo from '../components/common/ZetocoLogo';
import { APP_NAME } from '../constants';
import { ROLE_LABELS, ROLE_BADGE_VARIANTS } from '../constants/permissions';

export default function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, profile, signOut } = useAuth();
  const { organizations, currentOrganization, currentRole, can, switchOrganization } = useOrganization();
  const { refreshProjects } = useProject();
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();
  const { isDark, toggleTheme } = useTheme();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Zetoco Member';
  const displayEmail = user?.email || 'user@zetoco.com';
  const orgInitials = currentOrganization?.name ? currentOrganization.name.substring(0, 2).toUpperCase() : 'ZT';

  const handleSignOut = async () => {
    await signOut();
    addToast('Signed out successfully', 'info');
    navigate('/login', { replace: true });
  };

  const mainNav = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Projects', icon: FolderKanban, href: '/projects' },
    { name: 'My Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Team', icon: Users, href: '/team' },
    { name: 'Messages', icon: MessageSquare, href: '/messages' },
    {
      name: 'Notifications',
      icon: Bell,
      href: '/notifications',
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null,
    },
  ];

  const workspaceNav = [
    { name: 'Files', icon: FileText, href: '/files' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  ];

  const bottomNav = [
    { name: 'Settings', icon: Settings, href: '/settings' },
    { name: 'Profile', icon: User, href: '/profile' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const formatDropdownTime = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F7] flex flex-col md:flex-row antialiased">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-[#0B0B0E] border-r border-[#292930] flex flex-col transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        } ${
          mobileSidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-12 px-3.5 border-b border-[#292930] flex items-center justify-between bg-[#0B0B0E]">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden py-1">
            {collapsed && !mobileSidebarOpen ? (
              <ZetocoLogo size="sm" symbolOnly className="hover:scale-105 transition-transform" />
            ) : (
              <ZetocoLogo size="sm" showText className="hover:opacity-90 transition-opacity" />
            )}
          </Link>

          {/* Mobile Close or Desktop Collapse */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-[#71717A] hover:text-[#F5F5F7] p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex text-[#71717A] hover:text-[#F5F5F7] p-1 rounded hover:bg-[#17171C] transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Organization Switcher */}
        {(!collapsed || mobileSidebarOpen) && (
          <div className="p-2 border-b border-[#292930]">
            <Dropdown
              width="w-full"
              align="left"
              className="w-full block"
              trigger={
                <div className="w-full bg-[#111114] hover:bg-[#17171C] rounded-md p-2 border border-[#292930] hover:border-[#383842] flex items-center justify-between transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded bg-[#17171C] text-[#F5F5F7] border border-[#292930] flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {orgInitials}
                    </div>
                    <div className="text-left truncate">
                      <p className="text-xs font-medium text-[#F5F5F7] truncate">
                        {currentOrganization?.name || 'No Organization'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentRole === 'admin' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                        <span className="text-[10px] text-[#71717A] font-normal">
                          {ROLE_LABELS[currentRole] || 'Workspace'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                </div>
              }
            >
              <div className="px-3 py-1.5 border-b border-[#1F1F24] flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Workspaces</p>
                <span className="text-[10px] text-[#71717A] font-mono">{organizations.length}</span>
              </div>
              
              <div className="max-h-48 overflow-y-auto py-1">
                {organizations.length === 0 ? (
                  <div className="p-3 text-center text-xs text-surface-400">
                    No organizations yet
                  </div>
                ) : (
                  organizations.map((org) => {
                    const isSelected = currentOrganization?.id === org.id;
                    return (
                      <DropdownItem
                        key={org.id}
                        icon={isSelected ? Check : undefined}
                        onClick={() => {
                          switchOrganization(org.id);
                          addToast(`Switched to "${org.name}"`, 'info');
                        }}
                      >
                        <span className={isSelected ? 'text-indigo-400 font-semibold' : ''}>
                          {org.name}
                        </span>
                      </DropdownItem>
                    );
                  })
                )}
              </div>

              <DropdownDivider />
              <DropdownItem icon={Plus} onClick={() => setCreateOrgOpen(true)}>
                New Workspace
              </DropdownItem>
            </Dropdown>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 p-2 space-y-4 overflow-y-auto">
          {/* Main Group */}
          <div>
            {(!collapsed || mobileSidebarOpen) && (
              <p className="px-2.5 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                Planning
              </p>
            )}
            <nav className="space-y-0.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors group ${
                      active
                        ? 'bg-[#17171C] text-[#F5F5F7] border-l-2 border-indigo-500 rounded-r-md rounded-l-none'
                        : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#17171C] rounded-md'
                    } ${collapsed && !mobileSidebarOpen ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-[#71717A] group-hover:text-[#A1A1AA]'}`} />
                    {(!collapsed || mobileSidebarOpen) && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {(!collapsed || mobileSidebarOpen) && item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Workspace Group */}
          <div>
            {(!collapsed || mobileSidebarOpen) && (
              <p className="px-2.5 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                Workspace
              </p>
            )}
            <nav className="space-y-0.5">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors group ${
                      active
                        ? 'bg-[#17171C] text-[#F5F5F7] border-l-2 border-indigo-500 rounded-r-md rounded-l-none'
                        : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#17171C] rounded-md'
                    } ${collapsed && !mobileSidebarOpen ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-[#71717A] group-hover:text-[#A1A1AA]'}`} />
                    {(!collapsed || mobileSidebarOpen) && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-2.5 border-t border-[#292930] space-y-0.5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#17171C] text-[#F5F5F7] border-l-2 border-indigo-500 rounded-r-md rounded-l-none'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#17171C] rounded-md'
                } ${collapsed && !mobileSidebarOpen ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                {(!collapsed || mobileSidebarOpen) && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}

          {/* User Profile Mini Tab */}
          <div className="pt-2">
            <Dropdown
              width={collapsed && !mobileSidebarOpen ? 'w-56' : 'w-full'}
              align="left"
              className="w-full block"
              trigger={
                <div
                  className={`w-full flex items-center gap-2.5 p-1.5 rounded-md bg-[#111114] hover:bg-[#17171C] border border-[#292930] transition-colors cursor-pointer ${
                    collapsed && !mobileSidebarOpen ? 'justify-center p-1.5' : ''
                  }`}
                >
                  <Avatar name={displayName} size="xs" status="online" />
                  {(!collapsed || mobileSidebarOpen) && (
                    <div className="text-left truncate flex-1">
                      <p className="text-xs font-medium text-[#F5F5F7] truncate">{displayName}</p>
                      <p className="text-[10px] text-[#71717A] truncate">{displayEmail}</p>
                    </div>
                  )}
                </div>
              }
            >
              <div className="px-3.5 py-2 border-b border-[#1F1F24]">
                <p className="text-xs font-medium text-[#F5F5F7] truncate">{displayName}</p>
                <p className="text-[10px] text-[#71717A] truncate">{displayEmail}</p>
              </div>
              <DropdownItem icon={User} onClick={() => navigate('/profile')}>
                My Profile
              </DropdownItem>
              <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
                Workspace Settings
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={LogOut} danger onClick={handleSignOut}>
                Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
        {/* Top Navigation Bar */}
        <header className="h-12 border-b border-[#292930] bg-[#0B0B0E] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Left: Mobile Toggle & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-[#71717A] hover:text-[#F5F5F7] p-1 rounded hover:bg-[#17171C]"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Linear-style Search Bar */}
            <div
              onClick={() => addToast('Search is active across projects, boards, and members', 'info')}
              className="w-full max-w-xs hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111114] border border-[#292930] text-[#71717A] hover:border-[#383842] cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="text-xs flex-1 truncate">Search issues, projects, teams...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono text-[#71717A] bg-[#17171C] border border-[#292930] rounded">
                /
              </kbd>
            </div>
          </div>

          {/* Right Topbar Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Action New Button */}
            <Dropdown
              width="w-48"
              trigger={
                <Button size="xs" leftIcon={Plus} variant="primary">
                  <span>New</span>
                </Button>
              }
            >
              <DropdownItem icon={Building} onClick={() => setCreateOrgOpen(true)}>
                New Workspace
              </DropdownItem>
              <DropdownItem icon={FolderKanban} onClick={() => setCreateProjectOpen(true)}>
                New Project
              </DropdownItem>
              <DropdownItem icon={CheckSquare} onClick={() => setCreateTaskOpen(true)}>
                New Issue
              </DropdownItem>
            </Dropdown>

            {/* Backend Status Live Badge */}
            <div className="hidden md:block">
              <ApiStatusBadge />
            </div>

            {/* Notifications Dropdown */}
            <Dropdown
              width="w-80"
              trigger={
                <button
                  type="button"
                  className="relative p-1.5 rounded-md text-[#71717A] hover:text-[#F5F5F7] hover:bg-[#17171C] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0B0B0E]" />
                  )}
                </button>
              }
            >
              <div className="px-4 py-3 border-b border-[#1F1F24] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#F5F5F7]">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="brand" size="xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] font-medium text-[#A1A1AA] hover:text-[#F5F5F7]"
                    >
                      Mark all read
                    </button>
                  )}
                  <span
                    className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                    onClick={() => navigate('/notifications')}
                  >
                    View all
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#1F1F24] max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#71717A]">
                    <p className="font-medium text-[#F5F5F7]">You're all caught up!</p>
                    <p className="text-[11px] text-[#71717A] mt-1">No new notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
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
                      }}
                      className={`p-3.5 hover:bg-[#202027] transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.isRead ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-[#F5F5F7] truncate">{n.title}</p>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5 line-clamp-2 leading-snug">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-[#71717A] mt-1">
                          {formatDropdownTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Dropdown>

            {/* Profile Avatar Header */}
            <Dropdown
              width="w-52"
              trigger={
                <div className="cursor-pointer">
                  <Avatar name={displayName} size="sm" status="online" />
                </div>
              }
            >
              <div className="px-3.5 py-2.5 border-b border-[#1F1F24]">
                <p className="text-xs font-semibold text-[#F5F5F7] truncate">{displayName}</p>
                <p className="text-[10px] text-[#A1A1AA] truncate">{displayEmail}</p>
              </div>
              <DropdownItem icon={User} onClick={() => navigate('/profile')}>
                My Profile
              </DropdownItem>
              <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
                Workspace Settings
              </DropdownItem>
              <DropdownItem
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
              >
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={LogOut} danger onClick={handleSignOut}>
                Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Modals */}
      <CreateOrganizationModal isOpen={createOrgOpen} onClose={() => setCreateOrgOpen(false)} />
      <CreateTaskModal isOpen={createTaskOpen} onClose={() => setCreateTaskOpen(false)} />
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onProjectCreated={() => {
          if (refreshProjects) refreshProjects();
        }}
      />
    </div>
  );
}
