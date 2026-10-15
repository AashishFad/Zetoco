import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ROLES, ROLE_PERMISSIONS, hasRolePermission } from '../constants/permissions';
import apiClient from '../services/api';
import { validateOrgName, normalizeOrgName, generateOrgSlug } from '../utils/orgUtils';

const OrganizationContext = createContext(null);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export function OrganizationProvider({ children }) {
  const { user, isConfigured } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  /**
   * Fetch members for a specific organization
   */
  const fetchOrgMembers = useCallback(async (orgId) => {
    if (!orgId) {
      setMembers([]);
      return [];
    }

    // 1. Try Supabase direct query
    if (isConfigured) {
      try {
        const { data: memberRows, error: membersError } = await supabase
          .from('organization_members')
          .select('id, role, joined_at, user_id')
          .eq('organization_id', orgId);

        if (!membersError && memberRows) {
          const userIds = memberRows.map((m) => m.user_id).filter(Boolean);
          let profileMap = new Map();

          if (userIds.length > 0) {
            try {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, job_title, bio')
                .in('id', userIds);

              if (profiles) {
                profileMap = new Map(profiles.map((p) => [p.id, p]));
              }
            } catch (prErr) {
              console.warn('Could not fetch profiles for org members:', prErr.message);
            }
          }

          const formattedMembers = memberRows.map((m) => {
            const p = profileMap.get(m.user_id);
            return {
              id: m.id,
              user_id: m.user_id,
              userId: m.user_id,
              role: m.role || ROLES.MEMBER,
              joined_at: m.joined_at,
              joinedAt: m.joined_at,
              full_name: p?.full_name || 'Team Member',
              fullName: p?.full_name || 'Team Member',
              username: p?.username || 'member',
              avatar_url: p?.avatar_url || null,
              avatarUrl: p?.avatar_url || null,
              job_title: p?.job_title || null,
              jobTitle: p?.job_title || null,
              bio: p?.bio || null,
            };
          });

          setMembers(formattedMembers);
          return formattedMembers;
        }
      } catch (err) {
        console.warn('Supabase fetchOrgMembers fallback to API:', err.message);
      }
    }

    // 2. Fallback to Express backend via apiClient
    try {
      const res = await apiClient.get(`/organizations/${orgId}/members`);
      const apiMembers = Array.isArray(res) ? res : (res?.data || []);
      setMembers(apiMembers);
      return apiMembers;
    } catch (err) {
      console.warn('API fetchOrgMembers error:', err.message);
      setMembers([]);
      return [];
    }
  }, [isConfigured]);

  /**
   * Fetch all organizations the user belongs to
   */
  const fetchOrganizations = useCallback(async () => {
    if (!user || !isConfigured) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setMembers([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // Query memberships and organizations
      const { data: memberRows, error: memberErr } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization_id,
          organizations (
            id,
            name,
            slug,
            description,
            logo_url,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (memberErr) {
        console.warn('Could not query organization_members:', memberErr.message);
      }

      const userOrgs = (memberRows || [])
        .map((row) => ({
          ...row.organizations,
          userRole: row.role || ROLES.MEMBER,
        }))
        .filter((org) => org && org.id);

      setOrganizations(userOrgs);

      // Determine active organization
      const storedOrgId = localStorage.getItem('flowsync_active_org_id');
      const activeOrg =
        userOrgs.find((o) => o.id === storedOrgId) ||
        userOrgs[0] ||
        null;

      setCurrentOrganization(activeOrg);

      if (activeOrg) {
        localStorage.setItem('flowsync_active_org_id', activeOrg.id);
        await fetchOrgMembers(activeOrg.id);
      } else {
        setMembers([]);
      }

      setLoading(false);
      return userOrgs;
    } catch (err) {
      console.warn('Exception fetching organizations:', err.message);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [user, isConfigured, fetchOrgMembers]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  /**
   * Current user role and permissions in the active organization
   */
  const currentRole = useMemo(() => {
    return currentOrganization?.userRole || null;
  }, [currentOrganization]);

  const currentMembership = useMemo(() => {
    if (!user || !currentOrganization) return null;
    return members.find((m) => m.user_id === user.id) || {
      user_id: user.id,
      role: currentRole || ROLES.MEMBER,
    };
  }, [user, currentOrganization, members, currentRole]);

  const permissions = useMemo(() => {
    if (!currentRole) return [];
    return ROLE_PERMISSIONS[currentRole] || [];
  }, [currentRole]);

  const can = useCallback((permission) => {
    return hasRolePermission(currentRole, permission);
  }, [currentRole]);

  /**
   * Switch Active Organization
   */
  const switchOrganization = async (orgId) => {
    const target = organizations.find((o) => o.id === orgId);
    if (!target) return;

    setCurrentOrganization(target);
    localStorage.setItem('flowsync_active_org_id', target.id);
    await fetchOrgMembers(target.id);
  };

  /**
   * Create New Organization and automatically assign creator as Admin.
   * Enforces name uniqueness, consistent whitespace normalization, and automatic slug generation.
   */
  const createOrganization = async ({ name, description, logo_url = null }) => {
    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }

    // 1. Client-side validation and normalization
    const validation = validateOrgName(name);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { normalizedName, slug } = validation;
    const cleanDescription = description?.trim() || null;

    // 2. Primary pathway: Call the Express backend API (/api/organizations)
    try {
      const response = await apiClient.post('/organizations', {
        name: normalizedName,
        description: cleanDescription,
        logo_url,
      });

      // apiClient automatically unwraps response.data, so response is { success, data, message }
      const orgData = response?.data || response?.organization || response;
      if (response?.success && orgData?.id) {
        const newOrgWithRole = {
          ...orgData,
          userRole: ROLES.ADMIN,
        };
        const updatedList = [newOrgWithRole, ...organizations];

        setOrganizations(updatedList);
        setCurrentOrganization(newOrgWithRole);
        localStorage.setItem('flowsync_active_org_id', newOrgWithRole.id);

        await fetchOrgMembers(newOrgWithRole.id);
        return { success: true, organization: newOrgWithRole };
      }
    } catch (apiErr) {
      // If the API responded with an HTTP status (like 409 Conflict, 400 Bad Request, etc.)
      const status = apiErr.statusCode || apiErr.response?.status;
      const msg = apiErr.message || apiErr.response?.data?.message;
      if (status === 409) {
        return {
          success: false,
          error: msg || 'An organization with this name already exists. Please choose a different name.',
        };
      }
      if (status && status !== 500) {
        return {
          success: false,
          error: msg || 'Failed to create organization. Please try again.',
        };
      }

      console.warn('Backend API error or unreachable, using direct Supabase fallback:', apiErr.message);
    }

    // 3. Fallback pathway: Direct Supabase client (used if backend server is offline)
    if (!isConfigured) {
      return { success: false, error: 'Database service is not configured' };
    }

    try {
      // Pre-check for duplicate name case-insensitively
      const { data: existingName } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', normalizedName)
        .limit(1);

      if (existingName && existingName.length > 0) {
        return {
          success: false,
          error: 'An organization with this name already exists. Please choose a different name.',
        };
      }

      // Pre-check for duplicate slug
      const { data: existingSlug } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('slug', slug)
        .limit(1);

      if (existingSlug && existingSlug.length > 0) {
        return {
          success: false,
          error: 'An organization with this name already exists. Please choose a different name.',
        };
      }

      // Insert organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: normalizedName,
          slug,
          description: cleanDescription,
          logo_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) {
        if (
          orgError.code === '23505' ||
          orgError.message?.toLowerCase().includes('duplicate') ||
          orgError.message?.toLowerCase().includes('unique')
        ) {
          return {
            success: false,
            error: 'An organization with this name already exists. Please choose a different name.',
          };
        }
        return { success: false, error: 'Failed to create organization. Please try again.' };
      }

      // Insert creator as Admin in organization_members
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: user.id,
          role: ROLES.ADMIN,
        });

      if (memberError) {
        console.error('Creator membership creation failed; rolling back organization:', memberError.message);
        await supabase.from('organizations').delete().eq('id', orgData.id);
        return { success: false, error: 'Failed to initialize workspace membership. Please try again.' };
      }

      const newOrgWithRole = { ...orgData, userRole: ROLES.ADMIN };
      const updatedList = [newOrgWithRole, ...organizations];

      setOrganizations(updatedList);
      setCurrentOrganization(newOrgWithRole);
      localStorage.setItem('flowsync_active_org_id', orgData.id);

      await fetchOrgMembers(orgData.id);

      return { success: true, organization: newOrgWithRole };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Update organization settings (Requires Admin / organization.update)
   */
  const updateOrganization = async ({ name, description, logo_url }) => {
    if (!currentOrganization || !user) return { success: false, error: 'No active organization' };
    if (!can('organization.update')) {
      return { success: false, error: 'Permission denied: Only Admins can modify organization settings.' };
    }

    let normalizedName = currentOrganization.name;
    if (name !== undefined) {
      const validation = validateOrgName(name);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      normalizedName = validation.normalizedName;
    }

    const payload = {
      name: normalizedName,
      description: description !== undefined ? description?.trim() || null : currentOrganization.description,
      logo_url: logo_url !== undefined ? logo_url : currentOrganization.logo_url,
    };

    // 1. Try API pathway
    try {
      const res = await apiClient.patch(`/organizations/${currentOrganization.id}`, payload);
      if (res.data?.success && res.data?.data) {
        const updatedOrg = { ...res.data.data, userRole: currentOrganization.userRole };
        setCurrentOrganization(updatedOrg);
        setOrganizations((prev) =>
          prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
        );
        return { success: true, organization: updatedOrg };
      }
    } catch (apiErr) {
      if (apiErr.response) {
        const msg = apiErr.response.data?.message;
        return {
          success: false,
          error: msg || (apiErr.response.status === 409
            ? 'An organization with this name already exists. Please choose a different name.'
            : 'Failed to update organization settings.'),
        };
      }
      console.warn('Backend API update unreachable, using Supabase fallback:', apiErr.message);
    }

    // 2. Fallback direct Supabase
    try {
      if (name !== undefined && normalizedName !== currentOrganization.name) {
        const { data: dup } = await supabase
          .from('organizations')
          .select('id, name')
          .ilike('name', normalizedName)
          .neq('id', currentOrganization.id)
          .limit(1);

        if (dup && dup.length > 0) {
          return {
            success: false,
            error: 'An organization with this name already exists. Please choose a different name.',
          };
        }
      }

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrganization.id)
        .select()
        .single();

      if (updateError) {
        if (
          updateError.code === '23505' ||
          updateError.message?.toLowerCase().includes('duplicate') ||
          updateError.message?.toLowerCase().includes('unique')
        ) {
          return {
            success: false,
            error: 'An organization with this name already exists. Please choose a different name.',
          };
        }
        return { success: false, error: updateError.message };
      }

      const updatedOrg = { ...data, userRole: currentOrganization.userRole };
      setCurrentOrganization(updatedOrg);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
      );

      return { success: true, organization: updatedOrg };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Update Member Role (Requires Admin / members.manage with Last Admin Protection)
   */
  const updateMemberRole = async (memberId, newRole) => {
    if (!currentOrganization || !user) {
      return { success: false, error: 'No active organization' };
    }

    if (!can('members.manage')) {
      return { success: false, error: 'Permission denied: Only Admins can manage member roles.' };
    }

    const targetMember = members.find((m) => m.id === memberId || m.user_id === memberId);
    if (!targetMember) {
      return { success: false, error: 'Member not found in current organization' };
    }

    // Last Admin Protection Check
    if (targetMember.role === ROLES.ADMIN && newRole !== ROLES.ADMIN) {
      const adminCount = members.filter((m) => m.role === ROLES.ADMIN).length;
      if (adminCount <= 1) {
        return {
          success: false,
          error: 'Cannot demote the sole administrator. Assign another administrator first.',
        };
      }
    }

    try {
      const { data, error: updateErr } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', targetMember.id)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      // Update members state
      setMembers((prev) =>
        prev.map((m) => (m.id === targetMember.id ? { ...m, role: newRole } : m))
      );

      // If user updated their own role, update current organization userRole as well
      if (targetMember.user_id === user.id) {
        const updatedOrg = { ...currentOrganization, userRole: newRole };
        setCurrentOrganization(updatedOrg);
        setOrganizations((prev) =>
          prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
        );
      }

      return { success: true, role: newRole };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Update Member Specialization / Job Title (Admin or self)
   */
  const updateMemberSpecialization = async (memberId, jobTitle) => {
    if (!currentOrganization || !user) {
      return { success: false, error: 'No active organization or user not authenticated' };
    }

    const cleanTitle = jobTitle !== undefined && jobTitle !== null ? jobTitle.trim() || null : null;

    // 1. Primary pathway: Call Express backend API
    try {
      const res = await apiClient.patch(
        `/organizations/${currentOrganization.id}/members/${memberId}/title`,
        { job_title: cleanTitle }
      );

      if (res?.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? { ...m, job_title: cleanTitle, jobTitle: cleanTitle }
              : m
          )
        );
        return { success: true, job_title: cleanTitle };
      }
    } catch (apiErr) {
      const status = apiErr.statusCode || apiErr.response?.status;
      const msg = apiErr.message || apiErr.response?.data?.message;
      if (status && status !== 500) {
        return { success: false, error: msg || 'Failed to update specialization' };
      }
      console.warn('Backend API updateMemberSpecialization unreachable, falling back to direct Supabase:', apiErr.message);
    }

    // 2. Direct Supabase fallback
    if (!isConfigured) {
      return { success: false, error: 'Database service is not configured' };
    }

    try {
      const targetMember = members.find((m) => m.id === memberId);
      if (!targetMember) {
        return { success: false, error: 'Member not found' };
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          job_title: cleanTitle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetMember.user_id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, job_title: cleanTitle, jobTitle: cleanTitle }
            : m
        )
      );

      return { success: true, job_title: cleanTitle };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Delete Organization (Permanently deletes organization, related records, and storage)
   * Authorization: Only organization owner (or admin when owner is unset)
   */
  const deleteOrganization = async (orgId) => {
    const targetId = orgId || currentOrganization?.id;
    if (!targetId || !user) {
      return { success: false, error: 'No active organization or user not authenticated' };
    }

    const targetOrg = organizations.find((o) => o.id === targetId) || currentOrganization;
    const isOwner = targetOrg?.created_by ? targetOrg.created_by === user.id : true;
    const isAdmin = targetOrg?.userRole === 'admin' || currentRole === 'admin';

    if (!isAdmin && !isOwner) {
      return {
        success: false,
        error: 'Permission denied: Only the organization owner or administrator can delete this workspace.',
      };
    }

    // 1. Primary pathway: Call the Express backend API (DELETE /api/organizations/:id)
    try {
      const response = await apiClient.delete(`/organizations/${targetId}`);

      // Update state after successful backend deletion
      const remainingOrgs = organizations.filter((o) => o.id !== targetId);
      setOrganizations(remainingOrgs);

      if (currentOrganization?.id === targetId) {
        const nextOrg = remainingOrgs[0] || null;
        setCurrentOrganization(nextOrg);
        if (nextOrg) {
          localStorage.setItem('flowsync_active_org_id', nextOrg.id);
          await fetchOrgMembers(nextOrg.id);
        } else {
          localStorage.removeItem('flowsync_active_org_id');
          setMembers([]);
        }
      }

      return {
        success: true,
        message: response?.message || 'Organization deleted successfully',
        remainingCount: remainingOrgs.length,
      };
    } catch (apiErr) {
      const status = apiErr.statusCode || apiErr.response?.status;
      const msg = apiErr.message || apiErr.response?.data?.message;

      // If backend responded with 403 Forbidden or 400 Bad Request or 404, return that error directly
      if (status && status !== 500) {
        return {
          success: false,
          error: msg || 'Failed to delete organization.',
        };
      }

      console.warn('Backend API delete unreachable, using direct Supabase fallback:', apiErr.message);
    }

    // 2. Direct Supabase fallback if backend server is unreachable
    if (!isConfigured) {
      return { success: false, error: 'Database service is not configured' };
    }

    try {
      // Clean up storage attachments
      try {
        const { data: attachments } = await supabase
          .from('attachments')
          .select('storage_path')
          .eq('organization_id', targetId);

        if (attachments && attachments.length > 0) {
          const paths = attachments.map((a) => a.storage_path).filter(Boolean);
          if (paths.length > 0) {
            await supabase.storage.from('flow-sync-attachments').remove(paths);
          }
        }
      } catch (stErr) {
        console.warn('Storage cleanup notice in fallback:', stErr.message);
      }

      // Delete organization from Supabase
      const { error: delError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', targetId);

      if (delError) {
        return { success: false, error: delError.message };
      }

      const remainingOrgs = organizations.filter((o) => o.id !== targetId);
      setOrganizations(remainingOrgs);

      if (currentOrganization?.id === targetId) {
        const nextOrg = remainingOrgs[0] || null;
        setCurrentOrganization(nextOrg);
        if (nextOrg) {
          localStorage.setItem('flowsync_active_org_id', nextOrg.id);
          await fetchOrgMembers(nextOrg.id);
        } else {
          localStorage.removeItem('flowsync_active_org_id');
          setMembers([]);
        }
      }

      return {
        success: true,
        message: 'Organization deleted successfully',
        remainingCount: remainingOrgs.length,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const refreshMembers = useCallback(() => {
    return fetchOrgMembers(currentOrganization?.id);
  }, [fetchOrgMembers, currentOrganization?.id]);

  const value = useMemo(
    () => ({
      organizations,
      currentOrganization,
      members,
      currentRole,
      currentMembership,
      permissions,
      can,
      hasPermission: can,
      loading,
      error,
      createOrganization,
      switchOrganization,
      updateOrganization,
      deleteOrganization,
      updateMemberRole,
      updateMemberSpecialization,
      refreshOrganizations: fetchOrganizations,
      refreshMembers,
      fetchOrgMembers,
    }),
    [
      organizations,
      currentOrganization,
      members,
      currentRole,
      currentMembership,
      permissions,
      can,
      loading,
      error,
      createOrganization,
      switchOrganization,
      updateOrganization,
      deleteOrganization,
      updateMemberRole,
      updateMemberSpecialization,
      fetchOrganizations,
      refreshMembers,
      fetchOrgMembers,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
