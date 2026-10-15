/**
 * RBAC (Role-Based Access Control) Middleware
 * Enforces organization-level permissions and roles for authenticated endpoints.
 */
const { supabase, isConfigured, getUserClient } = require('../config/supabase');
const { hasRolePermission, ROLE_PERMISSIONS } = require('../constants/permissions');

/**
 * Helper to extract organization ID from various request locations
 */
const getOrganizationId = (req) => {
  return (
    req.params.orgId ||
    req.params.organizationId ||
    req.params.id ||
    req.body.organizationId ||
    req.query.organizationId ||
    req.headers['x-organization-id']
  );
};

/**
 * Middleware: Require specific permission(s) within the active organization context
 * @param {string} permission - e.g. 'members.manage', 'organization.update'
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // 1. Ensure user is authenticated via authMiddleware
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
      }

      const orgId = getOrganizationId(req);
      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Bad Request: Organization ID is required for permission verification',
        });
      }

      if (!isConfigured) {
        return res.status(503).json({
          success: false,
          message: 'Database service is unconfigured',
        });
      }

      const dbClient = getUserClient(req.token);

      // 2. Query organization membership and role for the authenticated user
      let { data: membership, error } = await dbClient
        .from('organization_members')
        .select('id, role, organization_id')
        .eq('organization_id', orgId)
        .eq('user_id', req.user.id)
        .maybeSingle();

      // Creator self-healing fallback: If user created this organization but membership row was missed
      if (!membership) {
        const { data: org } = await dbClient
          .from('organizations')
          .select('id, created_by')
          .eq('id', orgId)
          .maybeSingle();

        if (org && org.created_by === req.user.id) {
          try {
            const { data: newMem } = await dbClient
              .from('organization_members')
              .insert({
                organization_id: orgId,
                user_id: req.user.id,
                role: 'admin',
              })
              .select('id, role, organization_id')
              .single();

            if (newMem) membership = newMem;
            else membership = { id: req.user.id, role: 'admin', organization_id: orgId };
          } catch {
            membership = { id: req.user.id, role: 'admin', organization_id: orgId };
          }
        }
      }

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not a member of this organization',
        });
      }

      const userRole = membership.role;

      // 3. Verify permission against role definition
      if (!hasRolePermission(userRole, permission)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to perform this action.',
          requiredPermission: permission,
          userRole,
        });
      }

      // 4. Attach verified membership to request context
      req.membership = {
        id: membership.id,
        organizationId: membership.organization_id,
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole] || [],
      };

      next();
    } catch (err) {
      console.error('RBAC permission check error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization verification',
      });
    }
  };
};

/**
 * Middleware: Require one of the specified roles within the organization
 * @param  {...string} allowedRoles - e.g. 'admin', 'project_manager'
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User authentication required',
        });
      }

      const orgId = getOrganizationId(req);
      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Bad Request: Organization ID is required for role verification',
        });
      }

      if (!isConfigured) {
        return res.status(503).json({
          success: false,
          message: 'Database service is unconfigured',
        });
      }

      const dbClient = getUserClient(req.token);

      let { data: membership, error } = await dbClient
        .from('organization_members')
        .select('id, role, organization_id')
        .eq('organization_id', orgId)
        .eq('user_id', req.user.id)
        .maybeSingle();

      // Creator self-healing fallback
      if (!membership) {
        const { data: org } = await dbClient
          .from('organizations')
          .select('id, created_by')
          .eq('id', orgId)
          .maybeSingle();

        if (org && org.created_by === req.user.id) {
          try {
            const { data: newMem } = await dbClient
              .from('organization_members')
              .insert({
                organization_id: orgId,
                user_id: req.user.id,
                role: 'admin',
              })
              .select('id, role, organization_id')
              .single();

            if (newMem) membership = newMem;
            else membership = { id: req.user.id, role: 'admin', organization_id: orgId };
          } catch {
            membership = { id: req.user.id, role: 'admin', organization_id: orgId };
          }
        }
      }

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not a member of this organization',
        });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient role authorization for this operation',
          allowedRoles,
          userRole: membership.role,
        });
      }

      req.membership = {
        id: membership.id,
        organizationId: membership.organization_id,
        role: membership.role,
        permissions: ROLE_PERMISSIONS[membership.role] || [],
      };

      next();
    } catch (err) {
      console.error('RBAC role check error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification',
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireRole,
  getOrganizationId,
};
