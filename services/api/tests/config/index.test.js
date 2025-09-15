/**
 * Configuration Test Suite
 * Main test file that runs all configuration tests
 */

describe('Flow API Configuration Test Suite', () => {
  beforeAll(() => {
    console.log('🔍 Starting Flow API Configuration Tests...');
    console.log('==========================================');
  });

  afterAll(() => {
    console.log('✅ Configuration tests completed!');
  });

  // Import and run all configuration tests
  require('./environment.test');
  require('./firebase.test');
  require('./connections.test');
});
