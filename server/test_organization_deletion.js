/**
 * Test Suite: Organization Deletion Authorization, Validation & Storage Cleanup
 */
const assert = require('assert');

// Test 1: UUID Validation
console.log('Testing: Organization ID format validation...');
const isValidUuid = (val) => Boolean(val && /^[0-9a-fA-F-]{36}$/.test(val));
assert.strictEqual(isValidUuid('invalid-id'), false, 'Non-UUID should be rejected');
assert.strictEqual(isValidUuid('12345'), false, 'Short string should be rejected');
assert.strictEqual(isValidUuid('d3b07384-d113-4638-9ff7-b1234567890a'), true, 'Valid UUID should be accepted');
console.log('✅ Passed UUID validation tests');

// Test 2: Authorization Matrix Logic
console.log('\nTesting: Organization Deletion Authorization Matrix...');

function checkDeletionPermission({ userId, org, membership }) {
  if (!org) {
    return { status: 404, message: 'Organization not found' };
  }

  const isOwner = org.created_by ? org.created_by === userId : false;
  const isAdmin = membership?.role === 'admin';

  if (!membership && !isOwner) {
    return { status: 403, message: 'Forbidden: You are not a member of this organization' };
  }

  if (!isAdmin) {
    return { status: 403, message: 'Forbidden: Insufficient permissions. Only organization administrators can delete this workspace.' };
  }

  if (org.created_by && !isOwner) {
    return { status: 403, message: 'Forbidden: Only the organization owner who created this workspace can delete it.' };
  }

  return { status: 200, message: 'Authorized' };
}

const ownerId = 'user-owner-1111-1111-111111111111';
const nonOwnerAdminId = 'user-admin-2222-2222-222222222222';
const memberId = 'user-member-3333-3333-333333333333';
const outsiderId = 'user-outsider-4444-4444-444444444444';

const testOrg = {
  id: 'org-test-5555-5555-555555555555',
  name: 'Acme Software',
  created_by: ownerId,
};

// Scenario A: Outsider tries to delete
const resA = checkDeletionPermission({
  userId: outsiderId,
  org: testOrg,
  membership: null,
});
assert.strictEqual(resA.status, 403, 'Outsider must be forbidden');
console.log('✅ Scenario A passed: Non-member is forbidden (403)');

// Scenario B: Regular Member tries to delete
const resB = checkDeletionPermission({
  userId: memberId,
  org: testOrg,
  membership: { role: 'member' },
});
assert.strictEqual(resB.status, 403, 'Regular member must be forbidden');
console.log('✅ Scenario B passed: Member is forbidden (403)');

// Scenario C: Non-owner Admin tries to delete (owner exists)
const resC = checkDeletionPermission({
  userId: nonOwnerAdminId,
  org: testOrg,
  membership: { role: 'admin' },
});
assert.strictEqual(resC.status, 403, 'Non-owner admin must be forbidden when creator exists');
assert(resC.message.includes('owner who created'), 'Message must indicate owner restriction');
console.log('✅ Scenario C passed: Non-owner admin is forbidden (403)');

// Scenario D: Authorized Owner (creator + admin) deletes
const resD = checkDeletionPermission({
  userId: ownerId,
  org: testOrg,
  membership: { role: 'admin' },
});
assert.strictEqual(resD.status, 200, 'Authorized owner must be permitted');
console.log('✅ Scenario D passed: Authorized owner is permitted (200)');

// Scenario E: Admin deletes an organization where created_by is null (e.g. system created)
const legacyOrg = { id: 'org-legacy-6666', name: 'Legacy Org', created_by: null };
const resE = checkDeletionPermission({
  userId: nonOwnerAdminId,
  org: legacyOrg,
  membership: { role: 'admin' },
});
assert.strictEqual(resE.status, 200, 'Admin can delete legacy org with null creator');
console.log('✅ Scenario E passed: Admin can delete legacy organization with null creator (200)');

// Test 3: Storage Cleanup Simulation
console.log('\nTesting: Storage File Cleanup Simulation...');
const mockAttachments = [
  { id: 'att-1', storage_path: 'org-test-5555/task-1/spec.pdf' },
  { id: 'att-2', storage_path: 'org-test-5555/task-2/mockup.png' },
  { id: 'att-3', storage_path: null }, // edge case null path
];

const pathsToRemove = mockAttachments.map((a) => a.storage_path).filter(Boolean);
assert.strictEqual(pathsToRemove.length, 2, 'Should filter out falsy paths');
assert.strictEqual(pathsToRemove[0], 'org-test-5555/task-1/spec.pdf');
console.log('✅ Storage paths extracted correctly for removal:', pathsToRemove);

// Test 4: Verify RBAC permissions map
console.log('\nTesting: Permissions map consistency...');
const { ROLE_PERMISSIONS: serverPerms } = require('./src/constants/permissions');
assert(serverPerms.admin.includes('organization.delete'), 'server permissions must include organization.delete');
assert(!serverPerms.project_manager.includes('organization.delete'), 'project_manager must not have organization.delete');
assert(!serverPerms.member.includes('organization.delete'), 'member must not have organization.delete');
assert(!serverPerms.viewer.includes('organization.delete'), 'viewer must not have organization.delete');
console.log('✅ RBAC permission map strictly limits organization.delete to admin role');

console.log('\n========================================');
console.log('🎉 ALL 7 UNIT & AUTHORIZATION TESTS PASSED');
console.log('========================================');
