-- ==============================================================================
-- FlowSync / Zetoco — Phase 20 Migration: Complete & Safe Organization Deletion
-- Ensures RLS deletion policy and last-admin triggers allow complete organization
-- deletion while preserving last-admin safeguards during normal team operations.
-- ==============================================================================

-- 1. Update RLS policy for organization deletion
DROP POLICY IF EXISTS "Allow organization admins to delete organization" ON public.organizations;
DROP POLICY IF EXISTS "Allow organization admins and owners to delete organization" ON public.organizations;

CREATE POLICY "Allow organization admins and owners to delete organization"
  ON public.organizations FOR DELETE
  USING (
    created_by = auth.uid() OR public.is_org_admin(id, auth.uid())
  );

-- 2. Trigger on organizations to signal that an organization is being deleted
CREATE OR REPLACE FUNCTION public.before_org_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.deleting_organization_id', OLD.id::text, true);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_before_org_delete ON public.organizations;
CREATE TRIGGER trg_before_org_delete
  BEFORE DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.before_org_delete();

-- 3. Update Last-Admin Protection Trigger Function on organization_members
-- Allows deletion when the parent organization itself is being deleted
CREATE OR REPLACE FUNCTION public.prevent_removing_last_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
BEGIN
  -- If the parent organization is currently being deleted, allow the cascade
  IF current_setting('app.deleting_organization_id', true) = OLD.organization_id::text THEN
    RETURN OLD;
  END IF;

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
