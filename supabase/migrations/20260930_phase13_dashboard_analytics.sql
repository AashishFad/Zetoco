-- ==============================================================================
-- FlowSync — Phase 13 Migration: Dashboard & Analytics Indexes
-- ==============================================================================

-- 1. Performance Indexes for Task Status, Priority & Due Date Analytics
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON public.tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON public.tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- 2. Performance Indexes for Project Status & Organization Lookups
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON public.projects(organization_id, status);

-- 3. Performance Indexes for Organization Activity Aggregations
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_created ON public.activity_logs(project_id, created_at DESC);
