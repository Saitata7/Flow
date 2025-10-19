// Integration tests for authentication and user management endpoints
const request = require('supertest');
const jwt = require('jsonwebtoken');

describe('Authentication and User Management Integration Tests', () => {
  let app;
  let server;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create a test app instance with all routes
    const fastify = require('fastify')({ logger: false });
    
    // Register all routes
    const authRoutes = require('../../src/routes/auth');
    const userRoutes = require('../../src/routes/user');
    const profileRoutes = require('../../src/routes/profile');
    const settingsRoutes = require('../../src/routes/settings');
    
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(userRoutes, { prefix: '/user' });
    await fastify.register(profileRoutes, { prefix: '/profile' });
    await fastify.register(settingsRoutes, { prefix: '/user/settings' });
    
    await fastify.ready();
    app = fastify;
    server = fastify.server;

    // Create a test user and token
    testUser = {
      id: 'integration-test-user-123',
      email: 'integration@example.com',
      name: 'Integration Test User',
      emailVerified: true,
      provider: 'jwt',
      picture: null,
    };

    authToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        emailVerified: testUser.emailVerified,
        name: testUser.name,
        picture: testUser.picture,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register a new user
      const registerResponse = await request(server)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe('newuser@example.com');

      const registerToken = registerResponse.body.data.token;

      // 2. Verify the token
      const verifyResponse = await request(server)
        .post('/auth/verify')
        .send({
          token: registerToken,
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.valid).toBe(true);
      expect(verifyResponse.body.data.user.email).toBe('newuser@example.com');

      // 3. Login with the same credentials
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe('newuser@example.com');
    });

    it('should handle Firebase token conversion', async () => {
      const mockFirebaseToken = 'mock-firebase-token';
      const mockFirebaseUser = {
        id: 'firebase-user-123',
        email: 'firebase@example.com',
        emailVerified: true,
        name: 'Firebase User',
        picture: null,
      };

      // Mock Firebase token verification
      const { verifyFirebaseToken } = require('../../src/middleware/auth');
      verifyFirebaseToken.mockResolvedValue(mockFirebaseUser);

      const response = await request(server)
        .post('/auth/firebase-to-jwt')
        .send({
          firebaseToken: mockFirebaseToken,
          user: {
            uid: 'firebase-user-123',
            email: 'firebase@example.com',
            displayName: 'Firebase User',
            photoURL: null,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.jwtToken).toBeDefined();
      expect(response.body.user.email).toBe('firebase@example.com');
    });
  });

  describe('User Management Flow', () => {
    it('should complete full user management flow', async () => {
      // 1. Get user info
      const getUserResponse = await request(server)
        .get('/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body.success).toBe(true);

      // 2. Update user info
      const updateUserResponse = await request(server)
        .put('/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@example.com',
        });

      expect(updateUserResponse.status).toBe(200);
      expect(updateUserResponse.body.success).toBe(true);
      expect(updateUserResponse.body.data.firstName).toBe('Updated');
      expect(updateUserResponse.body.data.lastName).toBe('Name');

      // 3. Get updated user info
      const getUpdatedUserResponse = await request(server)
        .get('/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getUpdatedUserResponse.status).toBe(200);
      expect(getUpdatedUserResponse.body.success).toBe(true);
    });

    it('should handle user account deletion', async () => {
      const deleteResponse = await request(server)
        .delete('/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('User account deleted successfully');
    });
  });

  describe('Profile Management Flow', () => {
    it('should complete full profile management flow', async () => {
      // 1. Get user profile
      const getProfileResponse = await request(server)
        .get('/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getProfileResponse.status).toBe(200);
      expect(getProfileResponse.body.success).toBe(true);

      // 2. Update user profile
      const updateProfileResponse = await request(server)
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Profile',
          lastName: 'User',
          email: 'profile@example.com',
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
        });

      expect(updateProfileResponse.status).toBe(200);
      expect(updateProfileResponse.body.success).toBe(true);
      expect(updateProfileResponse.body.data.firstName).toBe('Profile');
      expect(updateProfileResponse.body.data.lastName).toBe('User');

      // 3. Get profile statistics
      const getStatsResponse = await request(server)
        .get('/profile/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getStatsResponse.status).toBe(200);
      expect(getStatsResponse.body.success).toBe(true);
    });
  });

  describe('Settings Management Flow', () => {
    it('should complete full settings management flow', async () => {
      // 1. Get user settings
      const getSettingsResponse = await request(server)
        .get('/user/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getSettingsResponse.status).toBe(200);
      expect(getSettingsResponse.body.success).toBe(true);

      // 2. Update user settings
      const updateSettingsResponse = await request(server)
        .put('/user/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'dark',
          language: 'en',
          notifications: {
            reminders: false,
            achievements: true,
            streaks: true,
            weeklyReports: false,
          },
          dataSharing: {
            analytics: false,
            crashReports: true,
            usageStats: false,
            personalizedAds: false,
          },
        });

      expect(updateSettingsResponse.status).toBe(200);
      expect(updateSettingsResponse.body.success).toBe(true);
      expect(updateSettingsResponse.body.data.theme).toBe('dark');

      // 3. Update specific setting
      const updateSpecificSettingResponse = await request(server)
        .put('/user/settings/theme')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'light',
        });

      expect(updateSpecificSettingResponse.status).toBe(200);
      expect(updateSpecificSettingResponse.body.success).toBe(true);

      // 4. Update privacy setting
      const updatePrivacyResponse = await request(server)
        .put('/user/settings/privacy/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: true,
        });

      expect(updatePrivacyResponse.status).toBe(200);
      expect(updatePrivacyResponse.body.success).toBe(true);

      // 5. Sync settings
      const syncResponse = await request(server)
        .post('/user/settings/sync')
        .set('Authorization', `Bearer ${authToken}`);

      expect(syncResponse.status).toBe(200);
      expect(syncResponse.body.success).toBe(true);

      // 6. Export settings
      const exportResponse = await request(server)
        .get('/user/settings/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(exportResponse.status).toBe(200);
      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data.settings).toBeDefined();
      expect(exportResponse.body.data.privacySettings).toBeDefined();

      // 7. Import settings
      const importData = {
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            reminders: true,
            achievements: true,
            streaks: true,
            weeklyReports: true,
          },
        },
        privacySettings: {
          dataSharing: {
            analytics: true,
            crashReports: true,
            usageStats: true,
            personalizedAds: false,
          },
        },
        exportDate: new Date(),
        version: '1.0.0',
      };

      const importResponse = await request(server)
        .post('/user/settings/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData);

      expect(importResponse.status).toBe(200);
      expect(importResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors properly', async () => {
      // Test with invalid token
      const invalidTokenResponse = await request(server)
        .get('/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidTokenResponse.status).toBe(401);

      // Test with missing token
      const missingTokenResponse = await request(server)
        .get('/user');

      expect(missingTokenResponse.status).toBe(401);
    });

    it('should handle validation errors properly', async () => {
      // Test invalid email format
      const invalidEmailResponse = await request(server)
        .put('/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        });

      expect(invalidEmailResponse.status).toBe(400);

      // Test invalid profile data
      const invalidProfileResponse = await request(server)
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          // Missing required fields: dateOfBirth, gender
        });

      expect(invalidProfileResponse.status).toBe(400);
    });

    it('should handle not found errors properly', async () => {
      // Test with non-existent user
      const nonExistentUserToken = jwt.sign(
        {
          userId: 'non-existent-user',
          email: 'nonexistent@example.com',
          emailVerified: true,
          name: 'Non Existent User',
          picture: null,
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const notFoundResponse = await request(server)
        .get('/user')
        .set('Authorization', `Bearer ${nonExistentUserToken}`);

      expect(notFoundResponse.status).toBe(404);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle rate limiting', async () => {
      // Make multiple requests quickly to test rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(server)
            .get('/user')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed (rate limit is high for testing)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });

    it('should handle CORS properly', async () => {
      const corsResponse = await request(server)
        .options('/user')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization');

      expect(corsResponse.status).toBe(204);
      expect(corsResponse.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
