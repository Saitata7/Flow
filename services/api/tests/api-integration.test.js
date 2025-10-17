#!/usr/bin/env node

/**
 * Comprehensive API Integration Tests
 * Tests all API endpoints with real data and proper authentication
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Test data
const testFlow = {
  title: 'Morning Exercise',
  description: 'Daily morning workout routine',
  trackingType: 'Binary',
  frequency: 'Daily',
  everyDay: true,
  reminderTime: '2024-01-01T07:00:00Z',
  reminderLevel: '2',
  cheatMode: false,
  goal: {
    type: 'count',
    value: 1,
    unit: 'session'
  },
  progressMode: 'sum',
  tags: ['health', 'fitness'],
  visibility: 'private'
};

const testFlowEntry = {
  symbol: '+',
  moodScore: 4,
  note: 'Great workout today!',
  timestamp: new Date().toISOString()
};

const testPlan = {
  name: 'Health & Fitness Plan',
  description: 'Comprehensive health improvement plan',
  category: 'health',
  difficulty: 'intermediate',
  estimatedDuration: 30,
  tags: ['health', 'fitness', 'wellness']
};

// Test configurations
const tests = [
  // Health and Debug endpoints (no auth required)
  {
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    headers: {},
    expectedStatus: 200,
    validateResponse: (data) => data.status === 'healthy'
  },
  {
    name: 'Debug Environment',
    method: 'GET',
    url: '/debug/env',
    headers: {},
    expectedStatus: 200,
    validateResponse: (data) => data.NODE_ENV === 'development'
  },

  // Flows endpoints
  {
    name: 'Get Flows (Empty)',
    method: 'GET',
    url: '/v1/flows',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && Array.isArray(data.data)
  },
  {
    name: 'Create Flow',
    method: 'POST',
    url: '/v1/flows',
    headers: { 
      'Authorization': 'Bearer dev-token-test',
      'Content-Type': 'application/json'
    },
    data: testFlow,
    expectedStatus: 201,
    validateResponse: (data) => data.success === true && data.data.id
  },
  {
    name: 'Get Flows (With Data)',
    method: 'GET',
    url: '/v1/flows',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && data.data.length > 0
  },
  {
    name: 'Get Flow by ID',
    method: 'GET',
    url: '/v1/flows/:flowId',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && data.data.title === testFlow.title,
    dependsOn: 'Create Flow'
  },
  {
    name: 'Update Flow',
    method: 'PUT',
    url: '/v1/flows/:flowId',
    headers: { 
      'Authorization': 'Bearer dev-token-test',
      'Content-Type': 'application/json'
    },
    data: { ...testFlow, title: 'Updated Morning Exercise' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && data.data.title === 'Updated Morning Exercise',
    dependsOn: 'Create Flow'
  },

  // Flow Entries endpoints
  {
    name: 'Create Flow Entry',
    method: 'POST',
    url: '/v1/flow-entries',
    headers: { 
      'Authorization': 'Bearer dev-token-test',
      'Content-Type': 'application/json'
    },
    data: { ...testFlowEntry, flowId: ':flowId' },
    expectedStatus: 201,
    validateResponse: (data) => data.success === true && data.data.id,
    dependsOn: 'Create Flow'
  },
  {
    name: 'Get Flow Entries',
    method: 'GET',
    url: '/v1/flow-entries',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && Array.isArray(data.data),
    dependsOn: 'Create Flow Entry'
  },

  // Activities endpoints
  {
    name: 'Get Activity Stats',
    method: 'GET',
    url: '/v1/activities/stats',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && typeof data.data === 'object'
  },
  {
    name: 'Get Flow Activity Stats',
    method: 'GET',
    url: '/v1/activities/flow/:flowId',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && typeof data.data === 'object',
    dependsOn: 'Create Flow'
  },

  // Plans endpoints
  {
    name: 'Get Plans',
    method: 'GET',
    url: '/v1/plans',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && Array.isArray(data.data)
  },
  {
    name: 'Create Plan',
    method: 'POST',
    url: '/v1/plans',
    headers: { 
      'Authorization': 'Bearer dev-token-test',
      'Content-Type': 'application/json'
    },
    data: testPlan,
    expectedStatus: 201,
    validateResponse: (data) => data.success === true && data.data.id
  },

  // Settings endpoints
  {
    name: 'Get Settings',
    method: 'GET',
    url: '/v1/settings',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && typeof data.data === 'object'
  },

  // Stats endpoints
  {
    name: 'Get Stats',
    method: 'GET',
    url: '/v1/stats',
    headers: { 'Authorization': 'Bearer dev-token-test' },
    expectedStatus: 200,
    validateResponse: (data) => data.success === true && typeof data.data === 'object'
  },

  // Authentication tests
  {
    name: 'Unauthorized Request',
    method: 'GET',
    url: '/v1/flows',
    headers: {},
    expectedStatus: 401,
    validateResponse: (data) => data.success === false && data.code === 'UNAUTHORIZED'
  },
  {
    name: 'Invalid Token',
    method: 'GET',
    url: '/v1/flows',
    headers: { 'Authorization': 'Bearer invalid-token' },
    expectedStatus: 401,
    validateResponse: (data) => data.success === false && data.code === 'UNAUTHORIZED'
  }
];

// Store created resources for cleanup
let createdResources = {
  flows: [],
  flowEntries: [],
  plans: []
};

async function runTest(test, context = {}) {
  try {
    console.log(`\n🧪 Running: ${test.name}`);
    
    // Replace placeholders in URL
    let url = test.url;
    if (url.includes(':flowId') && context.flowId) {
      url = url.replace(':flowId', context.flowId);
    }
    
    console.log(`   ${test.method} ${url}`);
    
    const response = await axios({
      method: test.method,
      url: `${BASE_URL}${url}`,
      headers: test.headers,
      data: test.data,
      validateStatus: () => true, // Don't throw on any status
    });

    const success = response.status === test.expectedStatus;
    const status = success ? '✅' : '❌';
    
    console.log(`   ${status} Status: ${response.status} (expected: ${test.expectedStatus})`);
    
    if (success && test.validateResponse) {
      const validationSuccess = test.validateResponse(response.data);
      const validationStatus = validationSuccess ? '✅' : '❌';
      console.log(`   ${validationStatus} Response validation: ${validationSuccess ? 'PASSED' : 'FAILED'}`);
      
      if (!validationSuccess) {
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      }
    }
    
    // Store created resources
    if (success && response.data && response.data.data && response.data.data.id) {
      if (test.name.includes('Flow') && !test.name.includes('Entry')) {
        createdResources.flows.push(response.data.data.id);
        context.flowId = response.data.data.id;
      } else if (test.name.includes('Entry')) {
        createdResources.flowEntries.push(response.data.data.id);
      } else if (test.name.includes('Plan')) {
        createdResources.plans.push(response.data.data.id);
      }
    }

    return {
      name: test.name,
      success: success && (!test.validateResponse || test.validateResponse(response.data)),
      status: response.status,
      expectedStatus: test.expectedStatus,
      response: response.data,
      context
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      name: test.name,
      success: false,
      error: error.message,
      context
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests');
  console.log(`📍 API Base URL: ${BASE_URL}`);
  console.log(`🔧 Test User ID: ${TEST_USER_ID}`);
  
  const results = [];
  const context = {};
  
  for (const test of tests) {
    // Check if test depends on another test
    if (test.dependsOn) {
      const dependency = results.find(r => r.name === test.dependsOn);
      if (!dependency || !dependency.success) {
        console.log(`\n⏭️ Skipping: ${test.name} (dependency ${test.dependsOn} failed)`);
        results.push({
          name: test.name,
          success: false,
          skipped: true,
          reason: `Dependency ${test.dependsOn} failed`
        });
        continue;
      }
    }
    
    const result = await runTest(test, context);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success && !r.skipped).forEach(result => {
      console.log(`   - ${result.name}: ${result.error || `Status ${result.status} (expected ${result.expectedStatus})`}`);
    });
  }
  
  if (skipped > 0) {
    console.log('\n⏭️ Skipped Tests:');
    results.filter(r => r.skipped).forEach(result => {
      console.log(`   - ${result.name}: ${result.reason}`);
    });
  }
  
  console.log('\n🔍 API System Status:', failed === 0 ? 'HEALTHY' : 'NEEDS ATTENTION');
  
  // Cleanup created resources
  console.log('\n🧹 Cleaning up created resources...');
  await cleanupResources();
  
  return results;
}

async function cleanupResources() {
  // Delete created flows
  for (const flowId of createdResources.flows) {
    try {
      await axios({
        method: 'DELETE',
        url: `${BASE_URL}/v1/flows/${flowId}`,
        headers: { 'Authorization': 'Bearer dev-token-test' }
      });
      console.log(`   ✅ Deleted flow: ${flowId}`);
    } catch (error) {
      console.log(`   ⚠️ Failed to delete flow ${flowId}: ${error.message}`);
    }
  }
  
  // Delete created plans
  for (const planId of createdResources.plans) {
    try {
      await axios({
        method: 'DELETE',
        url: `${BASE_URL}/v1/plans/${planId}`,
        headers: { 'Authorization': 'Bearer dev-token-test' }
      });
      console.log(`   ✅ Deleted plan: ${planId}`);
    } catch (error) {
      console.log(`   ⚠️ Failed to delete plan ${planId}: ${error.message}`);
    }
  }
  
  console.log('   🧹 Cleanup completed');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, runTest, cleanupResources };
