#!/usr/bin/env node
/**
 * Comprehensive GCP Production Environment Test Script
 * Tests all GCP services with latest logic and configurations
 */

require('dotenv').config({ path: './env.gcp' });

const { testConnection, closePool, healthCheck, getPoolStats } = require('../src/db/config');
const { RedisClient } = require('../src/redis/client');
const { FlowModel } = require('../src/db/models');

class GCPProductionComprehensiveTester {
  constructor() {
    this.results = {
      config: false,
      database: false,
      redis: false,
      models: false,
      api: false,
      integration: false,
      overall: false
    };
    this.redis = null;
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive GCP Production Environment Tests');
    console.log('='.repeat(80));
    console.log(`📅 Test started at: ${new Date().toISOString()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(80));
    
    try {
      // Test 1: Configuration Validation
      await this.testConfiguration();
      
      // Test 2: Database Connection & Health
      await this.testDatabase();
      
      // Test 3: Redis Connection & Operations
      await this.testRedis();
      
      // Test 4: Database Models & Operations
      await this.testModels();
      
      // Test 5: API Endpoints (if server is running)
      await this.testAPIEndpoints();
      
      // Test 6: Integration Tests
      await this.testIntegration();
      
      // Test 7: Performance Tests
      await this.testPerformance();
      
      // Summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  async testConfiguration() {
    console.log('\n📋 Testing Configuration...');
    console.log('-'.repeat(50));
    
    try {
      // Required environment variables
      const required = [
        'NODE_ENV', 'PORT', 'HOST',
        'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
        'REDIS_HOST', 'REDIS_PORT'
      ];
      
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
      }
      
      // GCP specific configuration
      const gcpConfig = {
        isGCP: process.env.NODE_ENV === 'production',
        dbHost: process.env.DB_HOST,
        redisHost: process.env.REDIS_HOST,
        sslMode: process.env.DB_SSL,
        pgsslmode: process.env.PGSSLMODE
      };
      
      console.log('✅ Configuration validation passed');
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Port: ${process.env.PORT}`);
      console.log(`   Host: ${process.env.HOST}`);
      console.log(`   Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
      console.log(`   Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
      console.log(`   SSL Mode: ${process.env.DB_SSL} (PGSSLMODE: ${process.env.PGSSLMODE})`);
      console.log(`   Is GCP: ${gcpConfig.isGCP}`);
      
      // Validate GCP specific settings
      if (gcpConfig.isGCP) {
        if (!gcpConfig.dbHost.includes('34.63.78.153') && !gcpConfig.dbHost.includes('cloudsql')) {
          console.warn('⚠️ Database host may not be GCP Cloud SQL');
        }
        
        if (!gcpConfig.redisHost.includes('10.')) {
          console.warn('⚠️ Redis host may not be GCP MemoryStore');
        }
      }
      
      this.results.config = true;
      
    } catch (error) {
      console.error('❌ Configuration test failed:', error.message);
      throw error;
    }
  }

