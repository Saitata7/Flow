/**
 * Global Test Setup
 * Runs once before all tests
 */

module.exports = async () => {
  console.log('🚀 Setting up global test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TZ = 'UTC';
  process.env.LOG_LEVEL = 'error';
  
  // Disable external services in test environment
  process.env.DISABLE_EXTERNAL_SERVICES = 'true';
  process.env.MOCK_EXTERNAL_APIS = 'true';
  
  // Set test database URLs
  process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/flow_test';
  process.env.TEST_REDIS_URL = 'redis://localhost:6379/1';
  
  // Mock external API endpoints
  process.env.MOCK_API_BASE_URL = 'http://localhost:3000';
  
  console.log('✅ Global test environment setup complete');
};
