-- ==============================================================================
-- FlowSync — Phase 4 Migration: Organizations, Profiles & Membership Schema
-- ==============================================================================

-- 1. Profiles Table (Linked 1:1 to Supabase Auth auth.users)
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

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
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

-- Trigger to auto-create profile on Supabase auth.users signup
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

-- Enable Row Level Security on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;


-- 3. Organization Members Table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- Enable Row Level Security on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;


-- 4. Security Definer Helper Functions (To avoid recursive policy loops)
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


-- 5. Organizations RLS Policies
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


-- 6. Organization Members RLS Policies
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
