-- ==============================================================================
-- FlowSync — Phase 12 Migration: Attachments Schema & Supabase Storage Setup
-- ==============================================================================

-- 1. Attachments Metadata Table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 2. Performance Indexes for Attachments
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON public.attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_attachments_organization_id ON public.attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON public.attachments(created_at DESC);

-- 3. Row Level Security Policies for Attachments Table
DROP POLICY IF EXISTS "Allow org members to view task attachments" ON public.attachments;
CREATE POLICY "Allow org members to view task attachments"
  ON public.attachments FOR SELECT
  USING (
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow org members to upload task attachments" ON public.attachments;
CREATE POLICY "Allow org members to upload task attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    public.is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Allow uploader and admins to delete attachments" ON public.attachments;
CREATE POLICY "Allow uploader and admins to delete attachments"
  ON public.attachments FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    public.is_org_admin(organization_id, auth.uid())
  );

-- 4. Create Private Storage Bucket for Attachments (if storage schema exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flow-sync-attachments',
  'flow-sync-attachments',
  false,
  10485760, -- 10 MB per file limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- 5. Storage Policies for 'flow-sync-attachments' Bucket
DROP POLICY IF EXISTS "Allow authenticated users to download task files" ON storage.objects;
CREATE POLICY "Allow authenticated users to download task files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'flow-sync-attachments' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Allow authenticated users to upload task files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload task files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'flow-sync-attachments' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Allow authenticated users to delete their task files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their task files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'flow-sync-attachments' AND
    auth.role() = 'authenticated'
  );
