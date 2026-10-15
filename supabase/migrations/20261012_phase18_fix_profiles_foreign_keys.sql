-- ==============================================================================
-- FlowSync — Phase 18 Migration: Explicit Foreign Keys to Public Profiles
-- ==============================================================================
-- This migration adds explicit foreign key constraints from organization_members
-- and tasks to public.profiles.
-- In Supabase, foreign keys referencing auth.users across schemas prevent PostgREST
-- from auto-discovering embedded relationships in public schema queries.
-- Pointing to public.profiles(id) allows PostgREST schema cache to join profiles natively.

DO $$
BEGIN
  -- 1. organization_members.user_id -> public.profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.organization_members
      ADD CONSTRAINT organization_members_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- 2. tasks.assigned_to -> public.profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_assigned_to_profiles_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_assigned_to_profiles_fkey
      FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- 3. tasks.created_by -> public.profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_created_by_profiles_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_created_by_profiles_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
