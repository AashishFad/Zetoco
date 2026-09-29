/**
 * Database Connection Diagnostic Script
 * Run with: npm run test:db
 */
const { testDbConnection, pool } = require('../config/db');

const runTest = async () => {
  console.log('Testing PostgreSQL connection...');
  const result = await testDbConnection();

  if (result.connected) {
    console.log('✅ ' + result.message);
    console.log('🕒 Server Time:', result.timestamp);
    console.log('📦 PG Version:', result.version);
    await pool.end();
    process.exit(0);
  } else {
    console.error('❌ ' + result.message);
    console.log('\nTip: Make sure PostgreSQL service is running and DATABASE_URL in .env is correct.');
    await pool.end();
    process.exit(1);
  }
};

runTest();
