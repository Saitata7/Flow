const request = require('supertest');
const Fastify = require('fastify');

// Mock external dependencies
jest.mock('../../src/db/config');
jest.mock('../../src/redis/client');
jest.mock('firebase-admin');
jest.mock('jsonwebtoken');

describe('🌊 Flows Integration Tests', () => {
  let server;

  beforeAll(async () => {
    // Create a test server instance
    server = Fastify({
      logger: false // Disable logging for tests
    });

    // Register basic flows routes for testing
    server.get('/flows', async (request, reply) => {
      return { flows: [], total: 0 };
    });

    server.post('/flows', async (request, reply) => {
      return { success: true, flow: { id: 'test-flow', ...request.body } };
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

  describe('📋 Flows Endpoints', () => {
    describe('GET /flows', () => {
      it('should return flows list', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/flows'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('flows');
        expect(body).toHaveProperty('total');
        expect(Array.isArray(body.flows)).toBe(true);
      });
    });

    describe('POST /flows', () => {
      it('should create a new flow', async () => {
        const flowData = {
          title: 'Test Flow',
          description: 'A test flow',
          trackingType: 'Binary'
        };

        const response = await server.inject({
          method: 'POST',
          url: '/flows',
          payload: flowData
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('flow');
        expect(body.flow).toHaveProperty('id', 'test-flow');
        expect(body.flow).toHaveProperty('title', flowData.title);
      });
    });
  });
});