#!/usr/bin/env node
/**
 * Environment Test Script
 * Tests both local and production environments
 */

const { testConnection, closePool } = require('../src/db/config');
const { RedisClient } = require('../src/redis/client');

class EnvironmentTester {
  constructor() {
    this.results = {
      config: false,
      database: false,
      redis: false,
      overall: false
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Environment Tests');
    console.log('=' * 50);
    
    try {
      // Test 1: Configuration
      await this.testConfiguration();
      
      // Test 2: Database Connection
      await this.testDatabase();
      
      // Test 3: Redis Connection
      await this.testRedis();
      
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
      const required = [
        'NODE_ENV', 'PORT', 'HOST',
        'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
        'REDIS_HOST', 'REDIS_PORT'
      ];
      
      const missing = required.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
        console.log('Using default values for missing variables');
      }
      
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port: ${process.env.PORT || '4000'}`);
      console.log(`Host: ${process.env.HOST || '0.0.0.0'}`);
      console.log(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
      console.log(`Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
      
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
      const success = await testConnection();
      
      if (success) {
        console.log('✅ Database connection successful');
        this.results.database = true;
      } else {
        throw new Error('Database connection failed');
      }
      
    } catch (error) {
      console.error('❌ Database test failed:', error.message);
      throw error;
    }
  }

  async testRedis() {
    console.log('\n🔴 Testing Redis Connection...');
    
    try {
      const redis = new RedisClient();
      await redis.connect();
      
      // Test basic operations
      await redis.set('test:connection', 'ok', 10);
      const result = await redis.get('test:connection');
      
      if (result !== 'ok') {
        throw new Error('Redis test failed - value mismatch');
      }
      
      await redis.del('test:connection');
      await redis.disconnect();
      
      console.log('✅ Redis connection successful');
      this.results.redis = true;
      
    } catch (error) {
      console.error('❌ Redis test failed:', error.message);
      throw error;
    }
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('=' * 50);
    
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
    
    console.log('=' * 50);
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - Environment Ready!');
      console.log('\n🚀 Environment Details:');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Database: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`   Redis: ${process.env.REDIS_HOST || 'localhost'}`);
      console.log(`   Port: ${process.env.PORT || '4000'}`);
    } else {
      console.log('❌ SOME TESTS FAILED - Check configuration and connections');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const tester = new EnvironmentTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EnvironmentTester;
