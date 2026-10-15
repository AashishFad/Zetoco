-- ==============================================================================
-- FlowSync — Phase 8 Migration: Comments & Task Activity History Schema
-- ==============================================================================

-- 1. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;


-- 2. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;


-- 3. Indexes for High-Performance Comment and Activity Queries
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON public.activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);


-- 4. Helper Security Definer Functions
CREATE OR REPLACE FUNCTION public.get_comment_org_id(c_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT p.organization_id INTO org_id
  FROM public.comments c
  JOIN public.tasks t ON c.task_id = t.id
  JOIN public.projects p ON t.project_id = p.id
  WHERE c.id = c_id;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Row Level Security Policies for Comments
DROP POLICY IF EXISTS "Allow org members to view comments" ON public.comments;
CREATE POLICY "Allow org members to view comments"
  ON public.comments FOR SELECT
  USING (
    public.is_org_member(public.get_task_org_id(task_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to create comments" ON public.comments;
CREATE POLICY "Allow org members to create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_org_member(public.get_task_org_id(task_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow authors to update their comments" ON public.comments;
CREATE POLICY "Allow authors to update their comments"
  ON public.comments FOR UPDATE
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authors and admins to delete comments" ON public.comments;
CREATE POLICY "Allow authors and admins to delete comments"
  ON public.comments FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_org_admin(public.get_comment_org_id(id), auth.uid())
  );


-- 6. Row Level Security Policies for Activity Logs
DROP POLICY IF EXISTS "Allow org members to view activity logs" ON public.activity_logs;
CREATE POLICY "Allow org members to view activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow authenticated server backend to insert activity logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated server backend to insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id, auth.uid())
  );
