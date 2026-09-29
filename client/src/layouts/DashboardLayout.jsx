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
  Sparkles,
  ExternalLink,
  Check
} from 'lucide-react';
import ApiStatusBadge from '../components/common/ApiStatusBadge';
import { Avatar, Badge, Dropdown, DropdownItem, DropdownDivider, Button, useToast } from '../components/ui';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';

export default function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'FlowSync User';
  const displayEmail = user?.email || 'user@flowsync.dev';

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
    { name: 'Messages', icon: MessageSquare, href: '/messages', badge: '3' },
    { name: 'Notifications', icon: Bell, href: '/notifications', badge: '4' },
  ];

  const workspaceNav = [
    { name: 'Files', icon: FileText, href: '/files' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  ];

  const bottomNav = [
    { name: 'Settings', icon: Settings, href: '/settings' },
    { name: 'Profile', icon: User, href: '/profile' },
  ];

  const mockNotifications = [
    { id: 1, title: 'Rahul assigned you a task', desc: 'Implement Login API in FlowSync Core', time: '5m ago', unread: true },
    { id: 2, title: 'Priya mentioned you', desc: '"Check the updated design tokens for dark theme"', time: '1h ago', unread: true },
    { id: 3, title: 'Payment API completed', desc: 'Task moved to Done column by Dhruv', time: '2h ago', unread: false },
  ];

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen bg-surface-900 border-r border-surface-800 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-surface-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-brand-600/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {(!collapsed || mobileSidebarOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  {APP_NAME}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase">
                    PRO
                  </span>
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close or Desktop Collapse */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-surface-800 transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Workspace Switcher */}
        {(!collapsed || mobileSidebarOpen) && (
          <div className="p-3 border-b border-surface-800/80">
            <Dropdown
              width="w-56"
              trigger={
                <div className="w-full bg-surface-950/60 hover:bg-surface-800/80 rounded-xl p-2.5 border border-surface-800/80 flex items-center justify-between transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-bold shrink-0 border border-brand-500/30">
                      FS
                    </div>
                    <div className="text-left truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                        Acme Engineering
                      </p>
                      <p className="text-[10px] text-slate-400">Team Workspace</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              }
            >
              <div className="px-3 py-2 border-b border-surface-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Workspaces</p>
              </div>
              <DropdownItem icon={Check} onClick={() => addToast('Switched to Acme Engineering', 'info')}>
                Acme Engineering
              </DropdownItem>
              <DropdownItem onClick={() => addToast('Switched to Mobile App Team', 'info')}>
                Mobile App Team
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={Plus} onClick={() => setCreateProjectOpen(true)}>
                Create Workspace
              </DropdownItem>
            </Dropdown>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 p-3 space-y-6 overflow-y-auto">
          {/* Main Group */}
          <div>
            {(!collapsed || mobileSidebarOpen) && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Main
              </p>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      active
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800/80'
                    } ${collapsed && !mobileSidebarOpen ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {(!collapsed || mobileSidebarOpen) && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {(!collapsed || mobileSidebarOpen) && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        }`}
                      >
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
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Workspace
              </p>
            )}
            <nav className="space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      active
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800/80'
                    } ${collapsed && !mobileSidebarOpen ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
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
        <div className="p-3 border-t border-surface-800 space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-surface-800/80'
                } ${collapsed && !mobileSidebarOpen ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {(!collapsed || mobileSidebarOpen) && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}

          {/* User Profile Mini Tab */}
          <div className="pt-2">
            <Dropdown
              width="w-56"
              align="left"
              trigger={
                <div
                  className={`w-full flex items-center gap-3 p-2 rounded-xl bg-surface-950/60 hover:bg-surface-800 border border-surface-800/80 transition-colors cursor-pointer ${
                    collapsed && !mobileSidebarOpen ? 'justify-center p-1.5' : ''
                  }`}
                >
                  <Avatar name={displayName} size="sm" status="online" />
                  {(!collapsed || mobileSidebarOpen) && (
                    <div className="text-left truncate flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
                    </div>
                  )}
                </div>
              }
            >
              <div className="px-3.5 py-2.5 border-b border-surface-800">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
              </div>
              <DropdownItem icon={User} onClick={() => navigate('/profile')}>
                View Profile
              </DropdownItem>
              <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
                Preferences
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-surface-800 bg-surface-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile Toggle & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Visual Search Bar */}
            <div
              onClick={() => addToast('Global Search is a Phase 2 visual mockup (Press Ctrl+K)', 'info')}
              className="w-full max-w-sm hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-950/80 border border-surface-800 text-slate-400 hover:border-surface-700 cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs flex-1 truncate">Search tasks, projects, members...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-surface-800 border border-surface-700 rounded">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right Topbar Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Action New Button */}
            <Dropdown
              width="w-48"
              trigger={
                <Button size="xs" leftIcon={Plus} variant="primary">
                  <span>Create</span>
                </Button>
              }
            >
              <DropdownItem icon={CheckSquare} onClick={() => setCreateTaskOpen(true)}>
                New Task
              </DropdownItem>
              <DropdownItem icon={FolderKanban} onClick={() => setCreateProjectOpen(true)}>
                New Project
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
                  className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-surface-900 animate-pulse"></span>
                </button>
              }
            >
              <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Notifications</span>
                <span className="text-[10px] font-semibold text-brand-400 hover:underline cursor-pointer" onClick={() => navigate('/notifications')}>
                  View all
                </span>
              </div>
              <div className="divide-y divide-surface-800/60 max-h-72 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className={`p-3.5 hover:bg-surface-800/50 transition-colors ${n.unread ? 'bg-brand-500/5' : ''}`}>
                    <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                  </div>
                ))}
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
              <div className="px-3.5 py-2.5 border-b border-surface-800">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
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
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals for Fast UI Prototyping */}
      <CreateTaskModal isOpen={createTaskOpen} onClose={() => setCreateTaskOpen(false)} />
      <CreateProjectModal isOpen={createProjectOpen} onClose={() => setCreateProjectOpen(false)} />
    </div>
  );
}
