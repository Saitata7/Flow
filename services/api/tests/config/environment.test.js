/**
 * Environment Configuration Tests
 * Tests all environment variables and configuration values
 */

describe('Environment Configuration Tests', () => {
  let testEnv;

  beforeAll(() => {
    // Load environment variables
    require('dotenv').config({ path: './env.production' });
    testEnv = require('./test-env');
  });

  describe('Required Environment Variables', () => {
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'HOST',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'AUTH_PROVIDER',
      'JWT_SECRET',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'REDIS_HOST',
      'REDIS_PORT',
      'VALID_API_KEYS',
      'CORS_ORIGIN',
      'LOG_LEVEL'
    ];

    requiredVars.forEach(varName => {
      test(`should have ${varName} set`, () => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
      });
    });
  });

  describe('Server Configuration', () => {
    test('should have correct NODE_ENV', () => {
      expect(testEnv.NODE_ENV).toBe('production');
    });

    test('should have correct PORT for Cloud Run', () => {
      expect(testEnv.PORT).toBe('8080');
    });

    test('should have correct HOST', () => {
      expect(testEnv.HOST).toBe('0.0.0.0');
    });
  });

  describe('Database Configuration', () => {
    test('should have Cloud SQL IP for DB_HOST', () => {
      expect(testEnv.DB_HOST).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(testEnv.DB_HOST).toBe('34.63.78.153');
    });

    test('should have correct database port', () => {
      expect(testEnv.DB_PORT).toBe('5432');
    });

    test('should have database name', () => {
      expect(testEnv.DB_NAME).toBe('flow');
    });

    test('should have database user', () => {
      expect(testEnv.DB_USER).toBe('flow_user');
    });

    test('should have database password', () => {
      expect(testEnv.DB_PASSWORD).toBeDefined();
      expect(testEnv.DB_PASSWORD.length).toBeGreaterThan(0);
    });

    test('should have SSL disabled', () => {
      expect(testEnv.DB_SSL).toBe('false');
    });
  });

  describe('Redis Configuration', () => {
    test('should have valid Redis host IP', () => {
      expect(testEnv.REDIS_HOST).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(testEnv.REDIS_HOST).toBe('10.128.0.3');
    });

    test('should have correct Redis port', () => {
      expect(testEnv.REDIS_PORT).toBe('6379');
    });

    test('should have Redis database number', () => {
      expect(testEnv.REDIS_DB).toBe('0');
    });
  });

  describe('Authentication Configuration', () => {
    test('should have correct AUTH_PROVIDER', () => {
      expect(testEnv.AUTH_PROVIDER).toBe('firebase');
    });

    test('should have secure JWT secret', () => {
      expect(testEnv.JWT_SECRET).toBeDefined();
      expect(testEnv.JWT_SECRET.length).toBeGreaterThan(10);
      expect(testEnv.JWT_SECRET).toBe('Flow-prod-secret-key-2024');
    });

    test('should have JWT expiration time', () => {
      expect(testEnv.JWT_EXPIRES_IN).toBe('7d');
    });
  });

  describe('API Configuration', () => {
    test('should have API rate limiting configured', () => {
      expect(testEnv.API_RATE_LIMIT_MAX).toBe('1000');
      expect(testEnv.API_RATE_LIMIT_WINDOW).toBe('60000');
    });

    test('should have valid API keys', () => {
      expect(testEnv.VALID_API_KEYS).toBeDefined();
      expect(testEnv.VALID_API_KEYS).toContain('flow-prod-api-key-2024');
    });

    test('should have CORS origins configured', () => {
      expect(testEnv.CORS_ORIGIN).toBeDefined();
      expect(testEnv.CORS_ORIGIN).toContain('https://flow.app');
      expect(testEnv.CORS_ORIGIN).toContain('https://app.flow.com');
    });
  });

  describe('Logging Configuration', () => {
    test('should have production log level', () => {
      expect(testEnv.LOG_LEVEL).toBe('info');
    });

    test('should have JSON log format', () => {
      expect(testEnv.LOG_FORMAT).toBe('json');
    });
  });

  describe('Cache Configuration', () => {
    test('should have cache TTL values', () => {
      expect(testEnv.CACHE_TTL_FLOW).toBe('3600');
      expect(testEnv.CACHE_TTL_USER).toBe('1800');
      expect(testEnv.CACHE_TTL_LEADERBOARD).toBe('86400');
    });
  });

  describe('Cloud Run Configuration', () => {
    test('should have Cloud Run service name', () => {
      expect(testEnv.CLOUD_RUN_SERVICE).toBe('flow-prod');
    });

    test('should have Cloud Run region', () => {
      expect(testEnv.CLOUD_RUN_REGION).toBe('us-central1');
    });
  });

  describe('Template Variable Validation', () => {
    test('should not have any template variables (${...})', () => {
      const envVars = Object.keys(process.env);
      const templateVars = envVars.filter(key => 
        process.env[key] && 
        (process.env[key].includes('${') || process.env[key].includes('}'))
      );
      
      expect(templateVars).toEqual([]);
    });
  });
});
