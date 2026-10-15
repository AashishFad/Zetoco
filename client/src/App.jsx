import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { ProjectProvider } from './context/ProjectContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import PermissionRoute from './components/auth/PermissionRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import KanbanBoardPage from './pages/KanbanBoardPage';
import TeamPage from './pages/TeamPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import FilesPage from './pages/FilesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';

import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <ProjectProvider>
            <NotificationProvider>
              <ToastProvider>
                <ErrorBoundary>
                  <Routes>
                    {/* Public Marketing Layout */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/forbidden" element={<ForbiddenPage />} />
                      <Route path="/invitations/accept/:token" element={<AcceptInvitationPage />} />

                      {/* Public-only auth routes (redirect to /dashboard if already logged in) */}
                      <Route element={<PublicOnlyRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                      </Route>
                    </Route>

                    {/* Protected Application Routes (Protected by Supabase Auth Guard) */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:id" element={<ProjectDetailPage />} />
                        <Route path="/tasks" element={<KanbanBoardPage />} />
                        <Route path="/team" element={<TeamPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/files" element={<FilesPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                      </Route>
                    </Route>

                    {/* Fallback 404 Route */}
                    <Route element={<MainLayout />}>
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </ErrorBoundary>
              </ToastProvider>
            </NotificationProvider>
          </ProjectProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
