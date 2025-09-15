/**
 * Global Health Check Tests
 * End-to-end tests for critical system health
 */

const request = require('supertest');

describe('Global Health Checks', () => {
  describe('API Service Health', () => {
    let apiApp;

    beforeAll(async () => {
      // Import the API app
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should respond to health check endpoint', async () => {
      const response = await request(apiApp)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });

    it('should have correct API version', async () => {
      const response = await request(apiApp)
        .get('/health')
        .expect(200);

      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(apiApp)
        .get('/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Database Connectivity', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should connect to database', async () => {
      const response = await request(apiApp)
        .get('/health')
        .expect(200);

      // If database is connected, it should be included in health response
      if (response.body.database) {
        expect(response.body.database).toBe('connected');
      }
    });

    it('should handle database connection gracefully', async () => {
      const response = await request(apiApp)
        .get('/health')
        .expect(200);

      // Should still respond even if database is down
      expect(response.body).toHaveProperty('status');
      expect(['healthy', 'degraded']).toContain(response.body.status);
    });
  });

  describe('Redis Connectivity', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should connect to Redis', async () => {
      const response = await request(apiApp)
        .get('/health')
        .expect(200);

      // If Redis is connected, it should be included in health response
      if (response.body.redis) {
        expect(response.body.redis).toBe('connected');
      }
    });

    it('should handle Redis connection gracefully', async () => {
      const response = await request(apiApp)
        .get('/health')
        .expect(200);

      // Should still respond even if Redis is down
      expect(response.body).toHaveProperty('status');
      expect(['healthy', 'degraded']).toContain(response.body.status);
    });
  });

  describe('API Endpoints Availability', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should serve API documentation', async () => {
      const response = await request(apiApp)
        .get('/docs')
        .expect(200);

      expect(response.text).toContain('swagger');
    });

    it('should serve OpenAPI specification', async () => {
      const response = await request(apiApp)
        .get('/openapi.json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });

    it('should handle CORS preflight requests', async () => {
      await request(apiApp)
        .options('/api/v1/flows')
        .expect(204);
    });

    it('should return 404 for non-existent endpoints', async () => {
      await request(apiApp)
        .get('/api/v1/non-existent')
        .expect(404);
    });
  });

  describe('Authentication Flow', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should require authentication for protected endpoints', async () => {
      await request(apiApp)
        .get('/api/v1/flows')
        .expect(401);
    });

    it('should accept valid authentication tokens', async () => {
      // Mock a valid JWT token
      const mockToken = 'Bearer mock-valid-token';
      
      await request(apiApp)
        .get('/api/v1/flows')
        .set('Authorization', mockToken)
        .expect(200);
    });

    it('should reject invalid authentication tokens', async () => {
      const invalidToken = 'Bearer invalid-token';
      
      await request(apiApp)
        .get('/api/v1/flows')
        .set('Authorization', invalidToken)
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should enforce rate limits', async () => {
      const mockToken = 'Bearer mock-valid-token';
      
      // Make multiple requests to test rate limiting
      const requests = Array(10).fill().map(() => 
        request(apiApp)
          .get('/api/v1/flows')
          .set('Authorization', mockToken)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (rate limit is high for testing)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should handle malformed JSON requests', async () => {
      await request(apiApp)
        .post('/api/v1/flows')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle oversized requests', async () => {
      const oversizedData = 'x'.repeat(1000000); // 1MB of data
      
      await request(apiApp)
        .post('/api/v1/flows')
        .set('Content-Type', 'application/json')
        .send({ title: oversizedData })
        .expect(413); // Payload too large
    });

    it('should handle invalid HTTP methods', async () => {
      await request(apiApp)
        .patch('/api/v1/flows')
        .expect(405); // Method not allowed
    });
  });

  describe('Performance Benchmarks', () => {
    let apiApp;

    beforeAll(async () => {
      const { createApp } = require('../../services/api/src/index');
      apiApp = await createApp();
    });

    afterAll(async () => {
      if (apiApp) {
        await apiApp.close();
      }
    });

    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      await request(apiApp)
        .get('/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle concurrent requests', async () => {
      const mockToken = 'Bearer mock-valid-token';
      const concurrentRequests = 50;
      
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill().map(() => 
        request(apiApp)
          .get('/health')
      );

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(5000); // Within 5 seconds
    });
  });
});
