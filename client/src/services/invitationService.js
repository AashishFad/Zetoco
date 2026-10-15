/**
 * Invitation Service
 * Client-side methods for managing in-app organization invitations,
 * pending invites, accepting, and declining.
 */
import apiClient from './api';

/**
 * Create a new direct in-app invitation for an existing registered user
 * @param {string} organizationId - UUID of the organization
 * @param {object} payload - { email: string, role: string }
 */
export async function createInvitation(organizationId, { email, role }) {
  const response = await apiClient.post(`/organizations/${organizationId}/invitations`, {
    email,
    role,
  });
  return response.data || response;
}

/**
 * Fetch all invitations for an organization (for Team page management)
 * @param {string} organizationId - UUID of the organization
 */
export async function getOrganizationInvitations(organizationId) {
  const response = await apiClient.get(`/organizations/${organizationId}/invitations`);
  return response.data || [];
}

/**
 * Fetch all pending invitations for the currently authenticated user
 */
export async function getMyPendingInvitations() {
  const response = await apiClient.get('/invitations/my-pending');
  return response.data || [];
}

/**
 * Accept an in-app invitation by invitation UUID
 * @param {string} invitationId - UUID of the invitation
 */
export async function acceptInvitationById(invitationId) {
  const response = await apiClient.post(`/invitations/${invitationId}/accept`);
  return response.data || response;
}

/**
 * Decline an in-app invitation by invitation UUID
 * @param {string} invitationId - UUID of the invitation
 */
export async function declineInvitation(invitationId) {
  const response = await apiClient.post(`/invitations/${invitationId}/decline`);
  return response.data || response;
}

/**
 * Fetch invitation context metadata by raw token (fallback link)
 * @param {string} token - The raw invitation token from URL
 */
export async function getInvitationInfo(token) {
  const response = await apiClient.get(`/invitations/info/${token}`);
  return response.data || response;
}

/**
 * Accept an invitation using raw token (fallback link)
 * @param {string} token - The raw invitation token
 */
export async function acceptInvitation(token) {
  const response = await apiClient.post(`/invitations/${token}/accept`);
  return response.data || response;
}

/**
 * Revoke a pending invitation (Admin only)
 * @param {string} invitationId - UUID of the invitation
 */
export async function revokeInvitation(invitationId) {
  const response = await apiClient.post(`/invitations/${invitationId}/revoke`);
  return response.data || response;
}
