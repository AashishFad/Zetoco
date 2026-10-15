import React from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import { hasRolePermission } from '../../constants/permissions';

/**
 * Hook for checking permissions easily in any component
 */
export const usePermission = () => {
  const { currentRole, currentOrganization } = useOrganization();

  const can = (permission) => {
    return hasRolePermission(currentRole, permission);
  };

  return {
    can,
    hasPermission: can,
    currentRole,
    isAdmin: currentRole === 'admin',
    isProjectManager: currentRole === 'project_manager',
    isMember: currentRole === 'member',
    isViewer: currentRole === 'viewer',
    hasOrganization: Boolean(currentOrganization),
  };
};

/**
 * Reusable declarative permission wrapper component
 * Example:
 * <Can permission="members.manage">
 *   <RoleDropdown />
 * </Can>
 */
export default function Can({ permission, role, children, fallback = null }) {
  const { currentRole } = useOrganization();

  let isAllowed = false;

  if (permission) {
    isAllowed = hasRolePermission(currentRole, permission);
  } else if (role) {
    const roles = Array.isArray(role) ? role : [role];
    isAllowed = roles.includes(currentRole);
  }

  if (!isAllowed) {
    return fallback;
  }

  return <>{children}</>;
}
