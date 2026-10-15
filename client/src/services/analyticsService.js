/**
 * Analytics Service
 * Provides client-side methods to fetch live PostgreSQL analytics and KPI aggregates.
 */
import apiClient from './api';

/**
 * Fetch top-level KPI numbers, task status/priority breakdowns, and project health
 */
export async function getAnalyticsOverview({ organizationId, projectId, startDate, endDate } = {}) {
  const params = {};
  if (organizationId) params.organizationId = organizationId;
  if (projectId && projectId !== 'ALL') params.projectId = projectId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get('/analytics/overview', { params });
  return response.data || {};
}

/**
 * Fetch contextual task lists (My Tasks, Upcoming Tasks, Overdue Tasks)
 */
export async function getAnalyticsTasks({ organizationId, projectId, filter = 'my_tasks', limit = 8 } = {}) {
  const params = { filter, limit };
  if (organizationId) params.organizationId = organizationId;
  if (projectId && projectId !== 'ALL') params.projectId = projectId;

  const response = await apiClient.get('/analytics/tasks', { params });
  return response.data || [];
}

/**
 * Fetch project list with task completion percentage and progress stats
 */
export async function getAnalyticsProjects({ organizationId } = {}) {
  const params = {};
  if (organizationId) params.organizationId = organizationId;

  const response = await apiClient.get('/analytics/projects', { params });
  return response.data || [];
}

/**
 * Fetch objective team workload (open vs completed task counts per member)
 */
export async function getAnalyticsTeam({ organizationId, projectId } = {}) {
  const params = {};
  if (organizationId) params.organizationId = organizationId;
  if (projectId && projectId !== 'ALL') params.projectId = projectId;

  const response = await apiClient.get('/analytics/team', { params });
  return response.data || [];
}

/**
 * Fetch recent organization activity
 */
export async function getAnalyticsActivity({ organizationId, projectId, limit = 10 } = {}) {
  const params = { limit };
  if (organizationId) params.organizationId = organizationId;
  if (projectId && projectId !== 'ALL') params.projectId = projectId;

  const response = await apiClient.get('/analytics/activity', { params });
  return response.data || [];
}

export default {
  getAnalyticsOverview,
  getAnalyticsTasks,
  getAnalyticsProjects,
  getAnalyticsTeam,
  getAnalyticsActivity,
};
