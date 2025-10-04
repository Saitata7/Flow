#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests connection to GCP MemoryStore Redis instance
 */

const Redis = require('ioredis');
require('dotenv').config({ path: '../env.production' });

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

async function testRedisConnection() {
  console.log('🔗 Testing Redis Connection to GCP MemoryStore...');
  console.log(`📍 Host: ${REDIS_CONFIG.host}`);
  console.log(`📍 Port: ${REDIS_CONFIG.port}`);
  console.log(`📍 DB: ${REDIS_CONFIG.db}`);
  console.log('');

  const redis = new Redis(REDIS_CONFIG);

  try {
    // Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const pong = await redis.ping();
    console.log(`✅ Ping response: ${pong}`);

    // Test basic operations
    console.log('2️⃣ Testing basic operations...');
    
    // Set a test key
    await redis.set('test:connection', 'Hello GCP Redis!', 'EX', 60);
    console.log('✅ Set test key');

    // Get the test key
    const value = await redis.get('test:connection');
    console.log(`✅ Get test key: ${value}`);

    // Test hash operations
    console.log('3️⃣ Testing hash operations...');
    await redis.hset('test:hash', 'field1', 'value1', 'field2', 'value2');
    const hashValue = await redis.hget('test:hash', 'field1');
    console.log(`✅ Hash operation: ${hashValue}`);

    // Test list operations
    console.log('4️⃣ Testing list operations...');
    await redis.lpush('test:list', 'item1', 'item2', 'item3');
    const listLength = await redis.llen('test:list');
    console.log(`✅ List operation: length = ${listLength}`);

    // Test sorted set operations (for leaderboards)
    console.log('5️⃣ Testing sorted set operations...');
    await redis.zadd('test:leaderboard', 100, 'user1', 200, 'user2', 150, 'user3');
    const topUsers = await redis.zrevrange('test:leaderboard', 0, 2, 'WITHSCORES');
    console.log(`✅ Sorted set operation: ${topUsers}`);

    // Test expiration
    console.log('6️⃣ Testing expiration...');
    await redis.expire('test:connection', 1);
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait 1.1 seconds
    const expiredValue = await redis.get('test:connection');
    console.log(`✅ Expiration test: ${expiredValue === null ? 'Key expired' : 'Key still exists'}`);

    // Clean up test keys
    console.log('7️⃣ Cleaning up test keys...');
    await redis.del('test:connection', 'test:hash', 'test:list', 'test:leaderboard');
    console.log('✅ Cleanup completed');

    console.log('');
    console.log('🎉 All Redis tests passed! GCP MemoryStore Redis is working correctly.');
    
    return true;

  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    console.error('Error details:', error);
    return false;
  } finally {
    await redis.quit();
    console.log('🔌 Redis connection closed');
  }
}

// Run the test
testRedisConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
