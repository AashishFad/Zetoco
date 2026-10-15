/**
 * Organizations Router
 * Handles CRUD and membership operations for FlowSync Organizations with RBAC authorization.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { supabase, getUserClient } = require('../config/supabase');
const { ROLES } = require('../constants/permissions');
const { createNotification } = require('../services/notificationService');
const {
  validateOrgName,
  normalizeOrgName,
  generateOrgSlug,
} = require('../utils/orgUtils');

const router = express.Router();

// Protect all organization routes with Supabase JWT authentication
router.use(authMiddleware);

/**
 * GET /api/organizations
 * List all organizations the authenticated user is a member of.
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dbClient = getUserClient(req.token);

    const { data, error } = await dbClient
      .from('organization_members')
      .select(`
        role,
        joined_at,
        organizations (
          id,
          name,
          slug,
          description,
          logo_url,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const organizations = (data || [])
      .map((row) => ({
        ...row.organizations,
        userRole: row.role,
        joinedAt: row.joined_at,
      }))
      .filter((org) => org && org.id);

    res.json({
      success: true,
      data: organizations,
      count: organizations.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/organizations
 * Create a new organization and assign the authenticated creator as admin.
 * Enforces globally unique organization names and automatic slug generation.
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, description, logo_url } = req.body;
    const dbClient = getUserClient(req.token);

    // 1. Validate and normalize organization name
    const validation = validateOrgName(name);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const { normalizedName, slug } = validation;

    // 2. Pre-check for duplicate name (case-insensitive) across organizations
    const { data: existingByName } = await dbClient
      .from('organizations')
      .select('id, name')
      .ilike('name', normalizedName)
      .limit(1);

    if (existingByName && existingByName.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An organization with this name already exists. Please choose a different name.',
      });
    }

    // 3. Pre-check for duplicate slug
    const { data: existingBySlug } = await dbClient
      .from('organizations')
      .select('id, slug')
      .eq('slug', slug)
      .limit(1);

    if (existingBySlug && existingBySlug.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An organization with this name already exists. Please choose a different name.',
      });
    }

    // 4. Insert organization (database constraints serve as final authority)
    const { data: newOrg, error: orgError } = await dbClient
      .from('organizations')
      .insert({
        name: normalizedName,
        slug,
        description: description?.trim() || null,
        logo_url: logo_url || null,
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) {
      // Handle PostgreSQL unique constraint violations (code 23505) gracefully
      if (
        orgError.code === '23505' ||
        orgError.message?.toLowerCase().includes('duplicate') ||
        orgError.message?.toLowerCase().includes('unique')
      ) {
        return res.status(409).json({
          success: false,
          message: 'An organization with this name already exists. Please choose a different name.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to create organization. Please try again.',
      });
    }

    // 5. Insert creator as Admin in organization_members
    const { error: memberError } = await dbClient
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: userId,
        role: ROLES.ADMIN,
      });

    if (memberError) {
      console.error('Creator membership creation failed; rolling back organization:', memberError.message);
      // Safe rollback to preserve data consistency (no orphan organizations)
      await dbClient.from('organizations').delete().eq('id', newOrg.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize workspace creator membership. Please try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        ...newOrg,
        userRole: ROLES.ADMIN,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/:id
 * Retrieve single organization details (requires organization.read permission)
 */
router.get('/:id', requirePermission('organization.read'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgErr || !org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...org,
        userRole: req.membership.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/organizations/:id
 * Update organization settings (requires organization.update permission - Admin only)
 */
router.patch('/:id', requirePermission('organization.update'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, logo_url } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };
    const dbClient = getUserClient(req.token);

    if (name !== undefined) {
      const validation = validateOrgName(name);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
      updates.name = validation.normalizedName;

      // Check for duplicate name on another organization
      const { data: duplicateOrg } = await dbClient
        .from('organizations')
        .select('id, name')
        .ilike('name', validation.normalizedName)
        .neq('id', id)
        .limit(1);

      if (duplicateOrg && duplicateOrg.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An organization with this name already exists. Please choose a different name.',
        });
      }
    }

    if (description !== undefined) updates.description = description.trim();
    if (logo_url !== undefined) updates.logo_url = logo_url;

    const { data: updatedOrg, error } = await dbClient
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('duplicate') ||
        error.message?.toLowerCase().includes('unique')
      ) {
        return res.status(409).json({
          success: false,
          message: 'An organization with this name already exists. Please choose a different name.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to update organization settings.',
      });
    }

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        ...updatedOrg,
        userRole: req.membership.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/:id/members
 * Retrieve list of members for an organization (requires members.read permission)
 */
