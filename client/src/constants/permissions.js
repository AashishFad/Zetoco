/**
 * FlowSync Role-Based Access Control (RBAC) & Permissions Definition
 */

export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  member: 'Member',
  viewer: 'Viewer',
};

export const ROLE_BADGE_VARIANTS = {
  admin: 'brand',
  project_manager: 'purple',
  member: 'cyan',
  viewer: 'neutral',
};

export const ROLE_PERMISSIONS = {
  admin: [
    'organization.read',
    'organization.update',
    'organization.delete',
    'members.read',
    'members.manage',
    'projects.read',
    'projects.create',
    'projects.update',
    'projects.delete',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'comments.create',
    'settings.manage',
  ],

  project_manager: [
    'organization.read',
    'members.read',
    'projects.read',
    'projects.create',
    'projects.update',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'comments.create',
  ],

  member: [
    'organization.read',
    'projects.read',
    'tasks.read',
    'tasks.update_assigned',
    'comments.create',
  ],

  viewer: [
    'organization.read',
    'projects.read',
    'tasks.read',
  ],
};

/**
 * Check if a specific role contains a given permission
 * @param {string} role - The user's role in the organization
 * @param {string} permission - The permission key to verify
 * @returns {boolean}
 */
export const hasRolePermission = (role, permission) => {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};
