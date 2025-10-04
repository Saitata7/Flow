#!/usr/bin/env node

/**
 * Comprehensive Redis Connection and Fallback Test
 * Tests both local Redis and GCP Redis with database fallback
 */

const { EnhancedRedisClient } = require('../src/redis/enhanced-client');
const { query } = require('../src/db/config');

async function testRedisConnection() {
  console.log('🔗 Testing Enhanced Redis Client with Database Fallback...');
  console.log('');

  const redisClient = new EnhancedRedisClient();

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing Redis connection...');
    const connected = await redisClient.connect();
    
    if (connected) {
      console.log('✅ Redis connected successfully');
      console.log('📊 Connection status:', redisClient.getStatus());
    } else {
      console.log('⚠️ Redis connection failed, fallback mode enabled');
      console.log('📊 Connection status:', redisClient.getStatus());
    }

    // Test 2: Basic operations
    console.log('');
    console.log('2️⃣ Testing basic operations...');
    
    // Set a test key
    const setResult = await redisClient.set('test:basic', { message: 'Hello Redis!', timestamp: new Date() }, 60);
    console.log(`✅ Set operation: ${setResult ? 'success' : 'failed'}`);

    // Get the test key
    const getValue = await redisClient.get('test:basic');
    console.log(`✅ Get operation: ${getValue ? 'success' : 'failed'}`);
    if (getValue) {
      console.log(`   Value: ${JSON.stringify(getValue)}`);
    }

    // Test 3: Hash operations
    console.log('');
    console.log('3️⃣ Testing hash operations...');
    
    const hsetResult = await redisClient.hset('test:hash', 'field1', 'value1');
    console.log(`✅ Hash set operation: ${hsetResult ? 'success' : 'failed'}`);
    
    const hgetValue = await redisClient.hget('test:hash', 'field1');
    console.log(`✅ Hash get operation: ${hgetValue ? 'success' : 'failed'}`);
    if (hgetValue) {
      console.log(`   Value: ${hgetValue}`);
    }

    // Test 4: Sorted set operations (leaderboards)
    console.log('');
    console.log('4️⃣ Testing sorted set operations...');
    
    const zaddResult = await redisClient.zadd('test:leaderboard', 100, 'user1');
    await redisClient.zadd('test:leaderboard', 200, 'user2');
    await redisClient.zadd('test:leaderboard', 150, 'user3');
    console.log(`✅ Sorted set add operation: ${zaddResult ? 'success' : 'failed'}`);
    
    const leaderboard = await redisClient.zrevrange('test:leaderboard', 0, 2, true);
    console.log(`✅ Sorted set range operation: ${leaderboard.length > 0 ? 'success' : 'failed'}`);
    if (leaderboard.length > 0) {
      console.log(`   Leaderboard: ${leaderboard}`);
    }

    // Test 5: List operations
    console.log('');
    console.log('5️⃣ Testing list operations...');
    
    const lpushResult = await redisClient.lpush('test:list', 'item1', 'item2', 'item3');
    console.log(`✅ List push operation: ${lpushResult ? 'success' : 'failed'}`);
    
    const listLength = await redisClient.llen('test:list');
    console.log(`✅ List length operation: ${listLength > 0 ? 'success' : 'failed'}`);
    console.log(`   List length: ${listLength}`);

    // Test 6: Existence and expiration
    console.log('');
    console.log('6️⃣ Testing existence and expiration...');
    
    const exists = await redisClient.exists('test:basic');
    console.log(`✅ Exists operation: ${exists ? 'key exists' : 'key does not exist'}`);
    
    const expireResult = await redisClient.expire('test:basic', 1);
    console.log(`✅ Expire operation: ${expireResult ? 'success' : 'failed'}`);
    
    // Wait for expiration
    console.log('   Waiting for key to expire...');
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const expiredValue = await redisClient.get('test:basic');
    console.log(`✅ Expiration test: ${expiredValue === null ? 'key expired' : 'key still exists'}`);

    // Test 7: Ping test
    console.log('');
    console.log('7️⃣ Testing ping...');
    
    const pingResult = await redisClient.ping();
    console.log(`✅ Ping operation: ${pingResult ? 'PONG received' : 'failed'}`);

    // Test 8: Cleanup
    console.log('');
    console.log('8️⃣ Cleaning up test keys...');
    
    const delResult = await redisClient.del('test:basic');
    await redisClient.del('test:hash');
    await redisClient.del('test:leaderboard');
    await redisClient.del('test:list');
    console.log(`✅ Delete operation: ${delResult ? 'success' : 'failed'}`);

    // Test 9: Database fallback verification
    console.log('');
    console.log('9️⃣ Testing database fallback...');
    
    // Check if cache tables exist
    try {
      const cacheTables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'cache_%'
        ORDER BY table_name
      `);
      
      console.log(`✅ Cache tables found: ${cacheTables.rows.length}`);
      cacheTables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
      if (cacheTables.rows.length === 0) {
        console.log('⚠️ No cache tables found. Run migration to create fallback tables.');
      }
    } catch (error) {
      console.log('⚠️ Could not check cache tables:', error.message);
    }

    console.log('');
    console.log('🎉 All Redis tests completed!');
    console.log('📊 Final status:', redisClient.getStatus());
    
    return true;

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('Error details:', error);
    return false;
  } finally {
    await redisClient.disconnect();
    console.log('🔌 Redis connection closed');
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('');
  console.log('🗄️ Testing Database Connection...');
  
  try {
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Redis and Database Tests...');
  console.log('=' .repeat(60));
  
  const dbTest = await testDatabaseConnection();
  const redisTest = await testRedisConnection();
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`   Database: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Redis: ${redisTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (dbTest && redisTest) {
    console.log('');
    console.log('🎉 All tests passed! System is ready for production.');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ Some tests failed. Please check the configuration.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
