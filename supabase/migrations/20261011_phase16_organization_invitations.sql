-- ==============================================================================
-- FlowSync — Phase 16 Migration: Organization Invitations & Acceptance System
-- ==============================================================================

-- 1. Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'project_manager', 'member', 'viewer')) DEFAULT 'member',
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookups and constraint enforcement
-- Prevent duplicate pending invitations for the same email in the same organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invitations_unique_pending 
  ON public.organization_invitations (organization_id, LOWER(email)) 
  WHERE status = 'pending';

-- Fast lookup by token hash
CREATE INDEX IF NOT EXISTS idx_org_invitations_token_hash 
  ON public.organization_invitations (token_hash);

-- Fast lookup by organization and status
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_status 
  ON public.organization_invitations (organization_id, status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Organization members can view invitations for their organization, or lookup via token hash
DROP POLICY IF EXISTS "Allow members to view organization invitations" ON public.organization_invitations;
CREATE POLICY "Allow members to view organization invitations"
  ON public.organization_invitations FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid()) 
    OR public.is_org_admin(organization_id, auth.uid())
    OR (token_hash IS NOT NULL)
  );

-- Only admins/authorized backend can manage invitations
DROP POLICY IF EXISTS "Allow org admins to insert invitations" ON public.organization_invitations;
CREATE POLICY "Allow org admins to insert invitations"
  ON public.organization_invitations FOR INSERT
  WITH CHECK (
    public.is_org_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow org admins to update invitations" ON public.organization_invitations;
CREATE POLICY "Allow org admins to update invitations"
  ON public.organization_invitations FOR UPDATE
  USING (
    public.is_org_admin(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow org admins to delete invitations" ON public.organization_invitations;
CREATE POLICY "Allow org admins to delete invitations"
  ON public.organization_invitations FOR DELETE
  USING (
    public.is_org_admin(organization_id, auth.uid())
  );

-- 5. Atomic Acceptance Function (Security Definer)
-- Handles concurrency, validation, membership creation, and status transition in one atomic transaction.
CREATE OR REPLACE FUNCTION public.accept_invitation_atomic(
  p_token_hash TEXT,
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_invite RECORD;
  v_norm_email TEXT;
  v_org_name TEXT;
  v_new_member_id UUID;
BEGIN
  -- Normalize email
  v_norm_email := LOWER(TRIM(p_user_email));

  -- 1. Locate invitation by token_hash with row lock
  SELECT * INTO v_invite
  FROM public.organization_invitations
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation link');
  END IF;

  -- 2. Verify status
  IF v_invite.status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been accepted');
  END IF;

  IF v_invite.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has been revoked by an administrator');
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation is no longer valid');
  END IF;

  -- 3. Verify expiration
  IF v_invite.expires_at < now() THEN
    UPDATE public.organization_invitations
    SET status = 'expired'
    WHERE id = v_invite.id;

    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired. Please request a new invitation.');
  END IF;

  -- 4. Verify email match (case-insensitive)
  IF LOWER(TRIM(v_invite.email)) <> v_norm_email THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invitation was issued to a different email address (' || v_invite.email || '). Please log in with the invited email.'
    );
  END IF;

  -- 5. Fetch organization name for confirmation
  SELECT name INTO v_org_name
  FROM public.organizations
  WHERE id = v_invite.organization_id;

  -- 6. Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_invite.organization_id AND user_id = p_user_id
  ) THEN
    -- Update invite status to accepted to prevent dangling record
    UPDATE public.organization_invitations
    SET status = 'accepted',
        accepted_by = p_user_id,
        accepted_at = now()
    WHERE id = v_invite.id;

    RETURN jsonb_build_object(
      'success', true,
      'already_member', true,
      'organization_id', v_invite.organization_id,
      'organization_name', v_org_name,
      'role', v_invite.role,
      'message', 'You are already a member of this workspace'
    );
  END IF;

  -- 7. Insert into organization_members
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    joined_at
  )
  VALUES (
    v_invite.organization_id,
    p_user_id,
    v_invite.role,
    now()
  )
  RETURNING id INTO v_new_member_id;

  -- 8. Mark invitation as accepted
  UPDATE public.organization_invitations
  SET status = 'accepted',
      accepted_by = p_user_id,
      accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_member', false,
    'membership_id', v_new_member_id,
    'organization_id', v_invite.organization_id,
    'organization_name', v_org_name,
    'role', v_invite.role,
    'message', 'Invitation accepted successfully'
  );
END;
$$;