router.get('/:id/members', requirePermission('members.read'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: memberRows, error: membersErr } = await supabase
      .from('organization_members')
      .select('id, role, joined_at, user_id')
      .eq('organization_id', id);

    if (membersErr) {
      return res.status(400).json({
        success: false,
        message: membersErr.message,
      });
    }

    const userIds = (memberRows || []).map((m) => m.user_id).filter(Boolean);
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title, bio')
        .in('id', userIds);

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    }

    const formatted = (memberRows || []).map((m) => {
      const pr = profileMap.get(m.user_id);
      return {
        id: m.id,
        userId: m.user_id,
        user_id: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        joined_at: m.joined_at,
        fullName: pr?.full_name || 'Member',
        full_name: pr?.full_name || 'Member',
        username: pr?.username || 'user',
        avatarUrl: pr?.avatar_url,
        avatar_url: pr?.avatar_url,
        jobTitle: pr?.job_title,
        job_title: pr?.job_title,
        bio: pr?.bio,
      };
    });

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/organizations/:id/members/:memberId/role
 * Update member role (requires members.manage permission - Admin only)
 * Includes last-admin protection safeguard
 */
router.patch('/:id/members/:memberId/role', requirePermission('members.manage'), async (req, res, next) => {
  try {
    const { id: orgId, memberId } = req.params;
    const { role: newRole } = req.body;

    const validRoles = [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.MEMBER, ROLES.VIEWER];
    if (!newRole || !validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Valid roles are: ${validRoles.join(', ')}`,
      });
    }

    // 1. Fetch current target member row
    const { data: targetMember, error: fetchErr } = await supabase
      .from('organization_members')
      .select('id, user_id, role, organization_id')
      .eq('id', memberId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (fetchErr || !targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this organization',
      });
    }

    // 2. Safeguard: Prevent removing or demoting the last admin of an organization
    if (targetMember.role === ROLES.ADMIN && newRole !== ROLES.ADMIN) {
      const { data: adminMembers, error: countErr } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('role', ROLES.ADMIN);

      if (countErr) {
        return res.status(500).json({
          success: false,
          message: 'Error verifying organization admin count',
        });
      }

      if ((adminMembers || []).length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the sole administrator. Assign another administrator before changing this role.',
        });
      }
    }

    // 3. Update member's role
    const { data: updatedMember, error: updateErr } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select(`
        id,
        role,
        joined_at,
        user_id,
        profiles (
          id,
          full_name,
          username,
          avatar_url,
          job_title,
          bio
        )
      `)
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message,
      });
    }

    // Notify member if role changed
    if (targetMember.user_id !== req.user.id && targetMember.role !== newRole) {
      const orgName = req.organization?.name || 'the workspace';
      await createNotification({
        dbClient,
        userId: targetMember.user_id,
        organizationId: orgId,
        type: 'organization_role_changed',
        title: 'Your organization role changed',
        message: `You are now a ${newRole} in "${orgName}".`,
        entityType: 'organization',
        entityId: orgId,
        actorId: req.user.id,
        metadata: { organizationId: orgId, organizationName: orgName, newRole },
      });
    }

    res.json({
      success: true,
      message: `Member role updated to ${newRole}`,
      data: {
        id: updatedMember.id,
        userId: updatedMember.user_id,
        role: updatedMember.role,
        joinedAt: updatedMember.joined_at,
        fullName: updatedMember.profiles?.full_name || 'Member',
        username: updatedMember.profiles?.username || 'user',
        avatarUrl: updatedMember.profiles?.avatar_url,
        jobTitle: updatedMember.profiles?.job_title,
        bio: updatedMember.profiles?.bio,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/organizations/:id/members/:memberId/title
 * Update member specialization / job title (Admin or self)
 */
router.patch('/:id/members/:memberId/title', async (req, res, next) => {
  try {
    const { id: orgId, memberId } = req.params;
    const { job_title } = req.body;
    const userId = req.user.id;

    // 1. Fetch target member
    const { data: targetMember, error: fetchErr } = await supabase
      .from('organization_members')
      .select('id, user_id, role, organization_id')
      .eq('id', memberId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (fetchErr || !targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this organization',
      });
    }

    // 2. Check authorization: Caller must be admin or updating their own profile
    const { data: callerMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    const isSelf = targetMember.user_id === userId;
    const isAdmin = callerMember?.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can update member specializations',
      });
    }

    // 3. Update profiles.job_title using backend supabase client
    const cleanTitle = job_title?.trim() || null;
    const { data: updatedProfile, error: profileErr } = await supabase
      .from('profiles')
      .update({ job_title: cleanTitle, updated_at: new Date().toISOString() })
      .eq('id', targetMember.user_id)
      .select('id, full_name, job_title')
      .single();

    if (profileErr) {
      return res.status(400).json({
        success: false,
        message: profileErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Specialization updated successfully',
      data: {
        memberId: targetMember.id,
        userId: targetMember.user_id,
        job_title: updatedProfile?.job_title,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/organizations/:id
 * Permanently delete an organization and all associated relational data & storage files.
 * Authorization: Organization owner (created_by) or admin (when created_by is unset/null).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const dbClient = getUserClient(req.token);

    // 1. Validate UUID format
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID format',
      });
    }

    // 2. Fetch organization to verify existence and ownership
    const { data: org, error: fetchOrgErr } = await dbClient
      .from('organizations')
      .select('id, name, slug, created_by')
      .eq('id', id)
      .maybeSingle();

    if (fetchOrgErr || !org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // 3. Verify user membership and role in this organization
    const { data: membership, error: memberErr } = await dbClient
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    const isOwner = org.created_by ? org.created_by === userId : false;
    const isAdmin = membership?.role === 'admin';

    // Must be a member of the organization (or owner)
    if (!membership && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this organization',
      });
    }

    // Must have admin role
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions. Only organization administrators can delete this workspace.',
      });
    }

    // If org has a creator/owner recorded, only the owner can delete
    if (org.created_by && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the organization owner who created this workspace can delete it.',
      });
    }

    // 4. File Storage Cleanup: Query and delete all attachment files belonging to this organization
    let storageCleanup = { totalFiles: 0, removedFiles: 0, error: null };
    try {
      const { data: attachments, error: attErr } = await dbClient
        .from('attachments')
        .select('storage_path')
        .eq('organization_id', id);

      if (!attErr && attachments && attachments.length > 0) {
        const filePaths = attachments.map((a) => a.storage_path).filter(Boolean);
        storageCleanup.totalFiles = filePaths.length;

        if (filePaths.length > 0) {
          const { error: removeErr } = await dbClient.storage
            .from('flow-sync-attachments')
            .remove(filePaths);

          if (removeErr) {
            console.warn(`[Storage Warning] Error cleaning files for org ${id}:`, removeErr.message);
            storageCleanup.error = removeErr.message;
          } else {
            storageCleanup.removedFiles = filePaths.length;
          }
        }
      }
    } catch (storageException) {
      console.warn(`[Storage Warning] Storage cleanup exception for org ${id}:`, storageException.message);
      storageCleanup.error = storageException.message;
    }

    // 5. Atomic Relational Deletion: Delete the organization record from PostgreSQL
    // Foreign key CASCADE rules will automatically and atomically delete:
    // - organization_members
    // - organization_invitations
    // - projects -> project_members, tasks -> comments, attachments
    // - channels -> messages
    // - activity_logs
    // - notifications
    const { data: deletedOrg, error: deleteErr } = await dbClient
      .from('organizations')
      .delete()
      .eq('id', id)
      .select('id, name')
      .single();

    if (deleteErr) {
      console.error(`[DB Error] Failed to delete organization ${id}:`, deleteErr.message);
      return res.status(500).json({
        success: false,
        message: `Failed to delete organization: ${deleteErr.message}`,
      });
    }

    return res.json({
      success: true,
      message: `Organization "${org.name}" and all associated data were deleted successfully.`,
      data: {
        id: org.id,
        name: org.name,
        storageCleanup,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
