#!/usr/bin/env node
/**
 * GCP Production Deployment Verification Script
 * Tests the deployed Cloud Run service with all endpoints
 */

const SERVICE_URL = 'https://flow-api-c57f3te5va-uc.a.run.app';

class DeploymentVerifier {
  constructor() {
    this.results = {
      health: false,
      root: false,
      env: false,
      dbInfo: false,
      flows: false,
      overall: false
    };
  }

  async runAllTests() {
    console.log('🚀 Starting GCP Production Deployment Verification');
    console.log('='.repeat(80));
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    console.log(`🌐 Service URL: ${SERVICE_URL}`);
    console.log('='.repeat(80));
    
    try {
      // Test 1: Health Check
      await this.testHealthCheck();
      
      // Test 2: Root Endpoint
      await this.testRootEndpoint();
      
      // Test 3: Environment Variables
      await this.testEnvironmentVariables();
      
      // Test 4: Database Info
      await this.testDatabaseInfo();
      
      // Test 5: Flows Debug Endpoint
      await this.testFlowsDebug();
      
      // Summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('\n🏥 Testing Health Check Endpoint...');
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(`${SERVICE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      const health = await response.json();
      
      console.log('✅ Health check passed');
      console.log(`   Status: ${health.status}`);
      console.log(`   Environment: ${health.environment}`);
      console.log(`   Uptime: ${health.uptime}s`);
      console.log(`   Version: ${health.version}`);
      
      if (health.services) {
        console.log('   Services status:');
        Object.entries(health.services).forEach(([service, status]) => {
          const serviceStatus = status.status === 'healthy' ? '✅' : '❌';
          console.log(`     ${service}: ${serviceStatus} ${status.status || 'unknown'}`);
        });
      }
      
      this.results.health = true;
      
    } catch (error) {
      console.error('❌ Health check test failed:', error.message);
      throw error;
    }
  }

  async testRootEndpoint() {
    console.log('\n🌐 Testing Root Endpoint...');
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(`${SERVICE_URL}/`);
      
      if (!response.ok) {
        throw new Error(`Root endpoint failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Root endpoint test passed');
      console.log(`   Message: ${data.message}`);
      console.log(`   Version: ${data.version}`);
      console.log(`   Docs: ${data.docs}`);
      
      this.results.root = true;
      
    } catch (error) {
      console.error('❌ Root endpoint test failed:', error.message);
      throw error;
    }
  }

  async testEnvironmentVariables() {
    console.log('\n🔧 Testing Environment Variables...');
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(`${SERVICE_URL}/debug/env`);
      
      if (!response.ok) {
        throw new Error(`Environment debug endpoint failed with status: ${response.status}`);
      }
      
      const env = await response.json();
      
      console.log('✅ Environment variables test passed');
      console.log(`   NODE_ENV: ${env.NODE_ENV}`);
      console.log(`   DB_HOST: ${env.DB_HOST}`);
      console.log(`   DB_PORT: ${env.DB_PORT}`);
      console.log(`   DB_NAME: ${env.DB_NAME}`);
      console.log(`   DB_USER: ${env.DB_USER}`);
      console.log(`   DB_SSL: ${env.DB_SSL}`);
      
      // Validate critical environment variables
      const required = ['NODE_ENV', 'DB_HOST', 'DB_NAME', 'DB_USER'];
      const missing = required.filter(key => !env[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      this.results.env = true;
      
    } catch (error) {
      console.error('❌ Environment variables test failed:', error.message);
      throw error;
    }
  }

  async testDatabaseInfo() {
    console.log('\n🗄️ Testing Database Connection...');
    console.log('-'.repeat(50));
    
    try {
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
          
          this.results.dbInfo = true;
        } else {
          console.log('⚠️ Database connection test failed');
          console.log(`   Error: ${dbInfo.error}`);
          console.log('   This may be due to missing database credentials');
        }
      } else {
        console.log(`⚠️ Database info endpoint returned status: ${response.status}`);
        console.log('   This may indicate a database connection issue');
      }
      
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      // Don't throw error for database tests as they may require proper secrets
    }
  }

  async testFlowsDebug() {
    console.log('\n📋 Testing Flows Debug Endpoint...');
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(`${SERVICE_URL}/debug/flows`);
      
      if (response.ok) {
        const flowsData = await response.json();
        
        if (flowsData.success) {
          console.log('✅ Flows debug test passed');
          console.log(`   Total flows: ${flowsData.data.totalFlows}`);
          console.log(`   Flows with status: ${flowsData.data.flowsWithStatus}`);
          
          if (flowsData.data.sampleFlow) {
            console.log(`   Sample flow: ${flowsData.data.sampleFlow.title}`);
            console.log(`   Status count: ${flowsData.data.sampleFlow.statusCount}`);
          }
          
          this.results.flows = true;
        } else {
          console.log('⚠️ Flows debug test failed');
          console.log(`   Error: ${flowsData.error}`);
        }
      } else {
        console.log(`⚠️ Flows debug endpoint returned status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Flows debug test failed:', error.message);
      // Don't throw error for flows tests as they may require database access
    }
  }

  printSummary() {
    console.log('\n📊 DEPLOYMENT VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    const tests = [
      { name: 'Health Check', passed: this.results.health },
      { name: 'Root Endpoint', passed: this.results.root },
      { name: 'Environment Variables', passed: this.results.env },
      { name: 'Database Connection', passed: this.results.dbInfo },
      { name: 'Flows Debug', passed: this.results.flows }
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
    
    const criticalTestsPassed = this.results.health && this.results.root && this.results.env;
    this.results.overall = criticalTestsPassed;
    
    if (criticalTestsPassed) {
      console.log('🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
      console.log('\n🚀 GCP Production Environment Status:');
      console.log(`   Service URL: ${SERVICE_URL}`);
      console.log(`   Health Check: ${this.results.health ? '✅' : '❌'}`);
      console.log(`   API Endpoints: ${this.results.root ? '✅' : '❌'}`);
      console.log(`   Environment: ${this.results.env ? '✅' : '❌'}`);
      console.log(`   Database: ${this.results.dbInfo ? '✅' : '⚠️ (may need secrets)'}`);
      console.log(`   Flows API: ${this.results.flows ? '✅' : '⚠️ (may need database)'}`);
      
      console.log('\n📋 Next Steps:');
      if (!this.results.dbInfo) {
        console.log('   - Verify database secrets are properly configured');
        console.log('   - Check Cloud SQL instance connectivity');
      }
      if (!this.results.flows) {
        console.log('   - Ensure database tables are created');
        console.log('   - Run database migrations if needed');
      }
    } else {
      console.log('❌ DEPLOYMENT VERIFICATION FAILED');
      console.log('\n🔧 Troubleshooting:');
      if (!this.results.health) console.log('   - Check Cloud Run service logs');
      if (!this.results.root) console.log('   - Verify service deployment');
      if (!this.results.env) console.log('   - Check environment variable configuration');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const verifier = new DeploymentVerifier();
  
  try {
    await verifier.runAllTests();
  } catch (error) {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DeploymentVerifier;
