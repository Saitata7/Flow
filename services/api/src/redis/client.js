const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackMode = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  async connect() {
    try {
      // Check if Redis is enabled
      if (process.env.REDIS_ENABLED === 'false' || !process.env.REDIS_HOST) {
        console.log('⚠️ Redis disabled or not configured - running without cache');
        this.fallbackMode = true;
        return false;
      }

      // Redis configuration for both local and GCP environments
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      };

      console.log('🔴 Redis Config:', {
        host: redisConfig.host,
        port: redisConfig.port,
        isGCP: process.env.NODE_ENV === 'production' && process.env.REDIS_HOST && process.env.REDIS_HOST.includes('10.')
      });

      this.client = new Redis(redisConfig);

      // Handle connection events
      this.client.on('connect', () => {
        this.isConnected = true;
        this.fallbackMode = false;
        console.log('✅ Redis connected successfully');
      });

      this.client.on('error', error => {
        this.isConnected = false;
        console.warn('⚠️ Redis not connected (non-critical):', error.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('🔌 Redis connection closed');
      });

      // Connect with timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 5000))
      ]);
      
      return true;
    } catch (error) {
      console.warn('⚠️ Redis connection failed - running without cache:', error.message);
      this.fallbackMode = true;
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  async ping() {
    if (this.fallbackMode) {
      return false; // Redis is disabled
    }
    
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.warn('⚠️ Redis ping failed:', error.message);
      return false;
    }
  }

  // Cache operations
  async get(key) {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key, seconds) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`Redis expire error for key ${key}:`, error);
      return false;
    }
  }

  // Leaderboard operations
  async zadd(key, score, member) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error(`Redis zadd error for key ${key}:`, error);
      return false;
    }
  }

  async zrevrange(key, start, stop, withScores = false) {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const args = withScores ? [key, start, stop, 'WITHSCORES'] : [key, start, stop];
      return await this.client.zrevrange(...args);
    } catch (error) {
      console.error(`Redis zrevrange error for key ${key}:`, error);
      return [];
    }
  }

  async zrank(key, member) {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.zrank(key, member);
    } catch (error) {
      console.error(`Redis zrank error for key ${key}:`, error);
      return null;
    }
  }

  // Hash operations
  async hget(key, field) {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error(`Redis hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key, field, value) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error(`Redis hset error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hgetall(key) {
    if (!this.client || !this.isConnected) {
      return {};
    }

    try {
      return await this.client.hgetall(key);
    } catch (error) {
      console.error(`Redis hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // List operations
  async lpush(key, ...values) {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.lpush(key, ...values);
      return true;
    } catch (error) {
      console.error(`Redis lpush error for key ${key}:`, error);
      return false;
    }
  }

  async rpop(key) {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.rpop(key);
    } catch (error) {
      console.error(`Redis rpop error for key ${key}:`, error);
      return null;
    }
  }

  async llen(key) {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.llen(key);
    } catch (error) {
      console.error(`Redis llen error for key ${key}:`, error);
      return 0;
    }
  }
}

module.exports = { RedisClient };
