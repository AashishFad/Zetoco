-- ==============================================================================
-- FlowSync — Complete Master Schema Migration (Phases 4 through 9)
-- Run this script in the Supabase SQL Editor to initialize all tables,
-- functions, triggers, indexes, and Row-Level Security policies.
-- ==============================================================================

-- ==============================================================================
-- PHASE 4 & 5: PROFILES, ORGANIZATIONS, MEMBERS & RBAC
-- ==============================================================================

-- 1. Profiles Table (Linked 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTRING(NEW.id::text, 1, 4),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;


-- 3. Organization Members Table with RBAC Roles
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'member', 'viewer')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;


-- 4. Organization Security Definer Helper Functions
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = uid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_pm_or_admin(org_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = uid AND role IN ('admin', 'project_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_org_role(org_id UUID, uid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.organization_members
  WHERE organization_id = org_id AND user_id = uid;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Last Admin Protection Trigger
CREATE OR REPLACE FUNCTION public.prevent_removing_last_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') THEN
    SELECT count(*) INTO admin_count
    FROM public.organization_members
    WHERE organization_id = OLD.organization_id AND role = 'admin';
    
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the sole administrator of this organization. Assign another admin first.';
    END IF;
  END IF;

  IF (TG_OP = 'DELETE' AND OLD.role = 'admin') THEN
    SELECT count(*) INTO admin_count
    FROM public.organization_members
    WHERE organization_id = OLD.organization_id AND role = 'admin';
    
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last administrator of this organization. Assign another admin first.';
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_removing_last_admin ON public.organization_members;
CREATE TRIGGER trg_prevent_removing_last_admin
  BEFORE UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_removing_last_admin();


-- 6. Organizations & Members RLS Policies
DROP POLICY IF EXISTS "Allow members and creators to view organization" ON public.organizations;
CREATE POLICY "Allow members and creators to view organization"
  ON public.organizations FOR SELECT
  USING (
    created_by = auth.uid() OR public.is_org_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow authenticated users to create organizations" ON public.organizations;
CREATE POLICY "Allow authenticated users to create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Allow organization admins to update organization" ON public.organizations;
CREATE POLICY "Allow organization admins to update organization"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Allow organization admins to delete organization" ON public.organizations;
CREATE POLICY "Allow organization admins to delete organization"
  ON public.organizations FOR DELETE
  USING (public.is_org_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Allow members to view organization members" ON public.organization_members;
CREATE POLICY "Allow members to view organization members"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow user to add themselves or admins to add members" ON public.organization_members;
CREATE POLICY "Allow user to add themselves or admins to add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR public.is_org_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow admins to update member roles" ON public.organization_members;
CREATE POLICY "Allow admins to update member roles"
  ON public.organization_members FOR UPDATE
  USING (public.is_org_admin(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Allow admins to remove members or users to leave" ON public.organization_members;
CREATE POLICY "Allow admins to remove members or users to leave"
  ON public.organization_members FOR DELETE
  USING (
    user_id = auth.uid() OR public.is_org_admin(organization_id, auth.uid())
  );


-- ==============================================================================
-- PHASE 6: PROJECTS & PROJECT MEMBERSHIP
-- ==============================================================================

-- 7. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')) DEFAULT 'planning',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  color TEXT DEFAULT '#6366f1',
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_slug_per_org UNIQUE (organization_id, slug)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;


-- 8. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_role TEXT NOT NULL CHECK (project_role IN ('lead', 'member', 'viewer')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE OR REPLACE FUNCTION public.is_project_member(proj_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = proj_id AND user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_project_org_id(proj_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.projects
  WHERE id = proj_id;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Projects RLS Policies
DROP POLICY IF EXISTS "Allow org members to view projects" ON public.projects;
CREATE POLICY "Allow org members to view projects"
  ON public.projects FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow PMs and Admins to create projects" ON public.projects;
CREATE POLICY "Allow PMs and Admins to create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.is_org_pm_or_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow PMs and Admins to update projects" ON public.projects;
CREATE POLICY "Allow PMs and Admins to update projects"
  ON public.projects FOR UPDATE
  USING (
    public.is_org_pm_or_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow PMs and Admins to delete projects" ON public.projects;
CREATE POLICY "Allow PMs and Admins to delete projects"
  ON public.projects FOR DELETE
  USING (
    public.is_org_pm_or_admin(organization_id, auth.uid())
  );

-- Project Members RLS Policies
DROP POLICY IF EXISTS "Allow org members to view project members" ON public.project_members;
CREATE POLICY "Allow org members to view project members"
  ON public.project_members FOR SELECT
  USING (
    public.is_org_member(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow PMs and Admins to manage project members" ON public.project_members;
CREATE POLICY "Allow PMs and Admins to manage project members"
  ON public.project_members FOR ALL
  USING (
    public.is_org_pm_or_admin(public.get_project_org_id(project_id), auth.uid())
  );


-- ==============================================================================
-- PHASE 7: TASKS & KANBAN BOARD
-- ==============================================================================

-- 9. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  order_index INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON public.tasks(project_id, status, order_index ASC);

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

-- Tasks RLS Policies
DROP POLICY IF EXISTS "Allow org members to view tasks" ON public.tasks;
CREATE POLICY "Allow org members to view tasks"
  ON public.tasks FOR SELECT
  USING (
    public.is_org_member(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members with edit permission to create tasks" ON public.tasks;
CREATE POLICY "Allow org members with edit permission to create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.is_org_member(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to update tasks" ON public.tasks;
CREATE POLICY "Allow org members to update tasks"
  ON public.tasks FOR UPDATE
  USING (
    public.is_org_member(public.get_project_org_id(project_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to delete tasks" ON public.tasks;
CREATE POLICY "Allow org members to delete tasks"
  ON public.tasks FOR DELETE
  USING (
    public.is_org_pm_or_admin(public.get_project_org_id(project_id), auth.uid()) OR
    created_by = auth.uid()
  );


-- ==============================================================================
-- PHASE 8: COMMENTS & TASK ACTIVITY AUDIT LOGS
-- ==============================================================================

-- 10. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 11. Activity Logs Table
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

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON public.activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

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

-- Comments RLS Policies
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

-- Activity Logs RLS Policies
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


-- ==============================================================================
-- PHASE 9: CHANNELS & MESSAGES
-- ==============================================================================

-- 12. Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('general', 'project', 'custom')) DEFAULT 'custom',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_channel_name_per_org UNIQUE (organization_id, name)
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- 13. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_channels_project_id ON public.channels(project_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id_created ON public.messages(channel_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

CREATE OR REPLACE FUNCTION public.get_channel_org_id(c_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.channels
  WHERE id = c_id;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Channels RLS Policies
DROP POLICY IF EXISTS "Allow org members to view channels" ON public.channels;
CREATE POLICY "Allow org members to view channels"
  ON public.channels FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to create channels" ON public.channels;
CREATE POLICY "Allow org members to create channels"
  ON public.channels FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow channel creator or admins to update channel" ON public.channels;
CREATE POLICY "Allow channel creator or admins to update channel"
  ON public.channels FOR UPDATE
  USING (
    created_by = auth.uid() OR
    public.is_org_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow admins or creator to delete non-general channels" ON public.channels;
CREATE POLICY "Allow admins or creator to delete non-general channels"
  ON public.channels FOR DELETE
  USING (
    type != 'general' AND (
      created_by = auth.uid() OR
      public.is_org_admin(organization_id, auth.uid())
    )
  );

-- Messages RLS Policies
DROP POLICY IF EXISTS "Allow org members to view channel messages" ON public.messages;
CREATE POLICY "Allow org members to view channel messages"
  ON public.messages FOR SELECT
  USING (
    public.is_org_member(public.get_channel_org_id(channel_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to post messages" ON public.messages;
CREATE POLICY "Allow org members to post messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_org_member(public.get_channel_org_id(channel_id), auth.uid())
  );

DROP POLICY IF EXISTS "Allow authors to update their messages" ON public.messages;
CREATE POLICY "Allow authors to update their messages"
  ON public.messages FOR UPDATE
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authors and admins to delete messages" ON public.messages;
CREATE POLICY "Allow authors and admins to delete messages"
  ON public.messages FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_org_admin(public.get_channel_org_id(channel_id), auth.uid())
  );


-- ==============================================================================
-- PHASE 10: SUPABASE REALTIME SETUP
-- ==============================================================================

-- Set Replica Identity to FULL for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Publication notice: %', SQLERRM;
END $$;


-- ==============================================================================
-- PHASE 11: IN-APP NOTIFICATIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'task_assigned',
    'task_unassigned',
    'comment_added',
    'project_member_added',
    'project_role_changed',
    'organization_role_changed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id 
  ON public.notifications(organization_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Allow authenticated server to insert notifications" ON public.notifications;
CREATE POLICY "Allow authenticated server to insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
  );

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Publication notice for notifications: %', SQLERRM;
END $$;


-- ==============================================================================
-- PHASE 12: ATTACHMENTS & SUPABASE STORAGE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON public.attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_attachments_organization_id ON public.attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON public.attachments(created_at DESC);

DROP POLICY IF EXISTS "Allow org members to view task attachments" ON public.attachments;
CREATE POLICY "Allow org members to view task attachments"
  ON public.attachments FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to upload task attachments" ON public.attachments;
CREATE POLICY "Allow org members to upload task attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow uploader and admins to delete attachments" ON public.attachments;
CREATE POLICY "Allow uploader and admins to delete attachments"
  ON public.attachments FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    public.is_org_admin(organization_id, auth.uid())
  );


-- ==============================================================================
-- PHASE 13: DASHBOARD & ANALYTICS INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON public.tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON public.tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON public.projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_created ON public.activity_logs(project_id, created_at DESC);
