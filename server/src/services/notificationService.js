/**
 * Server-Side Notification Service
 * Handles server-generated notification creation and dispatch to Supabase PostgreSQL.
 * Supports authenticated client execution, batch creation, and graceful fallback
 * for check constraint compatibility across migration stages.
 */
const { supabase, getUserClient } = require('../config/supabase');

/**
 * Normalizes notification types to an existing allowed DB constraint type
 * when newer event types haven't been migrated into notifications_type_check yet.
 */
function getFallbackType(type, entityType) {
  if (!type) return 'task_assigned';
  if (type.startsWith('task_')) return 'task_assigned';
  if (type === 'comment_added') return 'comment_added';
  if (type.startsWith('project_')) return 'project_role_changed';
  if (type.startsWith('organization_invitation_')) return 'organization_role_changed';
  if (type === 'file_uploaded') return entityType === 'task' ? 'task_assigned' : 'organization_role_changed';
  if (type === 'channel_message') return 'comment_added';
  return 'task_assigned';
}

/**
 * Creates a single in-app notification for a user
 *
 * @param {Object} params
 * @param {Object} [params.dbClient] - Authenticated Supabase client (preferred)
 * @param {string} [params.token] - JWT token to construct authenticated client
 * @param {string} params.userId - Recipient user UUID
 * @param {string} params.organizationId - Workspace organization UUID
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Short notification title
 * @param {string} params.message - Descriptive notification text
 * @param {string} [params.entityType] - Entity category ('task', 'project', 'organization')
 * @param {string} [params.entityId] - UUID of the target entity
 * @param {string} [params.actorId] - UUID of the user triggering the action
 * @param {Object} [params.metadata] - Extra metadata payload
 */
async function createNotification({
  dbClient = null,
  token = null,
  userId,
  organizationId,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  actorId = null,
  metadata = {},
}) {
  // Do not send notifications to the person performing the action
  if (!userId || (actorId && userId === actorId)) {
    return null;
  }

  if (!organizationId || !type || !title || !message) {
    console.warn('[NOTIFICATION_CREATE] Skipped: missing required parameters', {
      hasOrg: Boolean(organizationId),
      hasType: Boolean(type),
      hasTitle: Boolean(title),
      hasMessage: Boolean(message),
      recipientId: userId,
    });
    return null;
  }

  // Choose the best client (authenticated caller client satisfies RLS policy)
  const client = dbClient || (token ? getUserClient(token) : supabase);

  const payload = {
    user_id: userId,
    organization_id: organizationId,
    type,
    title: title.trim(),
    message: message.trim(),
    entity_type: entityType,
    entity_id: entityId,
    actor_id: actorId || null,
    is_read: false,
    metadata: metadata || {},
  };

  console.log(`[NOTIFICATION_CREATE] Event: "${type}" | Recipient: "${userId}" | Actor: "${actorId || 'system'}" | Attempting insertion...`);

  try {
    // IMPORTANT: Do NOT call .select() or .single() here!
    // The notifications table enforces RLS policy: SELECT USING (user_id = auth.uid()).
    // When User A inserts a notification for User B, .select() forces PostgREST to append
    // RETURNING *, which triggers the SELECT RLS policy. Because User A is not permitted to
    // select User B's rows, PostgreSQL returns 0 rows, and PostgREST aborts the transaction
    // with error 42501 (new row violates row-level security policy) or PGRST116.
    // Calling .insert() with return=minimal (the default) commits cleanly and satisfies RLS.
    const { error, status } = await client
      .from('notifications')
      .insert(payload);

    if (error) {
      console.warn(`[NOTIFICATION_CREATE] Event: "${type}" | Recipient: "${userId}" | Failed with code: ${error.code} | Message: ${error.message}`);

      // Check if failure is due to database check constraint (e.g. unmigrated notification type)
      const isCheckConstraintError =
        error.message?.includes('check constraint') ||
        error.code === '23514';

      if (isCheckConstraintError) {
        const fallbackType = getFallbackType(type, entityType);
        const fallbackPayload = {
          ...payload,
          type: fallbackType,
          metadata: {
            ...(metadata || {}),
            realType: type,
            action: type,
          },
        };

        console.log(`[NOTIFICATION_CREATE_FALLBACK] Event: "${type}" -> fallback "${fallbackType}" | Recipient: "${userId}" | Retrying...`);

        const { error: fbErr, status: fbStatus } = await client
          .from('notifications')
          .insert(fallbackPayload);

        if (fbErr) {
          console.error(`[NOTIFICATION_CREATE_FALLBACK] Fallback failed: code=${fbErr.code} message=${fbErr.message}`);
          return null;
        }

        console.log(`[NOTIFICATION_CREATE] Fallback insert SUCCESS (HTTP ${fbStatus || 201}) | Type: "${fallbackType}" (real: "${type}") | Recipient: "${userId}"`);
        return { success: true, type: fallbackType, fallback: true };
      }

      return null;
    }

    console.log(`[NOTIFICATION_CREATE] Insert SUCCESS (HTTP ${status || 201}) | Event: "${type}" | Recipient: "${userId}"`);
    return { success: true, type };
  } catch (err) {
    console.error(`[NOTIFICATION_CREATE] Exception:`, err.message);
    return null;
  }
}

/**
 * Creates multiple notifications in a batch
 *
 * @param {Array<Object>} notificationList - List of notification parameter objects
 * @param {Object} [options]
 * @param {Object} [options.dbClient] - Authenticated Supabase client
 * @param {string} [options.token] - JWT token
 */
async function createNotifications(notificationList = [], options = {}) {
  if (!Array.isArray(notificationList) || notificationList.length === 0) {
    return [];
  }

  const client = options.dbClient || (options.token ? getUserClient(options.token) : supabase);

  // Filter out invalid or self-notifications
  const validPayloads = notificationList
    .filter((n) => n.userId && (!n.actorId || n.userId !== n.actorId) && n.organizationId && n.type)
    .map((n) => ({
      user_id: n.userId,
      organization_id: n.organizationId,
      type: n.type,
      title: n.title.trim(),
      message: n.message.trim(),
      entity_type: n.entityType || null,
      entity_id: n.entityId || null,
      actor_id: n.actorId || null,
      is_read: false,
      metadata: n.metadata || {},
    }));

  if (validPayloads.length === 0) return [];

  console.log(`[NOTIFICATION_BATCH] Attempting batch insertion of ${validPayloads.length} notifications...`);

  try {
    // IMPORTANT: Do NOT use .select()! See createNotification note above.
    const { error, status } = await client
      .from('notifications')
      .insert(validPayloads);

    if (error) {
      console.warn(`[NOTIFICATION_BATCH] Batch insertion failed: code=${error.code} message=${error.message}`);
      if (error.message?.includes('check constraint') || error.code === '23514') {
        // Fall back to individually inserting with safe fallback types
        const results = [];
        for (const item of notificationList) {
          const res = await createNotification({
            dbClient: client,
            ...item,
          });
          if (res) results.push(res);
        }
        return results;
      }
      return [];
    }

    console.log(`[NOTIFICATION_BATCH] Batch insert SUCCESS (HTTP ${status || 201}) | Count: ${validPayloads.length}`);
    return validPayloads;
  } catch (err) {
    console.error(`[NOTIFICATION_BATCH] Exception:`, err.message);
    return [];
  }
}

module.exports = {
  createNotification,
  createNotifications,
  getFallbackType,
};
