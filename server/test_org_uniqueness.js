/**
 * Regression Test Suite for Organization Name Uniqueness & Automatic Slug Generation
 * Tests A through K as defined in FlowSync Phase 15 requirements.
 */
const http = require('http');
const app = require('./src/app');
const { supabase } = require('./src/config/supabase');

const runTests = async () => {
  console.log('===============================================================');
  console.log('🚀 FlowSync Regression Test Suite: Org Name Uniqueness & Slugs');
  console.log('===============================================================\n');

  // 1. Start ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`[Setup] Ephemeral test server listening on port ${port}`);

  // 2. Authenticate test user
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    console.error('❌ Missing test credentials: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set to run regression tests.');
    server.close();
    process.exit(1);
  }

  console.log('[Setup] Authenticating test user with Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.session) {
    console.error('❌ Failed to authenticate test user:', authError?.message);
    server.close();
    process.exit(1);
  }

  const token = authData.session.access_token;
  const userId = authData.user.id;
  console.log(`[Setup] Authenticated as user ${userId}\n`);

  const createdOrgIds = [];

  const apiRequest = async (method, path, body = null) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body: json };
  };

  try {
    // -------------------------------------------------------------------------
    // Test A: Normal creation — Stark Innovations
    // -------------------------------------------------------------------------
    console.log('--- Test A: Normal Creation ---');
    const resA = await apiRequest('POST', '/organizations', {
      name: 'Stark Innovations',
      description: 'Advanced engineering and robotics.',
    });
    console.log(`Status: ${resA.status}, Body:`, resA.body);
    if (resA.status === 201 && resA.body.data?.name === 'Stark Innovations' && resA.body.data?.slug === 'stark-innovations') {
      console.log('✅ Test A PASSED: Organization created with normalized name and auto slug.\n');
      createdOrgIds.push(resA.body.data.id);
    } else {
      throw new Error(`Test A failed: expected 201, got ${resA.status}`);
    }

    // -------------------------------------------------------------------------
    // Test B: Exact duplicate — Stark Innovations
    // -------------------------------------------------------------------------
    console.log('--- Test B: Exact Duplicate ---');
    const resB = await apiRequest('POST', '/organizations', {
      name: 'Stark Innovations',
    });
    console.log(`Status: ${resB.status}, Body:`, resB.body);
    if (resB.status === 409 && resB.body.message?.includes('already exists')) {
      console.log('✅ Test B PASSED: Exact duplicate correctly rejected with 409 Conflict.\n');
    } else {
      throw new Error(`Test B failed: expected 409, got ${resB.status}`);
    }

    // -------------------------------------------------------------------------
    // Test C: Case-insensitive duplicate — stark innovations
    // -------------------------------------------------------------------------
    console.log('--- Test C: Case-Insensitive Duplicate ---');
    const resC = await apiRequest('POST', '/organizations', {
      name: 'stark innovations',
    });
    console.log(`Status: ${resC.status}, Body:`, resC.body);
    if (resC.status === 409 && resB.body.message?.includes('already exists')) {
      console.log('✅ Test C PASSED: Case-insensitive duplicate correctly rejected with 409 Conflict.\n');
    } else {
      throw new Error(`Test C failed: expected 409, got ${resC.status}`);
    }

    // -------------------------------------------------------------------------
    // Test D: Whitespace duplicate — "  Stark   Innovations  "
    // -------------------------------------------------------------------------
    console.log('--- Test D: Whitespace Duplicate ---');
    const resD = await apiRequest('POST', '/organizations', {
      name: '  Stark   Innovations  ',
    });
    console.log(`Status: ${resD.status}, Body:`, resD.body);
    if (resD.status === 409 && resD.body.message?.includes('already exists')) {
      console.log('✅ Test D PASSED: Whitespace-padded duplicate normalized and rejected with 409 Conflict.\n');
    } else {
      throw new Error(`Test D failed: expected 409, got ${resD.status}`);
    }

    // -------------------------------------------------------------------------
    // Test E: Different name — Wayne Technologies
    // -------------------------------------------------------------------------
    console.log('--- Test E: Different Name (Wayne Technologies) ---');
    const resE = await apiRequest('POST', '/organizations', {
      name: 'Wayne Technologies',
      description: 'Applied defense and aerospace.',
    });
    console.log(`Status: ${resE.status}, Body:`, resE.body);
    if (resE.status === 201 && resE.body.data?.name === 'Wayne Technologies' && resE.body.data?.slug === 'wayne-technologies') {
      console.log('✅ Test E PASSED: Distinct organization created successfully.\n');
      createdOrgIds.push(resE.body.data.id);
    } else {
      throw new Error(`Test E failed: expected 201, got ${resE.status}`);
    }

    // -------------------------------------------------------------------------
    // Test F: Automatic slug — Future Labs
    // -------------------------------------------------------------------------
    console.log('--- Test F: Automatic Slug (Future Labs) ---');
    const resF = await apiRequest('POST', '/organizations', {
      name: 'Future Labs',
      description: 'Next-gen prototyping.',
    });
    console.log(`Status: ${resF.status}, Body:`, resF.body);
    if (resF.status === 201 && resF.body.data?.slug === 'future-labs') {
      console.log('✅ Test F PASSED: Auto-generated slug "future-labs" stored without user input.\n');
      createdOrgIds.push(resF.body.data.id);
    } else {
      throw new Error(`Test F failed: expected 201, got ${resF.status}`);
    }

    // -------------------------------------------------------------------------
    // Test G: Direct API duplicate — Attempting direct duplicate via API
    // -------------------------------------------------------------------------
    console.log('--- Test G: Direct API Duplicate ---');
    const resG = await apiRequest('POST', '/organizations', {
      name: 'WAYNE TECHNOLOGIES',
    });
    console.log(`Status: ${resG.status}, Body:`, resG.body);
    if (resG.status === 409 && resG.body.message?.includes('already exists')) {
      console.log('✅ Test G PASSED: Direct uppercase API duplicate rejected by server with 409.\n');
    } else {
      throw new Error(`Test G failed: expected 409, got ${resG.status}`);
    }

    // -------------------------------------------------------------------------
    // Test H: Concurrent duplicate requests — Oscorp Industries
    // -------------------------------------------------------------------------
    console.log('--- Test H: Concurrent Duplicate Requests ---');
    const [concurrent1, concurrent2] = await Promise.all([
      apiRequest('POST', '/organizations', { name: 'Oscorp Industries' }),
      apiRequest('POST', '/organizations', { name: 'Oscorp Industries' }),
    ]);
    console.log(`Concurrent 1: ${concurrent1.status}, Concurrent 2: ${concurrent2.status}`);
    const statuses = [concurrent1.status, concurrent2.status].sort();
    if (statuses[0] === 201 && statuses[1] === 409) {
      console.log('✅ Test H PASSED: Exactly one concurrent request succeeded (201); the other received 409 Conflict.\n');
      const winOrg = concurrent1.status === 201 ? concurrent1.body.data : concurrent2.body.data;
      createdOrgIds.push(winOrg.id);
    } else {
      throw new Error(`Test H failed: expected [201, 409], got [${concurrent1.status}, ${concurrent2.status}]`);
    }

    // -------------------------------------------------------------------------
    // Test I: Persistence — GET /api/organizations
    // -------------------------------------------------------------------------
    console.log('--- Test I: Persistence & Retrieval ---');
    const resI = await apiRequest('GET', '/organizations');
    console.log(`Status: ${resI.status}, Found: ${resI.body.count} organizations`);
    const orgNames = (resI.body.data || []).map((o) => o.name);
    console.log('Retrieved names:', orgNames);
    if (
      orgNames.includes('Stark Innovations') &&
      orgNames.includes('Wayne Technologies') &&
      orgNames.includes('Future Labs') &&
      orgNames.includes('Oscorp Industries')
    ) {
      console.log('✅ Test I PASSED: Organizations persist and retrieve correctly.\n');
    } else {
      throw new Error('Test I failed: Missing expected organizations in list');
    }

    // -------------------------------------------------------------------------
    // Test J: Membership Integrity — Verify Admin Membership
    // -------------------------------------------------------------------------
    console.log('--- Test J: Membership Integrity ---');
    for (const org of resI.body.data) {
      if (createdOrgIds.includes(org.id)) {
        if (org.userRole !== 'admin') {
          throw new Error(`Test J failed: Org ${org.name} has role ${org.userRole}, expected admin`);
        }
      }
    }
    console.log('✅ Test J PASSED: All created organizations have creator assigned as admin.\n');

    // -------------------------------------------------------------------------
    // Test K: Existing Features & RBAC Checks
    // -------------------------------------------------------------------------
    console.log('--- Test K: Existing Features & RBAC ---');
    const starkOrgId = createdOrgIds[0];
    const resK = await apiRequest('GET', `/organizations/${starkOrgId}`);
    if (resK.status === 200 && resK.body.data?.name === 'Stark Innovations' && resK.body.data?.userRole === 'admin') {
      console.log('✅ Test K PASSED: Organization details and RBAC role verified.\n');
    } else {
      throw new Error(`Test K failed: Expected 200, got ${resK.status}`);
    }

    console.log('===============================================================');
    console.log('🎉 ALL TESTS PASSED: Tests A through K executed successfully!');
    console.log('===============================================================\n');
  } finally {
    // Clean up created test organizations to keep database clean
    console.log(`[Teardown] Cleaning up ${createdOrgIds.length} test organization(s)...`);
    for (const orgId of createdOrgIds) {
      await supabase.from('organizations').delete().eq('id', orgId);
    }
    console.log('[Teardown] Database cleaned.');
    server.close();
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
