// Unit tests for profile endpoints
const request = require('supertest');

// Mock the database and auth modules
jest.mock('../../src/db/models');
jest.mock('../../src/middleware/auth');

const { UserModel } = require('../../src/db/models');
const { requireAuth } = require('../../src/middleware/auth');

describe('Profile Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create a test app instance
    const fastify = require('fastify')({ logger: false });
    
    // Register profile routes
    const profileRoutes = require('../../src/routes/profile');
    await fastify.register(profileRoutes, { prefix: '/profile' });
    
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

  describe('GET /profile', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: 'test-user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        race: 'white',
        disability: 'none',
        preferredLanguage: 'en',
        country: 'US',
        timezone: 'UTC',
        healthGoals: ['fitness', 'nutrition'],
        fitnessLevel: 'intermediate',
        medicalConditions: null,
        profileVisibility: 'private',
        dataSharing: {
          analytics: true,
          research: false,
          marketing: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      UserModel.getProfile.mockResolvedValue(mockProfile);

      const response = await request(server)
        .get('/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.firstName).toBe('Test');
      expect(response.body.data.lastName).toBe('User');
    });

    it('should return 404 for non-existent profile', async () => {
      UserModel.getProfile.mockResolvedValue(null);

      const response = await request(server)
        .get('/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phoneNumber: '+1234567890',
        country: 'US',
        timezone: 'UTC',
        profileVisibility: 'private',
        dataSharing: {
          analytics: true,
          research: false,
          marketing: false,
        },
      };

      const mockUpdatedProfile = {
        id: 'test-user-123',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phoneNumber: '+1234567890',
        country: 'US',
        timezone: 'UTC',
        profileVisibility: 'private',
        dataSharing: {
          analytics: true,
          research: false,
          marketing: false,
        },
        updatedAt: new Date(),
      };

      UserModel.updateProfile.mockResolvedValue(mockUpdatedProfile);

      const response = await request(server)
        .put('/profile')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    it('should return 400 for missing required fields', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        // Missing required fields: email, dateOfBirth, gender
      };

      const response = await request(server)
        .put('/profile')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid gender', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        dateOfBirth: '1990-01-01',
        gender: 'invalid-gender',
      };

      const response = await request(server)
        .put('/profile')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'invalid-email',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      };

      const response = await request(server)
        .put('/profile')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /profile', () => {
    it('should delete user profile', async () => {
      const mockDeletedProfile = {
        id: 'test-user-123',
        deletedAt: new Date(),
      };

      UserModel.deleteProfile.mockResolvedValue(mockDeletedProfile);

      const response = await request(server)
        .delete('/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile deleted successfully');
    });

    it('should return 404 for non-existent profile', async () => {
      UserModel.deleteProfile.mockResolvedValue(null);

      const response = await request(server)
        .delete('/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /profile/stats', () => {
    it('should get profile statistics', async () => {
      const mockStats = {
        totalFlows: 5,
        completedEntries: 25,
        currentStreak: 7,
        longestStreak: 15,
        achievements: 3,
        badges: 2,
        joinDate: new Date('2023-01-01'),
        lastActive: new Date(),
      };

      UserModel.getProfileStats.mockResolvedValue(mockStats);

      const response = await request(server)
        .get('/profile/stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalFlows).toBe(5);
      expect(response.body.data.completedEntries).toBe(25);
      expect(response.body.data.currentStreak).toBe(7);
    });

    it('should return 404 for non-existent profile stats', async () => {
      UserModel.getProfileStats.mockResolvedValue(null);

      const response = await request(server)
        .get('/profile/stats')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
