/**
 * FlowSync Server-Side RBAC & Permissions Definition
 */

const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

const ROLE_PERMISSIONS = {
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

const hasRolePermission = (role, permission) => {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  hasRolePermission,
};
