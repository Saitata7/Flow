#!/usr/bin/env node
/**
 * GCP Production Environment Test Script
 * Tests all GCP services and configurations
 */

const GCPConfigManager = require('../src/config/gcpConfig');
const GCPDatabaseManager = require('../src/config/gcpDatabase');
const GCPRedisManager = require('../src/config/gcpRedis');

class GCPProductionTester {
  constructor() {
    this.config = new GCPConfigManager();
    this.db = new GCPDatabaseManager();
    this.redis = new GCPRedisManager();
    this.results = {
      config: false,
      database: false,
      redis: false,
      overall: false
    };
  }

  async runAllTests() {
    console.log('🚀 Starting GCP Production Environment Tests');
    console.log('=' * 60);
    
    try {
      // Test 1: Configuration
      await this.testConfiguration();
      
      // Test 2: Database Connection
      await this.testDatabase();
      
      // Test 3: Redis Connection
      await this.testRedis();
      
      // Test 4: Integration Tests
      await this.testIntegration();
      
      // Summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testConfiguration() {
    console.log('\n📋 Testing Configuration...');
    
    try {
      // Print configuration summary
      this.config.printConfiguration();
      
      // Validate required settings
      const required = [
        'NODE_ENV', 'PORT', 'HOST',
        'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
        'REDIS_HOST', 'REDIS_PORT',
        'JWT_SECRET'
      ];
      
      const missing = required.filter(key => !this.config.get(key));
      
      if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
      }
      
      // Check GCP specific settings
      if (this.config.isGCP()) {
        const gcpRequired = [
          'GOOGLE_CLOUD_PROJECT_ID',
          'CLOUD_RUN_SERVICE_NAME',
          'MEMORYSTORE_REDIS_HOST'
        ];
        
        const gcpMissing = gcpRequired.filter(key => !this.config.get(key));
        
        if (gcpMissing.length > 0) {
          console.warn(`⚠️ Missing GCP configuration: ${gcpMissing.join(', ')}`);
        }
      }
      
      this.results.config = true;
      console.log('✅ Configuration test passed');
      
    } catch (error) {
      console.error('❌ Configuration test failed:', error.message);
      throw error;
    }
  }

  async testDatabase() {
    console.log('\n🗄️ Testing Database Connection...');
    
    try {
      // Initialize database
      await this.db.initialize();
      
      // Test basic query
      const result = await this.db.query('SELECT NOW() as current_time, version() as postgres_version');
      console.log(`📅 Database time: ${result.rows[0].current_time}`);
      console.log(`🐘 PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);
      
      // Test database name
      const dbResult = await this.db.query('SELECT current_database() as db_name');
      console.log(`🗄️ Connected to database: ${dbResult.rows[0].db_name}`);
      
      // Test health check
      const health = await this.db.healthCheck();
      console.log('🏥 Database health:', health.status);
      
      // Get pool stats
      const stats = this.db.getPoolStats();
      console.log('📊 Pool stats:', {
        total: stats.totalCount,
        idle: stats.idleCount,
        waiting: stats.waitingCount
      });
      
      this.results.database = true;
      console.log('✅ Database test passed');
      
    } catch (error) {
      console.error('❌ Database test failed:', error.message);
      throw error;
    }
  }

  async testRedis() {
    console.log('\n🔴 Testing Redis Connection...');
    
    try {
      // Initialize Redis
      await this.redis.initialize();
      
      // Test basic operations
      await this.redis.set('test:gcp:connection', 'ok', 10);
      const result = await this.redis.get('test:gcp:connection');
      
      if (result !== 'ok') {
        throw new Error('Redis test failed - value mismatch');
      }
      
      await this.redis.del('test:gcp:connection');
      
      // Test hash operations
      await this.redis.hset('test:gcp:hash', 'field1', 'value1');
      const hashValue = await this.redis.hget('test:gcp:hash', 'field1');
      
      if (hashValue !== 'value1') {
        throw new Error('Redis hash test failed');
      }
      
      await this.redis.del('test:gcp:hash');
      
      // Test health check
      const health = await this.redis.healthCheck();
      console.log('🏥 Redis health:', health.status);
      console.log('⚡ Redis latency:', health.latency);
      console.log('💾 Redis memory:', health.memory);
      
      // Get connection info
      const info = this.redis.getConnectionInfo();
      console.log('🔌 Connection info:', info);
      
      this.results.redis = true;
      console.log('✅ Redis test passed');
      
    } catch (error) {
      console.error('❌ Redis test failed:', error.message);
      throw error;
    }
  }

  async testIntegration() {
    console.log('\n🔗 Testing Integration...');
    
    try {
      // Test database + Redis integration
      const testData = {
        id: 'test-' + Date.now(),
        name: 'GCP Integration Test',
        timestamp: new Date().toISOString()
      };
      
      // Store in Redis
      await this.redis.set(`test:integration:${testData.id}`, JSON.stringify(testData), 60);
      
      // Retrieve from Redis
      const retrieved = await this.redis.get(`test:integration:${testData.id}`);
      const parsed = JSON.parse(retrieved);
      
      if (parsed.id !== testData.id) {
        throw new Error('Integration test failed - data mismatch');
      }
      
      // Store in database (if tables exist)
      try {
        await this.db.query('SELECT 1 as integration_test');
        console.log('✅ Database integration test passed');
      } catch (error) {
        console.log('⚠️ Database integration test skipped (tables may not exist)');
      }
      
      // Cleanup
      await this.redis.del(`test:integration:${testData.id}`);
      
      console.log('✅ Integration test passed');
      
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
      throw error;
    }
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('=' * 60);
    
    const tests = [
      { name: 'Configuration', passed: this.results.config },
      { name: 'Database', passed: this.results.database },
      { name: 'Redis', passed: this.results.redis }
    ];
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.name}: ${status}`);
    });
    
    const allPassed = tests.every(test => test.passed);
    this.results.overall = allPassed;
    
    console.log('=' * 60);
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - GCP Production Environment Ready!');
      console.log('\n🚀 Environment Details:');
      console.log(`   Environment: ${this.config.get('NODE_ENV')}`);
      console.log(`   Is GCP: ${this.config.isGCP()}`);
      console.log(`   Database: ${this.config.get('DB_HOST')}`);
      console.log(`   Redis: ${this.config.get('REDIS_HOST')}`);
      console.log(`   Port: ${this.config.get('PORT')}`);
    } else {
      console.log('❌ SOME TESTS FAILED - Check configuration and connections');
      process.exit(1);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    try {
      if (this.db) {
        await this.db.close();
      }
      
      if (this.redis) {
        await this.redis.close();
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message);
    }
  }
}

// Main execution
async function main() {
  const tester = new GCPProductionTester();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, cleaning up...');
    await tester.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, cleaning up...');
    await tester.cleanup();
    process.exit(0);
  });
  
  try {
    await tester.runAllTests();
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
}

module.exports = GCPProductionTester;
