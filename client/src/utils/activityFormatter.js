/**
 * Activity Formatter Helper
 * Converts raw audit activity records into human-readable sentences and relative timestamps.
 */

/**
 * Format relative time (e.g. "just now", "5 minutes ago", "2 hours ago", "yesterday")
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Generate a friendly human-readable action text for an activity record
 */
export const formatActivityMessage = (activity) => {
  if (!activity) return '';

  const actor = activity.actorName || 'A team member';
  const action = activity.action;
  const meta = activity.metadata || {};

  switch (action) {
    case 'task_created':
      return `${actor} created this task`;

    case 'task_status_changed': {
      const oldStatus = (meta.old_status || 'unknown').replace('_', ' ');
      const newStatus = (meta.new_status || 'unknown').replace('_', ' ');
      return `${actor} moved this task from ${oldStatus} to ${newStatus}`;
    }

    case 'task_priority_changed': {
      const oldPriority = meta.old_priority || 'medium';
      const newPriority = meta.new_priority || 'medium';
      return `${actor} changed priority from ${oldPriority} to ${newPriority}`;
    }

    case 'task_assigned': {
      const assignee = meta.assignee_name || 'a team member';
      return `${actor} assigned this task to ${assignee}`;
    }

    case 'task_unassigned':
      return `${actor} unassigned this task`;

    case 'task_due_date_changed': {
      if (!meta.new_due_date) {
        return `${actor} removed the due date`;
      }
      const formattedDate = new Date(meta.new_due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return `${actor} set the due date to ${formattedDate}`;
    }

    case 'task_updated': {
      if (meta.title_changed && meta.description_changed) {
        return `${actor} updated the task title and description`;
      }
      if (meta.title_changed) {
        return `${actor} updated the task title`;
      }
      if (meta.description_changed) {
        return `${actor} updated the task description`;
      }
      return `${actor} updated task details`;
    }

    case 'attachment_uploaded': {
      const fileName = meta.file_name || 'a file';
      return `${actor} attached ${fileName}`;
    }

    case 'attachment_deleted': {
      const fileName = meta.file_name || 'a file';
      return `${actor} removed attachment ${fileName}`;
    }

    case 'task_deleted':
      return `${actor} deleted this task`;

    default:
      return `${actor} performed an update`;
  }
};
