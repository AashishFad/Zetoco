-- ==============================================================================
-- FlowSync — Phase 17 Migration: Direct In-App Invitations & Declining Workflow
-- ==============================================================================

-- 1. Ensure email column on public.profiles and sync from auth.users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill profile emails from auth.users
DO $$
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Profiles email backfill skipped or partial: %', SQLERRM;
END $$;

-- Index for case-insensitive email lookup on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower 
  ON public.profiles (LOWER(email));

-- Update handle_new_user trigger to save email on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTRING(NEW.id::text, 1, 4),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update organization_invitations Table for In-App Invitations
-- Add invited_user_id reference to auth.users
ALTER TABLE public.organization_invitations 
  ADD COLUMN IF NOT EXISTS invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update status check constraint to support 'declined'
ALTER TABLE public.organization_invitations 
  DROP CONSTRAINT IF EXISTS organization_invitations_status_check;

ALTER TABLE public.organization_invitations 
  ADD CONSTRAINT organization_invitations_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked'));

-- Index on invited_user_id and status for user dashboard lookups
CREATE INDEX IF NOT EXISTS idx_org_invitations_invited_user 
  ON public.organization_invitations (invited_user_id, status);

CREATE INDEX IF NOT EXISTS idx_org_invitations_email_lower 
  ON public.organization_invitations (LOWER(email), status);


-- 3. Update notifications Table to support organization invitation types
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'task_assigned',
    'task_unassigned',
    'comment_added',
    'project_member_added',
    'project_role_changed',
    'organization_role_changed',
    'organization_invitation_received',
    'organization_invitation_accepted',
    'organization_invitation_declined'
  ));


-- 4. Row Level Security Policies for In-App Invitations
-- Organization members can view invitations for their organization,
-- and invited users can view pending invitations sent to them.
DROP POLICY IF EXISTS "Allow members to view organization invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Allow members and invited users to view invitations" ON public.organization_invitations;

CREATE POLICY "Allow members and invited users to view invitations"
  ON public.organization_invitations FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid()) 
    OR public.is_org_admin(organization_id, auth.uid())
    OR (invited_user_id = auth.uid())
    OR (LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', '')))
    OR (token_hash IS NOT NULL)
  );

-- Allow invited user to update invitation (for accept/decline)
DROP POLICY IF EXISTS "Allow invited users to accept or decline invitation" ON public.organization_invitations;
CREATE POLICY "Allow invited users to accept or decline invitation"
  ON public.organization_invitations FOR UPDATE
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR (invited_user_id = auth.uid())
    OR (LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', '')))
  );


-- 5. Safe Server-Side Registered User Lookup Helper
-- Queries auth.users directly via SECURITY DEFINER without exposing entire directory
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(p.full_name, split_part(u.email::text, '@', 1)),
    p.avatar_url
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE LOWER(u.email::text) = LOWER(TRIM(p_email))
  LIMIT 1;
END;
$$;


-- 6. Atomic Acceptance by Invitation ID Function
CREATE OR REPLACE FUNCTION public.accept_invitation_by_id_atomic(
  p_invitation_id UUID,
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
  v_norm_email := LOWER(TRIM(p_user_email));

  -- Lock invitation row
  SELECT * INTO v_invite
  FROM public.organization_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  -- Verify user identity matches invitation
  IF v_invite.invited_user_id IS NOT NULL AND v_invite.invited_user_id <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was issued to a different user account');
  END IF;

  IF LOWER(TRIM(v_invite.email)) <> v_norm_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was issued to ' || v_invite.email || '. Please sign in with the invited email.');
  END IF;

  -- Check status
  IF v_invite.status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been accepted');
  END IF;

  IF v_invite.status = 'declined' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was previously declined');
  END IF;

  IF v_invite.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has been revoked by an administrator');
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation is no longer valid');
  END IF;

  -- Check expiration
  IF v_invite.expires_at < now() THEN
    UPDATE public.organization_invitations SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired');
  END IF;

  -- Fetch org name
  SELECT name INTO v_org_name FROM public.organizations WHERE id = v_invite.organization_id;

  -- Check if already member
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_invite.organization_id AND user_id = p_user_id
  ) THEN
    UPDATE public.organization_invitations
    SET status = 'accepted', accepted_by = p_user_id, accepted_at = now()
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

  -- Insert membership
  INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
  VALUES (v_invite.organization_id, p_user_id, v_invite.role, now())
  RETURNING id INTO v_new_member_id;

  -- Mark invitation accepted
  UPDATE public.organization_invitations
  SET status = 'accepted', accepted_by = p_user_id, accepted_at = now()
  WHERE id = v_invite.id;

  -- Mark related notification read
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = p_user_id AND entity_id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_member', false,
    'membership_id', v_new_member_id,
    'organization_id', v_invite.organization_id,
    'organization_name', v_org_name,
    'role', v_invite.role,
    'message', 'Joined ' || COALESCE(v_org_name, 'workspace') || ' successfully'
  );
END;
$$;


-- 7. Atomic Decline Function
CREATE OR REPLACE FUNCTION public.decline_invitation_by_id_atomic(
  p_invitation_id UUID,
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
BEGIN
  v_norm_email := LOWER(TRIM(p_user_email));

  SELECT * INTO v_invite
  FROM public.organization_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  -- Verify user identity
  IF v_invite.invited_user_id IS NOT NULL AND v_invite.invited_user_id <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was issued to a different user account');
  END IF;

  IF LOWER(TRIM(v_invite.email)) <> v_norm_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was issued to a different email address');
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot decline invitation with status ' || v_invite.status);
  END IF;

  -- Mark declined
  UPDATE public.organization_invitations
  SET status = 'declined'
  WHERE id = v_invite.id;

  -- Mark related notification read
  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = p_user_id AND entity_id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invitation declined successfully'
  );
END;
$$;
