-- ==============================================================================
-- FlowSync — Phase 19 Migration: Expand Notification Types Check Constraint
-- Expands the allowed notification types in public.notifications to support:
-- - task_status_changed
-- - task_priority_changed
-- - task_updated
-- - file_uploaded
-- - channel_message
-- ==============================================================================

ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'task_assigned',
    'task_unassigned',
    'task_status_changed',
    'task_priority_changed',
    'task_updated',
    'comment_added',
    'file_uploaded',
    'channel_message',
    'project_member_added',
    'project_role_changed',
    'organization_role_changed',
    'organization_invitation_received',
    'organization_invitation_accepted',
    'organization_invitation_declined'
  ));
