import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Trello,
  Users,
  MessageSquare,
  Bell,
  Files,
  BarChart3,
  Settings,
  User,
  Search,
  Menu,
  X,
  ChevronRight,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import ApiStatusBadge from '../components/common/ApiStatusBadge';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import { APP_NAME } from '../constants';
import { useToast } from '../components/ui/Toast';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { addToast } = useToast();

  const mainNav = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', badge: null },
    { name: 'Projects', icon: FolderKanban, path: '/projects', badge: '3' },
    { name: 'My Tasks', icon: CheckSquare, path: '/tasks', badge: '12' },
    { name: 'Kanban Board', icon: Trello, path: '/kanban', badge: null },
    { name: 'Team', icon: Users, path: '/team', badge: '16' },
    { name: 'Messages', icon: MessageSquare, path: '/messages', badge: '2' },
    { name: 'Notifications', icon: Bell, path: '/notifications', badge: '4' },
  ];

  const workspaceNav = [
    { name: 'Files', icon: Files, path: '/files', badge: null },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', badge: 'Beta' },
  ];

  const bottomNav = [
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const mockNotifications = [
    { id: 1, title: 'Rahul assigned you a task', time: '10m ago', unread: true },
    { id: 2, title: 'Priya mentioned you in #frontend', time: '1h ago', unread: true },
    { id: 3, title: 'Payment API moved to Done', time: '2h ago', unread: false },
    { id: 4, title: 'Sprint deadline approaching (2 days)', time: '4h ago', unread: false },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } w-64 bg-dark-900 border-r border-slate-800/80 flex flex-col transition-all duration-250 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Brand */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-400 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                  {APP_NAME}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    SaaS
                  </span>
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        {!isCollapsed ? (
          <div className="p-3 border-b border-slate-800/60">
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  FS
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-slate-200 truncate">FlowSync Workspace</p>
                  <p className="text-[10px] text-slate-400">Recruiter Demo Mode</p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        ) : (
          <div className="p-2 border-b border-slate-800/60 flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center text-xs font-bold">
              FS
            </div>
          </div>
        )}

        {/* Navigation Categories */}
        <div className="flex-1 px-3 py-3 space-y-6 overflow-y-auto">
          {/* Main Group */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Main
              </p>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
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
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Workspace
              </p>
            )}
            <nav className="space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-accent-500/20 text-accent-300 border border-accent-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Navigation & Profile */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                } rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* User Profile Card */}
          <div
            className={`mt-2 pt-2 border-t border-slate-800/60 flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Avatar name="Aashish Fad" status="online" size={isCollapsed ? 'sm' : 'md'} />
              {!isCollapsed && (
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-slate-200 truncate">Aashish Fad</p>
                  <p className="text-[10px] text-slate-400 truncate">Demo Lead Engineer</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <Link
                to="/login"
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-dark-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Visual Search Bar */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects, tasks, or team members..."
                className="w-full bg-slate-900/90 border border-slate-800 text-xs rounded-xl pl-9 pr-12 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors cursor-text"
                onClick={() =>
                  addToast({
                    title: 'Search System',
                    message: 'Global workspace search is a visual demo component for Phase 2.',
                    type: 'info',
                  })
                }
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                ⌘K
              </span>
            </div>
          </div>

          {/* Topbar Right Actions */}
          <div className="flex items-center gap-3">
            {/* Live Backend Status Badge */}
            <div className="hidden lg:block">
              <ApiStatusBadge />
            </div>

            {/* Notification Dropdown */}
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                </button>
              }
              align="right"
              className="relative"
            >
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-white">Notifications</p>
                <Badge variant="brand" size="sm">4 New</Badge>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      n.unread ? 'bg-brand-950/20' : ''
                    }`}
                    onClick={() =>
                      addToast({
                        title: 'Notification Clicked',
                        message: n.title,
                        type: 'info',
                      })
                    }
                  >
                    <p className={`font-medium ${n.unread ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-800 text-center">
                <Link
                  to="/notifications"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 block py-1"
                >
                  View All Notifications
                </Link>
              </div>
            </Dropdown>

            {/* User Profile Dropdown */}
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Avatar name="Aashish Fad" status="online" size="sm" />
                  <span className="text-xs font-medium text-slate-200 hidden sm:inline">Aashish</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              }
              align="right"
            >
              <div className="px-3.5 py-2.5 border-b border-slate-800">
                <p className="text-xs font-bold text-white">Aashish Fad</p>
                <p className="text-[11px] text-slate-400">lead.engineer@flowsync.dev</p>
                <div className="mt-2">
                  <Badge variant="brand" size="sm">Workspace Admin</Badge>
                </div>
              </div>
              <DropdownItem icon={User} onClick={() => window.location.assign('/profile')}>
                My Profile
              </DropdownItem>
              <DropdownItem icon={Settings} onClick={() => window.location.assign('/settings')}>
                Workspace Settings
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={LogOut}
                variant="danger"
                onClick={() => window.location.assign('/login')}
              >
                Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-dark-950 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
