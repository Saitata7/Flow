const request = require('supertest');
const Fastify = require('fastify');

// Create test server
const createTestServer = async () => {
  const fastify = Fastify({
    logger: false, // Disable logging for tests
  });

  // Mock Redis client
  fastify.decorate('redis', {
    ping: jest.fn().mockResolvedValue(true),
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(true),
  });

  // Register routes
  const { flowsRoutes } = require('../../src/routes/flows');
  await fastify.register(flowsRoutes, { prefix: '/flows' });

  return fastify;
};

describe('Flows API Integration Tests', () => {
  let server;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /flows', () => {
    it('should create a new flow with valid data', async () => {
      const flowData = {
        title: 'Test Flow',
        trackingType: 'Binary',
        frequency: 'Daily',
        cheatMode: false,
      };

      const response = await request(server)
        .post('/flows')
        .set('Authorization', 'Bearer valid-user-token')
        .send(flowData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Flow');
      expect(response.body.data.ownerId).toBe('user-123');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        trackingType: 'InvalidType',
      };

      const response = await request(server)
        .post('/flows')
        .set('Authorization', 'Bearer valid-user-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .post('/flows')
        .send({ title: 'Test Flow' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /flows', () => {
    it('should return user flows with authentication', async () => {
      const response = await request(server)
        .get('/flows')
        .set('Authorization', 'Bearer valid-user-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .get('/flows')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /flows/:id', () => {
    it('should return 404 for non-existent flow', async () => {
      const response = await request(server)
        .get('/flows/non-existent-id')
        .set('Authorization', 'Bearer valid-user-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not found');
    });
  });

  describe('PUT /flows/:id', () => {
    it('should return 404 for non-existent flow', async () => {
      const response = await request(server)
        .put('/flows/non-existent-id')
        .set('Authorization', 'Bearer valid-user-token')
        .send({ title: 'Updated Flow' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /flows/:id', () => {
    it('should return 404 for non-existent flow', async () => {
      const response = await request(server)
        .delete('/flows/non-existent-id')
        .set('Authorization', 'Bearer valid-user-token')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
