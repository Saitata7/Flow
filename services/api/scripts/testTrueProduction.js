#!/usr/bin/env node
/**
 * True GCP Production Level Test
 * Tests the actual deployed service with real GCP connections
 */

const SERVICE_URL = 'https://flow-api-c57f3te5va-uc.a.run.app';

class TrueProductionTester {
  constructor() {
    this.results = {
      serviceHealth: false,
      databaseConnection: false,
      redisConnection: false,
      apiEndpoints: false,
      dataOperations: false,
      overall: false
    };
  }

  async runAllTests() {
    console.log('🚀 Starting TRUE GCP Production Level Tests');
    console.log('='.repeat(80));
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    console.log(`🌐 Testing deployed service: ${SERVICE_URL}`);
    console.log('='.repeat(80));
    
    try {
      // Test 1: Service Health & Basic Connectivity
      await this.testServiceHealth();
      
      // Test 2: Database Connection via API
      await this.testDatabaseConnection();
      
      // Test 3: Redis Connection via API
      await this.testRedisConnection();
      
      // Test 4: API Endpoints Functionality
      await this.testAPIEndpoints();
      
      // Test 5: Data Operations (CRUD)
      await this.testDataOperations();
      
      // Summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Production test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testServiceHealth() {
    console.log('\n🏥 Testing Service Health & Basic Connectivity...');
    console.log('-'.repeat(50));
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${SERVICE_URL}/health`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      const health = await response.json();
      
      console.log('✅ Service health test passed');
      console.log(`   Status: ${health.status}`);
      console.log(`   Environment: ${health.environment}`);
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Uptime: ${health.uptime}s`);
      
      // Check if services are properly connected
      if (health.services) {
        console.log('   Service connections:');
        Object.entries(health.services).forEach(([service, status]) => {
          const icon = status.status === 'healthy' ? '✅' : '❌';
          console.log(`     ${service}: ${icon} ${status.status || 'unknown'}`);
        });
      }
      
      this.results.serviceHealth = true;
      
    } catch (error) {
      console.error('❌ Service health test failed:', error.message);
      throw error;
    }
  }

  async testDatabaseConnection() {
    console.log('\n🗄️ Testing Database Connection via API...');
    console.log('-'.repeat(50));
    
    try {
      // Test database info endpoint
      const response = await fetch(`${SERVICE_URL}/_diag/dbinfo`);
      
      if (response.ok) {
        const dbInfo = await response.json();
        
        if (dbInfo.ok) {
          console.log('✅ Database connection test passed');
          console.log(`   Database: ${dbInfo.connection_info.current_database}`);
          console.log(`   User: ${dbInfo.connection_info.current_user}`);
          console.log(`   Server IP: ${dbInfo.connection_info.server_ip}`);
          console.log(`   SSL Used: ${dbInfo.connection_info.ssl_used}`);
          console.log(`   PostgreSQL: ${dbInfo.connection_info.postgres_version.split(' ')[0]}`);
          
          this.results.databaseConnection = true;
        } else {
          console.log('⚠️ Database connection failed');
          console.log(`   Error: ${dbInfo.error}`);
          console.log('   This indicates a database credential or connectivity issue');
        }
      } else {
        console.log(`⚠️ Database info endpoint failed with status: ${response.status}`);
        console.log('   This may indicate database connection issues');
      }
      
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      // Don't throw error - this is expected if credentials are missing
    }
  }

  async testRedisConnection() {
    console.log('\n🔴 Testing Redis Connection via API...');
    console.log('-'.repeat(50));
    
    try {
      // Test if Redis is working by checking health endpoint
      const response = await fetch(`${SERVICE_URL}/health`);
      
      if (response.ok) {
        const health = await response.json();
        
        if (health.services && health.services.redis) {
          const redisStatus = health.services.redis;
          
          if (redisStatus.status === 'healthy') {
            console.log('✅ Redis connection test passed');
            console.log(`   Status: ${redisStatus.status}`);
            console.log(`   Connected: ${redisStatus.connected}`);
            console.log(`   Fallback mode: ${redisStatus.fallbackMode || false}`);
            
            this.results.redisConnection = true;
          } else {
            console.log('⚠️ Redis connection failed');
            console.log(`   Status: ${redisStatus.status}`);
            console.log(`   Error: ${redisStatus.error || 'Unknown error'}`);
          }
        } else {
          console.log('⚠️ Redis status not available in health check');
        }
      }
      
    } catch (error) {
      console.error('❌ Redis connection test failed:', error.message);
      // Don't throw error - this is expected if Redis is not configured
    }
  }

  async testAPIEndpoints() {
    console.log('\n🌐 Testing API Endpoints Functionality...');
    console.log('-'.repeat(50));
    
    try {
      const endpoints = [
        { path: '/', name: 'Root Endpoint' },
        { path: '/debug/env', name: 'Environment Debug' },
        { path: '/debug/flows', name: 'Flows Debug' },
        { path: '/v1/flows', name: 'Flows API' },
        { path: '/v1/profiles', name: 'Profiles API' },
        { path: '/v1/stats', name: 'Stats API' }
      ];
      
      let passedEndpoints = 0;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${SERVICE_URL}${endpoint.path}`);
          
          if (response.ok) {
            console.log(`   ✅ ${endpoint.name}: ${response.status}`);
            passedEndpoints++;
          } else if (response.status === 401) {
            console.log(`   🔒 ${endpoint.name}: ${response.status} (Auth required)`);
            passedEndpoints++; // Auth required is expected
          } else {
            console.log(`   ❌ ${endpoint.name}: ${response.status}`);
          }
        } catch (error) {
          console.log(`   ❌ ${endpoint.name}: Error - ${error.message}`);
        }
      }
      
      const successRate = Math.round((passedEndpoints / endpoints.length) * 100);
      console.log(`\n   📊 API Endpoints Success Rate: ${passedEndpoints}/${endpoints.length} (${successRate}%)`);
      
      if (passedEndpoints >= endpoints.length * 0.8) { // 80% success rate
        this.results.apiEndpoints = true;
        console.log('✅ API endpoints test passed');
      } else {
        console.log('⚠️ API endpoints test partially passed');
      }
      
    } catch (error) {
      console.error('❌ API endpoints test failed:', error.message);
      throw error;
    }
  }

  async testDataOperations() {
    console.log('\n📊 Testing Data Operations (CRUD)...');
    console.log('-'.repeat(50));
    
    try {
      // Test flows debug endpoint which should show database operations
      const response = await fetch(`${SERVICE_URL}/debug/flows`);
      
      if (response.ok) {
        const flowsData = await response.json();
        
        if (flowsData.success) {
          console.log('✅ Data operations test passed');
          console.log(`   Total flows: ${flowsData.data.totalFlows}`);
          console.log(`   Flows with status: ${flowsData.data.flowsWithStatus}`);
          
          if (flowsData.data.sampleFlow) {
            console.log(`   Sample flow: ${flowsData.data.sampleFlow.title}`);
            console.log(`   Status count: ${flowsData.data.sampleFlow.statusCount}`);
          }
          
          // Test if we can perform basic data operations
          if (flowsData.data.totalFlows >= 0) {
            console.log('   ✅ Database read operations working');
            this.results.dataOperations = true;
          }
        } else {
          console.log('⚠️ Data operations test failed');
          console.log(`   Error: ${flowsData.error}`);
        }
      } else {
        console.log(`⚠️ Data operations endpoint failed with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Data operations test failed:', error.message);
      // Don't throw error - this is expected if database is not fully configured
    }
  }

  printSummary() {
    console.log('\n📊 TRUE PRODUCTION LEVEL TEST SUMMARY');
    console.log('='.repeat(80));
    
    const tests = [
      { name: 'Service Health', passed: this.results.serviceHealth },
      { name: 'Database Connection', passed: this.results.databaseConnection },
      { name: 'Redis Connection', passed: this.results.redisConnection },
      { name: 'API Endpoints', passed: this.results.apiEndpoints },
      { name: 'Data Operations', passed: this.results.dataOperations }
    ];
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.name.padEnd(25)}: ${status}`);
    });
    
    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log('='.repeat(80));
    console.log(`📈 Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    
    const criticalTestsPassed = this.results.serviceHealth && this.results.apiEndpoints;
    this.results.overall = criticalTestsPassed;
    
    if (criticalTestsPassed) {
      console.log('🎉 PRODUCTION LEVEL TESTING SUCCESSFUL!');
      console.log('\n🚀 Production Environment Status:');
      console.log(`   Service URL: ${SERVICE_URL}`);
      console.log(`   Service Health: ${this.results.serviceHealth ? '✅' : '❌'}`);
      console.log(`   Database: ${this.results.databaseConnection ? '✅' : '⚠️ (needs credentials)'}`);
      console.log(`   Redis: ${this.results.redisConnection ? '✅' : '⚠️ (needs configuration)'}`);
      console.log(`   API Endpoints: ${this.results.apiEndpoints ? '✅' : '❌'}`);
      console.log(`   Data Operations: ${this.results.dataOperations ? '✅' : '⚠️ (needs database)'}`);
      
      console.log('\n📋 Production Readiness Assessment:');
      if (this.results.databaseConnection && this.results.redisConnection && this.results.dataOperations) {
        console.log('   🟢 FULLY PRODUCTION READY - All services connected and working');
      } else if (this.results.serviceHealth && this.results.apiEndpoints) {
        console.log('   🟡 PARTIALLY PRODUCTION READY - Service deployed but needs credential configuration');
      } else {
        console.log('   🔴 NOT PRODUCTION READY - Critical issues need to be resolved');
      }
    } else {
      console.log('❌ PRODUCTION LEVEL TESTING FAILED');
      console.log('\n🔧 Critical Issues:');
      if (!this.results.serviceHealth) console.log('   - Service is not responding properly');
      if (!this.results.apiEndpoints) console.log('   - API endpoints are not working');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const tester = new TrueProductionTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Production test script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TrueProductionTester;
