// Unit tests for user management endpoints
const request = require('supertest');

// Mock the database and auth modules
jest.mock('../../src/db/models');
jest.mock('../../src/middleware/auth');
jest.mock('../../src/controllers/user.controller');

const { UserModel } = require('../../src/db/models');
const { requireAuth } = require('../../src/middleware/auth');
const userController = require('../../src/controllers/user.controller');

describe('User Management Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create a test app instance
    const fastify = require('fastify')({ logger: false });
    
    // Register user routes
    const userRoutes = require('../../src/routes/user');
    await fastify.register(userRoutes, { prefix: '/user' });
    
    await fastify.ready();
    app = fastify;
    server = fastify.server;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware
    requireAuth.mockImplementation(async (request, reply) => {
      request.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        provider: 'jwt',
        picture: null,
      };
    });
  });

  describe('GET /user', () => {
    it('should get user information', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        emailVerified: true,
        provider: 'jwt',
        picture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };

      userController.getUserInfo.mockResolvedValue({
        success: true,
        data: mockUser,
        message: 'User information retrieved successfully',
      });

      const response = await request(server)
        .get('/user')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.firstName).toBe('Test');
      expect(response.body.data.lastName).toBe('User');
    });

    it('should return 404 for non-existent user', async () => {
      UserModel.findById.mockResolvedValue(null);

      const response = await request(server)
        .get('/user')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for missing authentication', async () => {
      requireAuth.mockImplementation(async (request, reply) => {
        throw new Error('Authentication required');
      });

      const response = await request(server)
        .get('/user');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /user', () => {
    it('should update user information', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
      };

      const mockUpdatedUser = {
        id: 'test-user-123',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        username: 'testuser',
        emailVerified: true,
        provider: 'jwt',
        picture: null,
        updatedAt: new Date(),
      };

      UserModel.update.mockResolvedValue(mockUpdatedUser);

      const response = await request(server)
        .put('/user')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    it('should return 400 for invalid email format', async () => {
      const updateData = {
        email: 'invalid-email',
      };

      const response = await request(server)
        .put('/user')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid firstName length', async () => {
      const updateData = {
        firstName: '', // Too short
      };

      const response = await request(server)
        .put('/user')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid username length', async () => {
      const updateData = {
        username: 'ab', // Too short
      };

      const response = await request(server)
        .put('/user')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /user', () => {
    it('should delete user account', async () => {
      const mockDeletedUser = {
        id: 'test-user-123',
        deletedAt: new Date(),
      };

      UserModel.softDelete.mockResolvedValue(mockDeletedUser);

      const response = await request(server)
        .delete('/user')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User account deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      UserModel.softDelete.mockResolvedValue(null);

      const response = await request(server)
        .delete('/user')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
