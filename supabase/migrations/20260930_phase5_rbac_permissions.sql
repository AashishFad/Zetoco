-- ==============================================================================
-- FlowSync — Phase 5 Migration: Role-Based Access Control (RBAC) & Permissions
-- ==============================================================================

-- 1. Update Role Constraint on organization_members table
-- Drop existing check constraint if it exists
DO $$
BEGIN
  ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
  ALTER TABLE public.organization_members 
    ADD CONSTRAINT organization_members_role_check 
    CHECK (role IN ('admin', 'project_manager', 'member', 'viewer'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update handled: %', SQLERRM;
END $$;


-- 2. Enhanced Security Definer Helper Functions
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


-- 3. Last Admin Protection Trigger
-- Prevents demoting or deleting the final admin of an organization
CREATE OR REPLACE FUNCTION public.prevent_removing_last_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
BEGIN
  -- If updating role from 'admin' to something else
  IF (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') THEN
    SELECT count(*) INTO admin_count
    FROM public.organization_members
    WHERE organization_id = OLD.organization_id AND role = 'admin';
    
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the sole administrator of this organization. Assign another admin first.';
    END IF;
  END IF;

  -- If deleting an admin member
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


-- 4. Re-apply and verify Row Level Security Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS "Allow members and creators to view organization" ON public.organizations;
CREATE POLICY "Allow members and creators to view organization"
  ON public.organizations FOR SELECT
  USING (
    created_by = auth.uid() OR public.is_org_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow organization admins to update organization" ON public.organizations;
CREATE POLICY "Allow organization admins to update organization"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id, auth.uid()));

-- Organization members policies
DROP POLICY IF EXISTS "Allow members to view organization members" ON public.organization_members;
CREATE POLICY "Allow members to view organization members"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_org_member(organization_id, auth.uid())
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
