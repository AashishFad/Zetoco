import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useOrganization } from '../../context/OrganizationContext';
import { hasRolePermission } from '../../constants/permissions';
import ForbiddenPage from '../../pages/ForbiddenPage';

/**
 * Route guard that checks if the active organization user has required permission
 */
export default function PermissionRoute({ permission, role, children }) {
  const { currentRole, loading } = useOrganization();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  let isAllowed = false;

  if (permission) {
    isAllowed = hasRolePermission(currentRole, permission);
  } else if (role) {
    const roles = Array.isArray(role) ? role : [role];
    isAllowed = roles.includes(currentRole);
  }

  if (!isAllowed) {
    return <ForbiddenPage requiredPermission={permission} />;
  }

  return children ? children : <Outlet />;
}
