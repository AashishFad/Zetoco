-- ==============================================================================
-- FlowSync — Phase 7 Migration: Tasks & Kanban Board Schema
-- ==============================================================================

-- 1. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;


-- 2. Indexes for High-Performance Kanban Querying
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status_order ON public.tasks(project_id, status, order_index);


-- 3. Security Definer Helper Functions for Tasks
CREATE OR REPLACE FUNCTION public.get_task_project_id(t_id UUID)
RETURNS UUID AS $$
DECLARE
  p_id UUID;
BEGIN
  SELECT project_id INTO p_id FROM public.tasks WHERE id = t_id;
  RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_task_org_id(t_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT p.organization_id INTO org_id
  FROM public.tasks t
  JOIN public.projects p ON t.project_id = p.id
  WHERE t.id = t_id;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Row Level Security Policies for Tasks
DROP POLICY IF EXISTS "Allow org members to view tasks" ON public.tasks;
CREATE POLICY "Allow org members to view tasks"
  ON public.tasks FOR SELECT
  USING (
    public.is_org_member(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow project and org members to create tasks" ON public.tasks;
CREATE POLICY "Allow project and org members to create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.is_org_admin(public.get_project_org_id(project_id), auth.uid()) OR
    public.is_project_member(project_id, auth.uid()) OR
    public.is_org_pm_or_admin(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow project and org members to update tasks" ON public.tasks;
CREATE POLICY "Allow project and org members to update tasks"
  ON public.tasks FOR UPDATE
  USING (
    public.is_org_admin(public.get_project_org_id(project_id), auth.uid()) OR
    public.is_project_member(project_id, auth.uid()) OR
    public.is_org_pm_or_admin(public.get_project_org_id(project_id), auth.uid()) OR
    assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Allow managers and creators to delete tasks" ON public.tasks;
CREATE POLICY "Allow managers and creators to delete tasks"
  ON public.tasks FOR DELETE
  USING (
    public.is_org_admin(public.get_project_org_id(project_id), auth.uid()) OR
    public.is_project_manager(project_id, auth.uid()) OR
    created_by = auth.uid()
  );
