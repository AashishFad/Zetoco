/**
 * Activity Service
 * Server-side audit logging for task lifecycle events and workflow changes.
 */
const { supabase } = require('../config/supabase');

/**
 * Record an activity log entry
 */
const logActivity = async ({
  organizationId,
  projectId,
  taskId = null,
  userId = null,
  action,
  metadata = {},
}) => {
  try {
    let targetOrgId = organizationId;
    let targetProjectId = projectId;

    // If orgId is not provided, look it up from project
    if (!targetOrgId && targetProjectId) {
      const { data: proj } = await supabase
        .from('projects')
        .select('organization_id')
        .eq('id', targetProjectId)
        .maybeSingle();

      if (proj) {
        targetOrgId = proj.organization_id;
      }
    }

    if (!targetOrgId || !targetProjectId) {
      console.warn('Skipping activity log: missing organization or project ID');
      return null;
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        organization_id: targetOrgId,
        project_id: targetProjectId,
        task_id: taskId,
        user_id: userId,
        action,
        metadata,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Failed to insert activity log:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Exception during activity logging:', err.message);
    return null;
  }
};

module.exports = {
  logActivity,
};
