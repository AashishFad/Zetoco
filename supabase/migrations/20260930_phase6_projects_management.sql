-- ==============================================================================
-- FlowSync — Phase 6 Migration: Projects & Project Management Schema
-- ==============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')) DEFAULT 'planning',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT projects_org_slug_unique UNIQUE (organization_id, slug),
  CONSTRAINT projects_date_check CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;


-- 2. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_role TEXT NOT NULL CHECK (project_role IN ('manager', 'member', 'viewer')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_members_unique UNIQUE (project_id, user_id)
);

-- Enable RLS on project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;


-- 3. Security Definer Helper Functions for Projects
CREATE OR REPLACE FUNCTION public.is_project_member(p_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_project_manager(p_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = uid AND project_role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_project_org_id(p_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.projects
  WHERE id = p_id;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Last Project Manager Protection Trigger
CREATE OR REPLACE FUNCTION public.prevent_removing_last_project_manager()
RETURNS TRIGGER AS $$
DECLARE
  manager_count INT;
BEGIN
  -- If demoting manager
  IF (TG_OP = 'UPDATE' AND OLD.project_role = 'manager' AND NEW.project_role <> 'manager') THEN
    SELECT count(*) INTO manager_count
    FROM public.project_members
    WHERE project_id = OLD.project_id AND project_role = 'manager';

    IF manager_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the sole project manager. Assign another manager first.';
    END IF;
  END IF;

  -- If removing manager
  IF (TG_OP = 'DELETE' AND OLD.project_role = 'manager') THEN
    SELECT count(*) INTO manager_count
    FROM public.project_members
    WHERE project_id = OLD.project_id AND project_role = 'manager';

    IF manager_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last manager of this project. Assign another manager first.';
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_removing_last_project_manager ON public.project_members;
CREATE TRIGGER trg_prevent_removing_last_project_manager
  BEFORE UPDATE OR DELETE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_removing_last_project_manager();


-- 5. Row Level Security Policies for projects
DROP POLICY IF EXISTS "Allow org members to view projects" ON public.projects;
CREATE POLICY "Allow org members to view projects"
  ON public.projects FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow authorized org members to create projects" ON public.projects;
CREATE POLICY "Allow authorized org members to create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id, auth.uid()) AND
    (public.is_org_pm_or_admin(organization_id, auth.uid()) OR auth.uid() = created_by)
  );

DROP POLICY IF EXISTS "Allow admins and project managers to update projects" ON public.projects;
CREATE POLICY "Allow admins and project managers to update projects"
  ON public.projects FOR UPDATE
  USING (
    public.is_org_admin(organization_id, auth.uid()) OR
    public.is_project_manager(id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow admins and project managers to delete projects" ON public.projects;
CREATE POLICY "Allow admins and project managers to delete projects"
  ON public.projects FOR DELETE
  USING (
    public.is_org_admin(organization_id, auth.uid()) OR
    public.is_project_manager(id, auth.uid())
  );


-- 6. Row Level Security Policies for project_members
DROP POLICY IF EXISTS "Allow org members to view project members" ON public.project_members;
CREATE POLICY "Allow org members to view project members"
  ON public.project_members FOR SELECT
  USING (
    public.is_org_member(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow admins and project managers to add project members" ON public.project_members;
CREATE POLICY "Allow admins and project managers to add project members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    -- Adding creator as manager OR admin/manager adding someone who is already in org
    user_id = auth.uid() OR
    (
      (public.is_org_admin(public.get_project_org_id(project_id), auth.uid()) OR
       public.is_project_manager(project_id, auth.uid())) AND
      public.is_org_member(public.get_project_org_id(project_id), user_id)
    )
  );

DROP POLICY IF EXISTS "Allow admins and managers to update project member roles" ON public.project_members;
CREATE POLICY "Allow admins and managers to update project member roles"
  ON public.project_members FOR UPDATE
  USING (
    public.is_org_admin(public.get_project_org_id(project_id), auth.uid()) OR
    public.is_project_manager(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow admins, managers or users to remove project members" ON public.project_members;
CREATE POLICY "Allow admins, managers or users to remove project members"
  ON public.project_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_org_admin(public.get_project_org_id(project_id), auth.uid()) OR
    public.is_project_manager(project_id, auth.uid())
  );
