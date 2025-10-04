const Redis = require('ioredis');
const { query } = require('../db/config');

/**
 * Enhanced Redis Client with Database Fallback
 * Provides seamless fallback to PostgreSQL when Redis is unavailable
 */
class EnhancedRedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackMode = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.reconnectDelay = 5000; // 5 seconds
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
    
    this.config = {
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
      enableReadyCheck: true,
      enableOfflineQueue: false,
    };
  }

  /**
   * Initialize Redis connection with automatic fallback
   */
  async connect() {
    try {
      console.log('🔗 Attempting Redis connection...');
      this.client = new Redis(this.config);

      // Handle connection events
      this.client.on('connect', () => {
        this.isConnected = true;
        this.fallbackMode = false;
        this.connectionAttempts = 0;
        console.log('✅ Redis connected successfully');
        this.startHealthCheck();
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        console.error('❌ Redis connection error:', error.message);
        this.handleConnectionError(error);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('🔌 Redis connection closed');
        this.handleConnectionError(new Error('Connection closed'));
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      // Connect
      await this.client.connect();
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.handleConnectionError(error);
      return false;
    }
  }

  /**
   * Handle connection errors and enable fallback mode
   */
  handleConnectionError(error) {
    this.connectionAttempts++;
    
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.log('🔄 Max connection attempts reached. Enabling database fallback mode.');
      this.fallbackMode = true;
      this.stopHealthCheck();
    } else {
      console.log(`🔄 Retrying Redis connection in ${this.reconnectDelay}ms (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
      setTimeout(() => {
        this.reconnect();
      }, this.reconnectDelay);
    }
  }

  /**
   * Attempt to reconnect to Redis
   */
  async reconnect() {
    try {
      if (this.client) {
        await this.client.quit();
      }
      await this.connect();
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message);
    }
  }

  /**
   * Start health check timer
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.healthCheck();
    }, this.healthCheckInterval);
  }

  /**
   * Stop health check timer
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Perform health check
   */
  async healthCheck() {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      if (result === 'PONG') {
        return true;
      }
    } catch (error) {
      console.error('❌ Redis health check failed:', error.message);
      this.handleConnectionError(error);
    }
    return false;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    this.stopHealthCheck();
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    this.isConnected = false;
    this.fallbackMode = false;
  }

  /**
   * Get value with database fallback
   */
  async get(key) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error(`❌ Redis get error for key ${key}:`, error.message);
        return await this.getFromDatabase(key);
      }
    }
    return await this.getFromDatabase(key);
  }

  /**
   * Set value with database fallback
   */
  async set(key, value, ttlSeconds = 3600) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        const serialized = JSON.stringify(value);
        await this.client.setex(key, ttlSeconds, serialized);
        return true;
      } catch (error) {
        console.error(`❌ Redis set error for key ${key}:`, error.message);
        return await this.setInDatabase(key, value, ttlSeconds);
      }
    }
    return await this.setInDatabase(key, value, ttlSeconds);
  }

  /**
   * Delete key with database fallback
   */
  async del(key) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        await this.client.del(key);
        return true;
      } catch (error) {
        console.error(`❌ Redis del error for key ${key}:`, error.message);
        return await this.delFromDatabase(key);
      }
    }
    return await this.delFromDatabase(key);
  }

  /**
   * Check if key exists with database fallback
   */
  async exists(key) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        const result = await this.client.exists(key);
        return result === 1;
      } catch (error) {
        console.error(`❌ Redis exists error for key ${key}:`, error.message);
        return await this.existsInDatabase(key);
      }
    }
    return await this.existsInDatabase(key);
  }

  /**
   * Set expiration with database fallback
   */
  async expire(key, seconds) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        await this.client.expire(key, seconds);
        return true;
      } catch (error) {
        console.error(`❌ Redis expire error for key ${key}:`, error.message);
        return await this.expireInDatabase(key, seconds);
      }
    }
    return await this.expireInDatabase(key, seconds);
  }

  /**
   * Sorted set operations for leaderboards
   */
  async zadd(key, score, member) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        await this.client.zadd(key, score, member);
        return true;
      } catch (error) {
        console.error(`❌ Redis zadd error for key ${key}:`, error.message);
        return await this.zaddInDatabase(key, score, member);
      }
    }
    return await this.zaddInDatabase(key, score, member);
  }

  async zrevrange(key, start, stop, withScores = false) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        const args = withScores ? [key, start, stop, 'WITHSCORES'] : [key, start, stop];
        return await this.client.zrevrange(...args);
      } catch (error) {
        console.error(`❌ Redis zrevrange error for key ${key}:`, error.message);
        return await this.zrevrangeFromDatabase(key, start, stop, withScores);
      }
    }
    return await this.zrevrangeFromDatabase(key, start, stop, withScores);
  }

  async zrank(key, member) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        return await this.client.zrank(key, member);
      } catch (error) {
        console.error(`❌ Redis zrank error for key ${key}:`, error.message);
        return await this.zrankFromDatabase(key, member);
      }
    }
    return await this.zrankFromDatabase(key, member);
  }

  /**
   * Hash operations
   */
  async hget(key, field) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        return await this.client.hget(key, field);
      } catch (error) {
        console.error(`❌ Redis hget error for key ${key}, field ${field}:`, error.message);
        return await this.hgetFromDatabase(key, field);
      }
    }
    return await this.hgetFromDatabase(key, field);
  }

  async hset(key, field, value) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        await this.client.hset(key, field, value);
        return true;
      } catch (error) {
        console.error(`❌ Redis hset error for key ${key}, field ${field}:`, error.message);
        return await this.hsetInDatabase(key, field, value);
      }
    }
    return await this.hsetInDatabase(key, field, value);
  }

  async hgetall(key) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        return await this.client.hgetall(key);
      } catch (error) {
        console.error(`❌ Redis hgetall error for key ${key}:`, error.message);
        return await this.hgetallFromDatabase(key);
      }
    }
    return await this.hgetallFromDatabase(key);
  }

  /**
   * List operations
   */
  async lpush(key, ...values) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        await this.client.lpush(key, ...values);
        return true;
      } catch (error) {
        console.error(`❌ Redis lpush error for key ${key}:`, error.message);
        return await this.lpushInDatabase(key, ...values);
      }
    }
    return await this.lpushInDatabase(key, ...values);
  }

  async rpop(key) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        return await this.client.rpop(key);
      } catch (error) {
        console.error(`❌ Redis rpop error for key ${key}:`, error.message);
        return await this.rpopFromDatabase(key);
      }
    }
    return await this.rpopFromDatabase(key);
  }

  async llen(key) {
    if (this.isConnected && !this.fallbackMode) {
      try {
        return await this.client.llen(key);
      } catch (error) {
        console.error(`❌ Redis llen error for key ${key}:`, error.message);
        return await this.llenFromDatabase(key);
      }
    }
    return await this.llenFromDatabase(key);
  }

  /**
   * Database fallback methods
   */
  async getFromDatabase(key) {
    try {
      const result = await query(
        'SELECT value, expires_at FROM cache_store WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())',
        [key]
      );
      return result.rows.length > 0 ? JSON.parse(result.rows[0].value) : null;
    } catch (error) {
      console.error(`❌ Database get error for key ${key}:`, error.message);
      return null;
    }
  }

  async setInDatabase(key, value, ttlSeconds) {
    try {
      const expiresAt = ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null;
      await query(
        'INSERT INTO cache_store (key, value, expires_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = $3',
        [key, JSON.stringify(value), expiresAt]
      );
      return true;
    } catch (error) {
      console.error(`❌ Database set error for key ${key}:`, error.message);
      return false;
    }
  }

  async delFromDatabase(key) {
    try {
      await query('DELETE FROM cache_store WHERE key = $1', [key]);
      return true;
    } catch (error) {
      console.error(`❌ Database del error for key ${key}:`, error.message);
      return false;
    }
  }

  async existsInDatabase(key) {
    try {
      const result = await query(
        'SELECT 1 FROM cache_store WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())',
        [key]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error(`❌ Database exists error for key ${key}:`, error.message);
      return false;
    }
  }

  async expireInDatabase(key, seconds) {
    try {
      const expiresAt = new Date(Date.now() + seconds * 1000);
      await query(
        'UPDATE cache_store SET expires_at = $2 WHERE key = $1',
        [key, expiresAt]
      );
      return true;
    } catch (error) {
      console.error(`❌ Database expire error for key ${key}:`, error.message);
      return false;
    }
  }

  // Database fallback methods for sorted sets (simplified implementations)
  async zaddInDatabase(key, score, member) {
    try {
      await query(
        'INSERT INTO cache_sorted_set (key, member, score) VALUES ($1, $2, $3) ON CONFLICT (key, member) DO UPDATE SET score = $3',
        [key, member, score]
      );
      return true;
    } catch (error) {
      console.error(`❌ Database zadd error for key ${key}:`, error.message);
      return false;
    }
  }

  async zrevrangeFromDatabase(key, start, stop, withScores) {
    try {
      const result = await query(
        'SELECT member, score FROM cache_sorted_set WHERE key = $1 ORDER BY score DESC LIMIT $2 OFFSET $3',
        [key, stop - start + 1, start]
      );
      
      if (withScores) {
        const flat = [];
        result.rows.forEach(row => {
          flat.push(row.member, row.score.toString());
        });
        return flat;
      }
      return result.rows.map(row => row.member);
    } catch (error) {
      console.error(`❌ Database zrevrange error for key ${key}:`, error.message);
      return [];
    }
  }

  async zrankFromDatabase(key, member) {
    try {
      const result = await query(
        'SELECT COUNT(*) as rank FROM cache_sorted_set WHERE key = $1 AND score > (SELECT score FROM cache_sorted_set WHERE key = $1 AND member = $2)',
        [key, member]
      );
      return parseInt(result.rows[0].rank);
    } catch (error) {
      console.error(`❌ Database zrank error for key ${key}:`, error.message);
      return null;
    }
  }

  // Database fallback methods for hashes
  async hgetFromDatabase(key, field) {
    try {
      const result = await query(
        'SELECT value FROM cache_hash WHERE key = $1 AND field = $2',
        [key, field]
      );
      return result.rows.length > 0 ? result.rows[0].value : null;
    } catch (error) {
      console.error(`❌ Database hget error for key ${key}, field ${field}:`, error.message);
      return null;
    }
  }

  async hsetInDatabase(key, field, value) {
    try {
      await query(
        'INSERT INTO cache_hash (key, field, value) VALUES ($1, $2, $3) ON CONFLICT (key, field) DO UPDATE SET value = $3',
        [key, field, value]
      );
      return true;
    } catch (error) {
      console.error(`❌ Database hset error for key ${key}, field ${field}:`, error.message);
      return false;
    }
  }

  async hgetallFromDatabase(key) {
    try {
      const result = await query(
        'SELECT field, value FROM cache_hash WHERE key = $1',
        [key]
      );
      const hash = {};
      result.rows.forEach(row => {
        hash[row.field] = row.value;
      });
      return hash;
    } catch (error) {
      console.error(`❌ Database hgetall error for key ${key}:`, error.message);
      return {};
    }
  }

  // Database fallback methods for lists
  async lpushInDatabase(key, ...values) {
    try {
      for (const value of values) {
        await query(
          'INSERT INTO cache_list (key, value, position) VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1 FROM cache_list WHERE key = $1))',
          [key, value]
        );
      }
      return true;
    } catch (error) {
      console.error(`❌ Database lpush error for key ${key}:`, error.message);
      return false;
    }
  }

  async rpopFromDatabase(key) {
    try {
      const result = await query(
        'DELETE FROM cache_list WHERE key = $1 AND position = (SELECT MAX(position) FROM cache_list WHERE key = $1) RETURNING value',
        [key]
      );
      return result.rows.length > 0 ? result.rows[0].value : null;
    } catch (error) {
      console.error(`❌ Database rpop error for key ${key}:`, error.message);
      return null;
    }
  }

  async llenFromDatabase(key) {
    try {
      const result = await query(
        'SELECT COUNT(*) as length FROM cache_list WHERE key = $1',
        [key]
      );
      return parseInt(result.rows[0].length);
    } catch (error) {
      console.error(`❌ Database llen error for key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      fallbackMode: this.fallbackMode,
      connectionAttempts: this.connectionAttempts,
      host: this.config.host,
      port: this.config.port,
    };
  }

  /**
   * Ping Redis
   */
  async ping() {
    if (this.isConnected && !this.fallbackMode) {
      try {
        const result = await this.client.ping();
        return result === 'PONG';
      } catch (error) {
        console.error('❌ Redis ping failed:', error.message);
        return false;
      }
    }
    return false;
  }
}

module.exports = { EnhancedRedisClient };
