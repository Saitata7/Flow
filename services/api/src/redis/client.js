const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // Handle connection events
      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected');
      });

      this.client.on('error', error => {
        this.isConnected = false;
        console.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('Redis connection closed');
      });

      // Connect
      await this.client.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
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
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
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
