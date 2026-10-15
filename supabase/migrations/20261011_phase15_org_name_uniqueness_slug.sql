-- ==============================================================================
-- FlowSync — Phase 15 Migration: Organization Name Uniqueness & Automatic Slug Enforcements
-- ==============================================================================
--
-- Objective:
-- 1. Ensure organization names are globally unique (case-insensitively and whitespace-normalized).
-- 2. Enforce unique slugs for all organizations.
-- 3. Automatic normalization of organization names on INSERT and UPDATE.
-- 4. Preserve existing organization and membership records without destructive modifications.
--
-- Instructions:
-- Execute this migration script in your Supabase Dashboard SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Step 1: Diagnostic Check — Identify Any Existing Duplicate Organizations
-- ------------------------------------------------------------------------------
-- Run this check before applying the unique index. If any duplicate rows exist,
-- review them and resolve manually before creating the unique index.
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g'))
    FROM public.organizations
    GROUP BY LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g'))
    HAVING COUNT(*) > 1
  ) dups;

  IF dup_count > 0 THEN
    RAISE NOTICE 'Warning: Found % normalized organization name duplicate group(s). Please review and resolve duplicates before unique index creation.', dup_count;
  ELSE
    RAISE NOTICE 'Success: Zero duplicate organization names found. Safe to apply unique index.';
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- Step 2: Trigger Function to Normalize Organization Name on Insert / Update
-- ------------------------------------------------------------------------------
-- Automatically trims leading/trailing whitespace and collapses multiple internal
-- whitespace characters into a single space while preserving display casing.
CREATE OR REPLACE FUNCTION public.normalize_organization_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := TRIM(REGEXP_REPLACE(NEW.name, '\s+', ' ', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_org_name ON public.organizations;
CREATE TRIGGER trg_normalize_org_name
  BEFORE INSERT OR UPDATE OF name ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_organization_name();


-- ------------------------------------------------------------------------------
-- Step 3: Global Unique Index for Normalized Organization Names
-- ------------------------------------------------------------------------------
-- Enforces that no two organizations can have the same name (case-insensitive,
-- with collapsed whitespace). Prevents concurrent insert race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_unique_normalized_name
  ON public.organizations (LOWER(REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')));


-- ------------------------------------------------------------------------------
-- Step 4: Ensure Global Unique Index for Organization Slugs
-- ------------------------------------------------------------------------------
-- Enforces URL slug uniqueness across all organizations.
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_unique_slug
  ON public.organizations (slug);

COMMENT ON INDEX public.idx_organizations_unique_normalized_name IS 
  'Enforces global case-insensitive and whitespace-collapsed uniqueness for organization names in FlowSync.';

COMMENT ON INDEX public.idx_organizations_unique_slug IS 
  'Enforces global uniqueness for organization URL slugs in FlowSync.';
