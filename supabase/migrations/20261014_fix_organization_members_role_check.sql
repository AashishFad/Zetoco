-- ==============================================================================
-- Zetoco / FlowSync — Fix Organization Members Role Check Constraint
-- Allows RBAC roles ('admin', 'project_manager', 'member', 'viewer') in
-- public.organization_members so that invitations for Project Managers and Viewers
-- can be accepted without check constraint violations.
-- ==============================================================================

-- 1. Drop existing restrictive constraint if present
ALTER TABLE public.organization_members 
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

-- 2. Add updated constraint supporting all four organization roles
ALTER TABLE public.organization_members 
  ADD CONSTRAINT organization_members_role_check 
  CHECK (role IN ('admin', 'project_manager', 'member', 'viewer'));
