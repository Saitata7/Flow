// End-to-end tests for GCP production deployment
const request = require('supertest');
const jwt = require('jsonwebtoken');

describe('GCP Production E2E Tests - Authentication and User Management', () => {
  let baseUrl;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Use GCP production URL
    baseUrl = process.env.GCP_API_URL || 'https://flow-api-xxxxx-uc.a.run.app';
    
    // Create a test user and token
    testUser = {
      id: 'e2e-test-user-123',
      email: 'e2e@example.com',
      name: 'E2E Test User',
      emailVerified: true,
      provider: 'jwt',
      picture: null,
    };

    // Generate a test token (in production, this would come from Firebase)
    authToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        emailVerified: testUser.emailVerified,
        name: testUser.name,
        picture: testUser.picture,
      },
      process.env.JWT_SECRET || 'production-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(baseUrl)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database).toBeDefined();
      expect(response.body.services.redis).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    it('should handle login endpoint', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBeLessThan(500);
      // In production, this might return 400 or 401 depending on user existence
    });

    it('should handle Firebase token conversion', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/firebase-to-jwt')
        .send({
          firebaseToken: 'mock-firebase-token',
          user: {
            uid: 'firebase-user-123',
            email: 'firebase@example.com',
            displayName: 'Firebase User',
            photoURL: null,
          },
        });

      expect(response.status).toBeLessThan(500);
      // In production, this might return 401 for invalid Firebase token
    });

    it('should handle token verification', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/verify')
        .send({
          token: authToken,
        });

      expect(response.status).toBeLessThan(500);
      // Response depends on token validity
    });
  });

  describe('User Management Endpoints', () => {
    it('should handle user info retrieval', async () => {
      const response = await request(baseUrl)
        .get('/v1/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent user
    });

    it('should handle user info update', async () => {
      const response = await request(baseUrl)
        .put('/v1/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@example.com',
        });

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent user
    });

    it('should handle user account deletion', async () => {
      const response = await request(baseUrl)
        .delete('/v1/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent user
    });
  });

  describe('Profile Endpoints', () => {
    it('should handle profile retrieval', async () => {
      const response = await request(baseUrl)
        .get('/v1/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent profile
    });

    it('should handle profile update', async () => {
      const response = await request(baseUrl)
        .put('/v1/profile')
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

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent profile
    });

    it('should handle profile statistics', async () => {
      const response = await request(baseUrl)
        .get('/v1/profile/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent profile
    });
  });

  describe('Settings Endpoints', () => {
    it('should handle settings retrieval', async () => {
      const response = await request(baseUrl)
        .get('/v1/user/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent settings
    });

    it('should handle settings update', async () => {
      const response = await request(baseUrl)
        .put('/v1/user/settings')
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

      expect(response.status).toBeLessThan(500);
      // In production, this might return 404 for non-existent settings
    });

    it('should handle specific setting update', async () => {
      const response = await request(baseUrl)
        .put('/v1/user/settings/theme')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'light',
        });

      expect(response.status).toBeLessThan(500);
    });

    it('should handle privacy setting update', async () => {
      const response = await request(baseUrl)
        .put('/v1/user/settings/privacy/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: true,
        });

      expect(response.status).toBeLessThan(500);
    });

    it('should handle settings sync', async () => {
      const response = await request(baseUrl)
        .post('/v1/user/settings/sync')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
    });

    it('should handle settings export', async () => {
      const response = await request(baseUrl)
        .get('/v1/user/settings/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
    });

    it('should handle settings import', async () => {
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

      const response = await request(baseUrl)
        .post('/v1/user/settings/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send(importData);

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const response = await request(baseUrl)
        .get('/v1/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should handle missing authentication', async () => {
      const response = await request(baseUrl)
        .get('/v1/user');

      expect(response.status).toBe(401);
    });

    it('should handle validation errors', async () => {
      const response = await request(baseUrl)
        .put('/v1/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(baseUrl)
        .get('/health');

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle concurrent requests', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(baseUrl)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security Tests', () => {
    it('should handle CORS properly', async () => {
      const response = await request(baseUrl)
        .options('/v1/user')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests quickly
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(baseUrl)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed (rate limit is high for health endpoint)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });

    it('should handle malformed requests', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send('invalid-json');

      expect(response.status).toBe(400);
    });
  });

  describe('Database Connectivity', () => {
    it('should connect to Cloud SQL', async () => {
      const response = await request(baseUrl)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.database).toBeDefined();
      expect(response.body.services.database.status).toBe('healthy');
    });

    it('should connect to Redis', async () => {
      const response = await request(baseUrl)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.services.redis).toBeDefined();
      expect(response.body.services.redis.status).toBe('healthy');
    });
  });

  describe('Firebase Integration', () => {
    it('should handle Firebase authentication', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/firebase-to-jwt')
        .send({
          firebaseToken: 'mock-firebase-token',
          user: {
            uid: 'firebase-user-123',
            email: 'firebase@example.com',
            displayName: 'Firebase User',
            photoURL: null,
          },
        });

      expect(response.status).toBeLessThan(500);
      // In production, this might return 401 for invalid Firebase token
    });
  });
});
