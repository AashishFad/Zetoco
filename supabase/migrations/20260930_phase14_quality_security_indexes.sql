-- ==============================================================================
-- FlowSync — Phase 14: Quality, Security & Optimization Indexes Migration
-- ==============================================================================

-- 1. High-Efficiency Composite Indexes for Project & Workspace Queries
CREATE INDEX IF NOT EXISTS idx_projects_org_created ON public.projects(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_members_user_proj ON public.project_members(user_id, project_id);

-- 2. Kanban Board & Task Sprint Ordering Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_proj_status_order ON public.tasks(project_id, status, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_created ON public.tasks(assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_status_filter ON public.tasks(due_date, status) WHERE due_date IS NOT NULL;

-- 3. Comments & Activity Log Lookups
CREATE INDEX IF NOT EXISTS idx_comments_task_created ON public.comments(task_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_task_created ON public.activity_logs(organization_id, task_id, created_at DESC);

-- 4. Channel Messaging & Realtime Synchronization
CREATE INDEX IF NOT EXISTS idx_messages_channel_created_asc ON public.messages(channel_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_channels_org_type ON public.channels(organization_id, type);

-- 5. Notifications & In-App Alerts
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);

-- 6. Task Attachments & File Audit
CREATE INDEX IF NOT EXISTS idx_attachments_task_created ON public.attachments(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_org_created ON public.attachments(organization_id, created_at DESC);
