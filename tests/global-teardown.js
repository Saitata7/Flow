/**
 * Global Test Teardown
 * Runs once after all tests
 */

module.exports = async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  // Clear any global state
  if (global.testDatabase) {
    await global.testDatabase.close();
  }
  
  if (global.testRedis) {
    await global.testRedis.disconnect();
  }
  
  // Clear any global mocks
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  console.log('✅ Global test environment cleanup complete');
};
