-- ==============================================================================
-- FlowSync — Phase 9 Migration: Team Collaboration, Channels & Messages Schema
-- ==============================================================================

-- 1. Channels Table
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

-- Enable RLS on channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;


-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- 3. Indexes for Channel and Message Performance
CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_channels_project_id ON public.channels(project_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id_created ON public.messages(channel_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);


-- 4. Helper Security Definer Functions
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


-- 5. Row Level Security Policies for Channels
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


-- 6. Row Level Security Policies for Messages
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
