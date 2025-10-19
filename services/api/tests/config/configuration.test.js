/**
 * Configuration Tests for API Service
 * Tests environment variables, database connections, and service configurations
 */

const path = require('path');
const fs = require('fs');

// Mock external dependencies
jest.mock('pg');
jest.mock('ioredis');
jest.mock('firebase-admin');
jest.mock('dotenv');

describe('⚙️ API Configuration Tests', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('🌍 Environment Configuration', () => {
    it('should load all required environment variables', () => {
      const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'REDIS_HOST',
        'REDIS_PORT',
        'JWT_SECRET',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL'
      ];

      // Set test environment variables
      requiredEnvVars.forEach(envVar => {
        process.env[envVar] = `test-${envVar.toLowerCase()}`;
      });

      const config = require('../../src/config/environment');

      requiredEnvVars.forEach(envVar => {
        expect(config[envVar]).toBeDefined();
        expect(config[envVar]).toBe(`test-${envVar.toLowerCase()}`);
      });
    });

    it('should use default values for optional environment variables', () => {
      const config = require('../../src/config/environment');

      expect(config.PORT).toBe(3000);
      expect(config.NODE_ENV).toBe('development');
      expect(config.DB_PORT).toBe(5432);
      expect(config.REDIS_PORT).toBe(6379);
    });

    it('should validate environment variable formats', () => {
      // Test valid email format
      process.env.ADMIN_EMAIL = 'admin@example.com';
      const config = require('../../src/config/environment');
      expect(config.ADMIN_EMAIL).toBe('admin@example.com');

      // Test invalid email format
      process.env.ADMIN_EMAIL = 'invalid-email';
      expect(() => {
        const config = require('../../src/config/environment');
        config.validateEmail(config.ADMIN_EMAIL);
      }).toThrow('Invalid email format');
    });

    it('should handle missing critical environment variables', () => {
      delete process.env.JWT_SECRET;
      delete process.env.DB_PASSWORD;

      expect(() => {
        require('../../src/config/environment');
      }).toThrow('Missing required environment variable: JWT_SECRET');
    });

    it('should validate database connection parameters', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'flow_test';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';

      const config = require('../../src/config/environment');
      const dbConfig = config.getDatabaseConfig();

      expect(dbConfig.host).toBe('localhost');
      expect(dbConfig.port).toBe(5432);
      expect(dbConfig.database).toBe('flow_test');
      expect(dbConfig.user).toBe('test_user');
      expect(dbConfig.password).toBe('test_password');
    });

    it('should validate Redis connection parameters', () => {
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      process.env.REDIS_PASSWORD = 'redis_password';

      const config = require('../../src/config/environment');
      const redisConfig = config.getRedisConfig();

      expect(redisConfig.host).toBe('localhost');
      expect(redisConfig.port).toBe(6379);
      expect(redisConfig.password).toBe('redis_password');
    });
  });

  describe('🗄️ Database Configuration', () => {
    it('should create database connection pool with correct settings', () => {
      const { Pool } = require('pg');
      const mockPool = {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      Pool.mockImplementation(() => mockPool);

      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'flow_test';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';

      const dbConfig = require('../../src/db/config');

      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'flow_test',
        user: 'test_user',
        password: 'test_password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: false
      });
    });

    it('should handle database connection errors', async () => {
      const { Pool } = require('pg');
      const mockPool = {
        query: jest.fn().mockRejectedValue(new Error('Connection failed')),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      Pool.mockImplementation(() => mockPool);

      const dbConfig = require('../../src/db/config');

      const result = await dbConfig.testConnection();
      expect(result).toBe(false);
    });

    it('should configure SSL for production database', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_SSL = 'true';

      const { Pool } = require('pg');
      const mockPool = {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
      };
      Pool.mockImplementation(() => mockPool);

      const dbConfig = require('../../src/db/config');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: true
        })
      );
    });

    it('should handle connection pool exhaustion', async () => {
      const { Pool } = require('pg');
      const mockPool = {
        query: jest.fn().mockRejectedValue(new Error('Connection pool exhausted')),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        totalCount: 20,
        idleCount: 0,
        waitingCount: 5
      };
      Pool.mockImplementation(() => mockPool);

      const dbConfig = require('../../src/db/config');

      await expect(dbConfig.query('SELECT 1')).rejects.toThrow('Connection pool exhausted');
    });
  });

  describe('🔴 Redis Configuration', () => {
    it('should create Redis client with correct settings', () => {
      const Redis = require('ioredis');
      const mockRedis = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        on: jest.fn()
      };
      Redis.mockImplementation(() => mockRedis);

      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';
      process.env.REDIS_PASSWORD = 'redis_password';

      const redisConfig = require('../../src/redis/client');

      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        password: 'redis_password',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
    });

    it('should handle Redis connection failures', async () => {
      const Redis = require('ioredis');
      const mockRedis = {
        connect: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        on: jest.fn()
      };
      Redis.mockImplementation(() => mockRedis);

      const redisConfig = require('../../src/redis/client');

      await expect(redisConfig.connect()).rejects.toThrow('Redis connection failed');
    });

    it('should configure Redis clustering for production', () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_CLUSTER = 'true';
      process.env.REDIS_NODES = 'redis1:6379,redis2:6379,redis3:6379';

      const Redis = require('ioredis');
      const mockRedis = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        on: jest.fn()
      };
      Redis.mockImplementation(() => mockRedis);

      const redisConfig = require('../../src/redis/client');

      expect(Redis).toHaveBeenCalledWith(
        expect.objectContaining({
          cluster: true,
          nodes: ['redis1:6379', 'redis2:6379', 'redis3:6379']
        })
      );
    });
  });

  describe('🔥 Firebase Configuration', () => {
    it('should initialize Firebase Admin SDK with correct credentials', () => {
      const admin = require('firebase-admin');
      const mockApp = {
        auth: jest.fn(),
        firestore: jest.fn(),
        storage: jest.fn()
      };
      admin.initializeApp.mockReturnValue(mockApp);

      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';

      const firebaseConfig = require('../../src/config/firebase');

      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: admin.credential.cert({
          projectId: 'test-project',
          privateKey: 'test-private-key',
          clientEmail: 'test@example.com'
        }),
        projectId: 'test-project'
      });
    });

    it('should handle Firebase initialization errors', () => {
      const admin = require('firebase-admin');
      admin.initializeApp.mockImplementation(() => {
        throw new Error('Firebase initialization failed');
      });

      process.env.FIREBASE_PROJECT_ID = 'invalid-project';

      expect(() => {
        require('../../src/config/firebase');
      }).toThrow('Firebase initialization failed');
    });

    it('should validate Firebase service account key format', () => {
      process.env.FIREBASE_PRIVATE_KEY = 'invalid-key-format';

      expect(() => {
        const firebaseConfig = require('../../src/config/firebase');
        firebaseConfig.validateServiceAccountKey();
      }).toThrow('Invalid Firebase private key format');
    });
  });

  describe('🔐 Security Configuration', () => {
    it('should validate JWT secret strength', () => {
      process.env.JWT_SECRET = 'weak';

      expect(() => {
        const config = require('../../src/config/environment');
        config.validateJWTSecurity();
      }).toThrow('JWT secret must be at least 32 characters long');
    });

    it('should configure CORS properly', () => {
      process.env.CORS_ORIGINS = 'https://flowapp.com,https://app.flow.com';
      process.env.NODE_ENV = 'production';

      const config = require('../../src/config/environment');
      const corsConfig = config.getCORSConfig();

      expect(corsConfig.origin).toEqual(['https://flowapp.com', 'https://app.flow.com']);
      expect(corsConfig.credentials).toBe(true);
    });

    it('should configure rate limiting', () => {
      process.env.RATE_LIMIT_MAX = '100';
      process.env.RATE_LIMIT_WINDOW = '900000'; // 15 minutes

      const config = require('../../src/config/environment');
      const rateLimitConfig = config.getRateLimitConfig();

      expect(rateLimitConfig.max).toBe(100);
      expect(rateLimitConfig.timeWindow).toBe(900000);
    });

    it('should configure security headers', () => {
      const config = require('../../src/config/environment');
      const securityConfig = config.getSecurityConfig();

      expect(securityConfig.contentSecurityPolicy).toBeDefined();
      expect(securityConfig.hsts).toBeDefined();
      expect(securityConfig.noSniff).toBe(true);
      expect(securityConfig.xssFilter).toBe(true);
    });
  });

  describe('📊 Monitoring & Logging Configuration', () => {
    it('should configure logging levels', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.NODE_ENV = 'development';

      const config = require('../../src/config/environment');
      const loggingConfig = config.getLoggingConfig();

      expect(loggingConfig.level).toBe('debug');
      expect(loggingConfig.enableConsole).toBe(true);
      expect(loggingConfig.enableFile).toBe(false);
    });

    it('should configure file logging for production', () => {
      process.env.LOG_LEVEL = 'info';
      process.env.NODE_ENV = 'production';
      process.env.LOG_FILE_PATH = '/var/log/flow-api.log';

      const config = require('../../src/config/environment');
      const loggingConfig = config.getLoggingConfig();

      expect(loggingConfig.level).toBe('info');
      expect(loggingConfig.enableConsole).toBe(false);
      expect(loggingConfig.enableFile).toBe(true);
      expect(loggingConfig.filePath).toBe('/var/log/flow-api.log');
    });

    it('should configure health check endpoints', () => {
      const config = require('../../src/config/environment');
      const healthConfig = config.getHealthCheckConfig();

      expect(healthConfig.enabled).toBe(true);
      expect(healthConfig.path).toBe('/health');
      expect(healthConfig.interval).toBe(30000);
    });
  });

  describe('🚀 Performance Configuration', () => {
    it('should configure connection pooling', () => {
      process.env.DB_POOL_MAX = '50';
      process.env.DB_POOL_MIN = '5';
      process.env.DB_POOL_IDLE_TIMEOUT = '60000';

      const config = require('../../src/config/environment');
      const poolConfig = config.getDatabasePoolConfig();

      expect(poolConfig.max).toBe(50);
      expect(poolConfig.min).toBe(5);
      expect(poolConfig.idleTimeoutMillis).toBe(60000);
    });

    it('should configure caching settings', () => {
      process.env.CACHE_TTL = '3600';
      process.env.CACHE_MAX_SIZE = '1000';

      const config = require('../../src/config/environment');
      const cacheConfig = config.getCacheConfig();

      expect(cacheConfig.ttl).toBe(3600);
      expect(cacheConfig.maxSize).toBe(1000);
    });

    it('should configure request timeout', () => {
      process.env.REQUEST_TIMEOUT = '30000';

      const config = require('../../src/config/environment');
      const timeoutConfig = config.getTimeoutConfig();

      expect(timeoutConfig.request).toBe(30000);
    });
  });

  describe('📁 File Configuration', () => {
    it('should validate configuration file exists', () => {
      const configPath = path.join(__dirname, '../../src/config/environment.js');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should validate environment file template exists', () => {
      const envTemplatePath = path.join(__dirname, '../../env.template.secure');
      expect(fs.existsSync(envTemplatePath)).toBe(true);
    });

    it('should validate Docker configuration exists', () => {
      const dockerfilePath = path.join(__dirname, '../../Dockerfile');
      const dockerComposePath = path.join(__dirname, '../../docker-compose.yml');
      
      expect(fs.existsSync(dockerfilePath)).toBe(true);
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });

    it('should validate Kubernetes configuration exists', () => {
      const k8sPath = path.join(__dirname, '../../cloud-run.yaml');
      expect(fs.existsSync(k8sPath)).toBe(true);
    });
  });

  describe('🔄 Configuration Validation', () => {
    it('should validate all configuration on startup', () => {
      const config = require('../../src/config/environment');
      
      expect(() => {
        config.validateAll();
      }).not.toThrow();
    });

    it('should detect configuration conflicts', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEBUG = 'true';

      expect(() => {
        const config = require('../../src/config/environment');
        config.validateConflicts();
      }).toThrow('Debug mode cannot be enabled in production');
    });

    it('should validate configuration completeness', () => {
      const config = require('../../src/config/environment');
      const validation = config.validateCompleteness();

      expect(validation.isComplete).toBe(true);
      expect(validation.missing).toEqual([]);
      expect(validation.warnings).toEqual([]);
    });
  });
});
