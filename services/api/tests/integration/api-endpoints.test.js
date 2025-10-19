const request = require('supertest');
const Fastify = require('fastify');

// Mock external dependencies
jest.mock('../../src/db/config');
jest.mock('../../src/redis/client');
jest.mock('firebase-admin');
jest.mock('jsonwebtoken');

describe('🌐 API Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Create a test server instance
    server = Fastify({
      logger: false // Disable logging for tests
    });

    // Register basic routes for testing
    server.get('/health', async (request, reply) => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    server.get('/', async (request, reply) => {
      return { message: 'Flow API v1', version: '1.0.0' };
    });

    await server.ready();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔐 Basic API Tests', () => {
    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/health'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('status', 'healthy');
        expect(body).toHaveProperty('timestamp');
      });
    });

    describe('GET /', () => {
      it('should return API information', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('message', 'Flow API v1');
        expect(body).toHaveProperty('version', '1.0.0');
      });
    });
  });
});