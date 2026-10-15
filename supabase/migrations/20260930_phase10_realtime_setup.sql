-- ==============================================================================
-- FlowSync — Phase 10 Migration: Supabase Realtime Setup for Messages
-- ==============================================================================

-- 1. Set Replica Identity to FULL for messages table
-- This ensures that UPDATE and DELETE events sent via Realtime contain full row information
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Add messages table to supabase_realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Publication notice: %', SQLERRM;
END $$;