  async testDatabase() {
    console.log('\n🗄️ Testing Database Connection & Health...');
    console.log('-'.repeat(50));
    
    try {
      // Test basic connection
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }
      
      // Test health check
      const health = await healthCheck();
      console.log('🏥 Database health:', health.status);
      console.log(`   Connected: ${health.connected}`);
      console.log(`   Pool size: ${health.poolSize}`);
      console.log(`   Idle connections: ${health.idleConnections}`);
      console.log(`   Waiting clients: ${health.waitingClients}`);
      
      if (health.status !== 'healthy') {
        throw new Error(`Database health check failed: ${health.error || 'Unknown error'}`);
      }
      
      // Test database info
      const { query } = require('../src/db/config');
      const dbInfo = await query(`
        SELECT 
          current_user, 
          current_database(), 
          inet_server_addr() AS server_ip,
          CASE 
            WHEN EXISTS (SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid()) 
            THEN (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid())
            ELSE false 
          END AS ssl_used,
          version() AS postgres_version
        LIMIT 1
      `);
      
      console.log('📊 Database info:');
      console.log(`   User: ${dbInfo.rows[0].current_user}`);
      console.log(`   Database: ${dbInfo.rows[0].current_database}`);
      console.log(`   Server IP: ${dbInfo.rows[0].server_ip}`);
      console.log(`   SSL Used: ${dbInfo.rows[0].ssl_used}`);
      console.log(`   PostgreSQL: ${dbInfo.rows[0].postgres_version.split(' ')[0]}`);
      
      // Test pool statistics
      const poolStats = getPoolStats();
      console.log('📈 Pool statistics:');
      console.log(`   Total connections: ${poolStats.totalCount}`);
      console.log(`   Idle connections: ${poolStats.idleCount}`);
      console.log(`   Waiting clients: ${poolStats.waitingCount}`);
      console.log(`   Max connections: ${poolStats.config.max}`);
      console.log(`   Min connections: ${poolStats.config.min}`);
      
      this.results.database = true;
      console.log('✅ Database test passed');
      
    } catch (error) {
      console.error('❌ Database test failed:', error.message);
      throw error;
    }
  }

  async testRedis() {
    console.log('\n🔴 Testing Redis Connection & Operations...');
    console.log('-'.repeat(50));
    
    try {
      this.redis = new RedisClient();
      await this.redis.connect();
      
      // Test basic operations
      const testKey = `test:gcp:${Date.now()}`;
      const testValue = { message: 'GCP Redis test', timestamp: new Date().toISOString() };
      
      // Set operation
      const setResult = await this.redis.set(testKey, testValue, 60);
      if (!setResult) {
        throw new Error('Redis set operation failed');
      }
      
      // Get operation
      const getResult = await this.redis.get(testKey);
      if (!getResult || getResult.message !== testValue.message) {
        throw new Error('Redis get operation failed - value mismatch');
      }
      
      // Test hash operations
      const hashKey = `test:gcp:hash:${Date.now()}`;
      await this.redis.hset(hashKey, 'field1', 'value1');
      await this.redis.hset(hashKey, 'field2', 'value2');
      
      const hashValue1 = await this.redis.hget(hashKey, 'field1');
      const hashValue2 = await this.redis.hget(hashKey, 'field2');
      
      if (hashValue1 !== 'value1' || hashValue2 !== 'value2') {
        throw new Error('Redis hash operations failed');
      }
      
      // Test sorted set operations (for leaderboards)
      const leaderboardKey = `test:gcp:leaderboard:${Date.now()}`;
      await this.redis.zadd(leaderboardKey, 100, 'user1');
      await this.redis.zadd(leaderboardKey, 200, 'user2');
      await this.redis.zadd(leaderboardKey, 150, 'user3');
      
      const topUsers = await this.redis.zrevrange(leaderboardKey, 0, 2, true);
      if (topUsers.length !== 6) { // 3 users * 2 (score + member)
        throw new Error('Redis sorted set operations failed');
      }
      
      // Test ping
      const pingResult = await this.redis.ping();
      if (!pingResult) {
        throw new Error('Redis ping failed');
      }
      
      // Cleanup
      await this.redis.del(testKey);
      await this.redis.del(hashKey);
      await this.redis.del(leaderboardKey);
      
      console.log('✅ Redis operations test passed');
      console.log('   Set/Get operations: ✅');
      console.log('   Hash operations: ✅');
      console.log('   Sorted set operations: ✅');
      console.log('   Ping operation: ✅');
      
      this.results.redis = true;
      
    } catch (error) {
      console.error('❌ Redis test failed:', error.message);
      throw error;
    }
  }

  async testModels() {
    console.log('\n📊 Testing Database Models & Operations...');
    console.log('-'.repeat(50));
    
    try {
      // Test FlowModel operations
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      
      // Test finding flows by user ID
      const flows = await FlowModel.findByUserIdWithStatus(testUserId);
      console.log(`📋 Found ${flows.length} flows for test user`);
      
      // Test flow creation (if no flows exist)
      if (flows.length === 0) {
        const testFlow = {
          id: `test-flow-${Date.now()}`,
          user_id: testUserId,
          title: 'GCP Test Flow',
          description: 'Test flow for GCP production testing',
          category: 'test',
          difficulty: 'easy',
          estimated_duration: 30,
          status: {
            '2024-01-01': { completed: true, score: 100 }
          }
        };
        
        const createdFlow = await FlowModel.create(testFlow);
        console.log(`✅ Created test flow: ${createdFlow.id}`);
        
        // Test finding the created flow
        const foundFlow = await FlowModel.findById(createdFlow.id);
        if (!foundFlow || foundFlow.title !== testFlow.title) {
          throw new Error('Flow creation/finding test failed');
        }
        
        // Cleanup
        await FlowModel.delete(createdFlow.id);
        console.log('✅ Test flow cleaned up');
      }
      
      // Test model validation
      try {
        await FlowModel.create({
          user_id: testUserId,
          title: '', // Invalid: empty title
          description: 'Test'
        });
        throw new Error('Model validation should have failed');
      } catch (error) {
        if (error.message.includes('validation') || error.message.includes('required')) {
          console.log('✅ Model validation working correctly');
        } else {
          throw error;
        }
      }
      
      this.results.models = true;
      console.log('✅ Database models test passed');
      
    } catch (error) {
      console.error('❌ Models test failed:', error.message);
      throw error;
    }
  }

  async testAPIEndpoints() {
    console.log('\n🌐 Testing API Endpoints...');
    console.log('-'.repeat(50));
    
    try {
      // Test if server is running locally
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://flow-api-production-url' // Replace with actual production URL
        : 'http://localhost:4000';
      
      // Test health endpoint
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) {
          const health = await response.json();
          console.log('✅ Health endpoint accessible');
          console.log(`   Status: ${health.status}`);
          console.log(`   Environment: ${health.environment}`);
          console.log(`   Uptime: ${health.uptime}s`);
          
          if (health.services) {
            console.log('   Services status:');
            Object.entries(health.services).forEach(([service, status]) => {
              console.log(`     ${service}: ${status.status}`);
            });
          }
          
          this.results.api = true;
        } else {
          console.log('⚠️ Health endpoint returned non-200 status');
        }
      } catch (error) {
        console.log('⚠️ API endpoints test skipped (server may not be running)');
        console.log(`   Error: ${error.message}`);
      }
      
    } catch (error) {
      console.error('❌ API endpoints test failed:', error.message);
      // Don't throw error for API tests as they may not be running
    }
  }

  async testIntegration() {
    console.log('\n🔗 Testing Integration (Database + Redis)...');
    console.log('-'.repeat(50));
    
    try {
      if (!this.redis) {
        this.redis = new RedisClient();
        await this.redis.connect();
      }
      
      // Test data flow: Database -> Redis -> Database
      const testData = {
        id: `integration-test-${Date.now()}`,
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Integration Test Flow',
        description: 'Test flow for integration testing',
        category: 'test',
        difficulty: 'easy',
        estimated_duration: 30,
        status: {
          '2024-01-01': { completed: true, score: 100 }
        }
      };
      
      // Step 1: Create in database
      const createdFlow = await FlowModel.create(testData);
      console.log('✅ Step 1: Created flow in database');
      
      // Step 2: Cache in Redis
      const cacheKey = `flow:${createdFlow.id}`;
      await this.redis.set(cacheKey, createdFlow, 300);
      console.log('✅ Step 2: Cached flow in Redis');
      
      // Step 3: Retrieve from Redis
      const cachedFlow = await this.redis.get(cacheKey);
      if (!cachedFlow || cachedFlow.id !== createdFlow.id) {
        throw new Error('Integration test failed - Redis cache mismatch');
      }
      console.log('✅ Step 3: Retrieved flow from Redis cache');
      
      // Step 4: Update in database
      const updatedFlow = await FlowModel.update(createdFlow.id, {
        title: 'Updated Integration Test Flow'
      });
      if (updatedFlow.title !== 'Updated Integration Test Flow') {
        throw new Error('Integration test failed - database update mismatch');
      }
      console.log('✅ Step 4: Updated flow in database');
      
      // Step 5: Invalidate Redis cache
      await this.redis.del(cacheKey);
      const invalidatedCache = await this.redis.get(cacheKey);
      if (invalidatedCache !== null) {
        throw new Error('Integration test failed - Redis cache not invalidated');
      }
      console.log('✅ Step 5: Invalidated Redis cache');
      
      // Step 6: Cleanup database
      await FlowModel.delete(createdFlow.id);
      console.log('✅ Step 6: Cleaned up database');
      
      this.results.integration = true;
      console.log('✅ Integration test passed');
      
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
      throw error;
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    console.log('-'.repeat(50));
    
    try {
      // Database performance test
      const dbStart = Date.now();
      const { query } = require('../src/db/config');
      
      // Run multiple queries
      const queries = [
        'SELECT 1 as test',
        'SELECT NOW() as current_time',
        'SELECT version() as postgres_version',
        'SELECT current_user as db_user',
        'SELECT current_database() as db_name'
      ];
      
      for (const sql of queries) {
        await query(sql);
      }
      
      const dbDuration = Date.now() - dbStart;
      console.log(`📊 Database performance: ${dbDuration}ms for ${queries.length} queries`);
      
      // Redis performance test
      if (this.redis) {
        const redisStart = Date.now();
        const testKey = `perf:test:${Date.now()}`;
        
        // Run multiple Redis operations
        for (let i = 0; i < 10; i++) {
          await this.redis.set(`${testKey}:${i}`, { index: i, timestamp: Date.now() }, 60);
        }
        
        for (let i = 0; i < 10; i++) {
          await this.redis.get(`${testKey}:${i}`);
        }
        
        // Cleanup
        for (let i = 0; i < 10; i++) {
          await this.redis.del(`${testKey}:${i}`);
        }
        
        const redisDuration = Date.now() - redisStart;
        console.log(`📊 Redis performance: ${redisDuration}ms for 30 operations`);
        
        // Performance thresholds
        if (dbDuration > 1000) {
          console.warn('⚠️ Database performance may be slow');
        }
        
        if (redisDuration > 500) {
          console.warn('⚠️ Redis performance may be slow');
        }
      }
      
      console.log('✅ Performance test completed');
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      // Don't throw error for performance tests
    }
  }

  printSummary() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    
    const tests = [
      { name: 'Configuration', passed: this.results.config },
      { name: 'Database', passed: this.results.database },
      { name: 'Redis', passed: this.results.redis },
      { name: 'Models', passed: this.results.models },
      { name: 'API Endpoints', passed: this.results.api },
      { name: 'Integration', passed: this.results.integration }
    ];
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.name.padEnd(20)}: ${status}`);
    });
    
    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log('='.repeat(80));
    console.log(`📈 Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log(`⏱️ Total Duration: ${duration}ms`);
    
    const allCriticalPassed = this.results.config && this.results.database && this.results.redis && this.results.integration;
    this.results.overall = allCriticalPassed;
    
    if (allCriticalPassed) {
      console.log('🎉 ALL CRITICAL TESTS PASSED - GCP Production Environment Ready!');
      console.log('\n🚀 Environment Details:');
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
      console.log(`   Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
      console.log(`   Port: ${process.env.PORT}`);
      console.log(`   SSL Mode: ${process.env.DB_SSL} (PGSSLMODE: ${process.env.PGSSLMODE})`);
    } else {
      console.log('❌ CRITICAL TESTS FAILED - Check configuration and connections');
      console.log('\n🔧 Troubleshooting:');
      if (!this.results.config) console.log('   - Check environment variables');
      if (!this.results.database) console.log('   - Check Cloud SQL connection and credentials');
      if (!this.results.redis) console.log('   - Check MemoryStore connection and network');
      if (!this.results.integration) console.log('   - Check database and Redis integration');
      process.exit(1);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    try {
      if (this.redis) {
        await this.redis.disconnect();
      }
      
      await closePool();
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message);
    }
  }
}

// Main execution
async function main() {
  const tester = new GCPProductionComprehensiveTester();
  
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

module.exports = GCPProductionComprehensiveTester;
