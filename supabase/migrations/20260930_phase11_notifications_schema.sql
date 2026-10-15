-- ==============================================================================
-- FlowSync — Phase 11 Migration: In-App Notifications Schema & Realtime Setup
-- ==============================================================================

-- 1. Notifications Table
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
  entity_type TEXT, -- 'task', 'project', 'organization'
  entity_id UUID,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Indexes for Fast Notification Queries & Unread Counting
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id 
  ON public.notifications(organization_id);

-- 3. Row Level Security Policies for Notifications
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

-- 4. Enable Supabase Realtime for Notifications Table
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
