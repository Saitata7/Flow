/**
 * Security Tests for API Service
 * Tests authentication, authorization, input validation, and security measures
 */

const request = require('supertest');
const fastify = require('fastify');

// Mock external dependencies
jest.mock('../../src/db/config');
jest.mock('../../src/redis/client');
jest.mock('firebase-admin');
jest.mock('jsonwebtoken');

const app = require('../../src/server');

describe('🛡️ API Security Tests', () => {
  let server;

  beforeAll(async () => {
    server = fastify();
    await server.register(app);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔐 Authentication Security', () => {
    it('should prevent brute force attacks', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Simulate multiple failed login attempts
      const promises = Array.from({ length: 10 }, () =>
        request(server)
          .post('/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // Should be rate limited after multiple attempts
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should prevent timing attacks', async () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123'
      };

      const invalidLogin = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const mockDbQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'user-123' }] }) // Valid user
        .mockResolvedValueOnce({ rows: [] }); // Invalid user
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      const startValid = Date.now();
      await request(server).post('/auth/login').send(validLogin);
      const endValid = Date.now();

      const startInvalid = Date.now();
      await request(server).post('/auth/login').send(invalidLogin);
      const endInvalid = Date.now();

      // Response times should be similar to prevent timing attacks
      const validTime = endValid - startValid;
      const invalidTime = endInvalid - startInvalid;
      const timeDifference = Math.abs(validTime - invalidTime);
      
      expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
    });

    it('should validate JWT token format', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null
      ];

      for (const token of invalidTokens) {
        const response = await request(server)
          .get('/flows')
          .set('Authorization', token)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('INVALID_TOKEN');
      }
    });

    it('should prevent JWT token replay attacks', async () => {
      const jwt = require('jsonwebtoken');
      const token = 'replay-token';
      
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        iat: Math.floor(Date.now() / 1000) - 3600, // Token issued 1 hour ago
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      // First request should succeed
      await request(server)
        .get('/flows')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Second request with same token should be rejected (if replay protection is implemented)
      // This test assumes replay protection is implemented
      const response = await request(server)
        .get('/flows')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.code).toBe('TOKEN_REPLAY_DETECTED');
    });
  });

  describe('🛡️ Input Validation & Sanitization', () => {
    it('should prevent SQL injection attacks', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (id, email) VALUES ('hacker', 'hacker@evil.com'); --",
        "' UNION SELECT password FROM users --",
        "1' OR 1=1 --"
      ];

      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      for (const payload of sqlInjectionPayloads) {
        const maliciousFlow = {
          title: payload,
          description: 'Normal description',
          category: 'Health',
          frequency: 'daily',
          startDate: '2024-01-01'
        };

        const mockDbQuery = jest.fn().mockResolvedValue({ rows: [{}] });
        const mockDb = { query: mockDbQuery };
        
        jest.doMock('../../src/db/config', () => ({
          getPool: () => mockDb
        }));

        await request(server)
          .post('/flows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maliciousFlow)
          .expect(201);

        // Verify parameterized query was used (no SQL injection possible)
        expect(mockDbQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO flows'),
          expect.arrayContaining([
            expect.not.stringContaining("'; DROP TABLE"),
            expect.not.stringContaining("' OR '1'='1"),
            expect.not.stringContaining("' UNION SELECT")
          ])
        );
      }
    });

    it('should prevent XSS attacks', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><img src=x onerror=alert(1)>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload=alert(1)>',
        '"><script>alert("xss")</script>'
      ];

      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      for (const payload of xssPayloads) {
        const maliciousFlow = {
          title: payload,
          description: 'Normal description',
          category: 'Health',
          frequency: 'daily',
          startDate: '2024-01-01'
        };

        const mockDbQuery = jest.fn().mockResolvedValue({ rows: [{}] });
        const mockDb = { query: mockDbQuery };
        
        jest.doMock('../../src/db/config', () => ({
          getPool: () => mockDb
        }));

        await request(server)
          .post('/flows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maliciousFlow)
          .expect(201);

        // Verify XSS payloads are sanitized
        expect(mockDbQuery).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([
            expect.not.stringContaining('<script>'),
            expect.not.stringContaining('javascript:'),
            expect.not.stringContaining('<iframe>'),
            expect.not.stringContaining('<svg>')
          ])
        );
      }
    });

    it('should prevent NoSQL injection attacks', async () => {
      const nosqlPayloads = [
        '{"$where": "this.password == this.username"}',
        '{"$ne": null}',
        '{"$regex": ".*"}',
        '{"$gt": ""}',
        '{"$exists": true}'
      ];

      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      for (const payload of nosqlPayloads) {
        const maliciousData = {
          title: payload,
          description: 'Normal description',
          category: 'Health',
          frequency: 'daily',
          startDate: '2024-01-01'
        };

        const mockDbQuery = jest.fn().mockResolvedValue({ rows: [{}] });
        const mockDb = { query: mockDbQuery };
        
        jest.doMock('../../src/db/config', () => ({
          getPool: () => mockDb
        }));

        await request(server)
          .post('/flows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maliciousData)
          .expect(201);

        // Verify NoSQL injection payloads are sanitized
        expect(mockDbQuery).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([
            expect.not.stringContaining('$where'),
            expect.not.stringContaining('$ne'),
            expect.not.stringContaining('$regex'),
            expect.not.stringContaining('$gt'),
            expect.not.stringContaining('$exists')
          ])
        );
      }
    });

    it('should validate input length limits', async () => {
      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      const oversizedData = {
        title: 'a'.repeat(1000), // Too long
        description: 'b'.repeat(10000), // Too long
        category: 'Health',
        frequency: 'daily',
        startDate: '2024-01-01'
      };

      const response = await request(server)
        .post('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(oversizedData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Input too long',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..name@domain.com',
        'user@domain..com',
        'user@domain.com.',
        ''
      ];

      for (const email of invalidEmails) {
        const registerData = {
          email,
          password: 'password123',
          displayName: 'Test User'
        };

        const response = await request(server)
          .post('/auth/register')
          .send(registerData)
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Invalid email format',
          code: 'VALIDATION_ERROR'
        });
      }
    });
  });

  describe('🔒 Authorization & Access Control', () => {
    it('should prevent unauthorized access to user data', async () => {
      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      // Try to access another user's flows
      const mockDbQuery = jest.fn().mockResolvedValue({ rows: [] }); // No ownership found
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      const response = await request(server)
        .put('/flows/flow-owned-by-other-user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked Flow' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Flow not found or access denied',
        code: 'FLOW_NOT_FOUND'
      });
    });

    it('should enforce role-based access control', async () => {
      const adminToken = 'admin-jwt-token';
      const userToken = 'user-jwt-token';
      
      const jwt = require('jsonwebtoken');
      
      // Mock admin user
      jwt.verify.mockImplementation((token) => {
        if (token === adminToken) {
          return { uid: 'admin-123', role: 'admin' };
        }
        return { uid: 'user-123', role: 'user' };
      });

      // Admin should have access
      await request(server)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Regular user should be denied
      const response = await request(server)
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    });

    it('should prevent privilege escalation', async () => {
      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com',
        role: 'user'
      });

      // Try to escalate privileges
      const privilegeEscalationData = {
        role: 'admin',
        permissions: ['admin:all']
      };

      const response = await request(server)
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(privilegeEscalationData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Cannot modify role or permissions',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('🌐 Network Security', () => {
    it('should enforce HTTPS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(server)
        .get('/flows')
        .set('X-Forwarded-Proto', 'http') // Simulate HTTP request
        .expect(301);

      expect(response.headers.location).toMatch(/^https:/);

      process.env.NODE_ENV = originalEnv;
    });

    it('should implement CORS properly', async () => {
      const validOrigins = ['https://flowapp.com', 'https://app.flow.com'];
      
      // Valid origin should be allowed
      const response = await request(server)
        .get('/flows')
        .set('Origin', 'https://flowapp.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://flowapp.com');

      // Invalid origin should be rejected
      await request(server)
        .get('/flows')
        .set('Origin', 'https://malicious-site.com')
        .expect(403);
    });

    it('should prevent clickjacking attacks', async () => {
      const response = await request(server)
        .get('/flows')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    });

    it('should implement security headers', async () => {
      const response = await request(server)
        .get('/flows')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['strict-transport-security']).toContain('max-age=');
    });
  });

  describe('🔍 Information Disclosure Prevention', () => {
    it('should not expose sensitive information in error messages', async () => {
      const mockDbQuery = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      const response = await request(server)
        .get('/flows')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      // Error message should not expose internal details
      expect(response.body.error).not.toContain('Database connection failed');
      expect(response.body.error).toBe('Internal server error');
    });

    it('should not expose stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockDbQuery = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      const response = await request(server)
        .get('/flows')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      // Should not include stack trace
      expect(response.body.stack).toBeUndefined();
      expect(response.body.error).toBe('Internal server error');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose API version information', async () => {
      const response = await request(server)
        .get('/flows')
        .expect(200);

      // Should not expose server version
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('🚨 Rate Limiting & DoS Protection', () => {
    it('should implement rate limiting per IP', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(server)
          .get('/flows')
          .set('X-Forwarded-For', '192.168.1.1')
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should implement rate limiting per user', async () => {
      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      const requests = Array.from({ length: 100 }, () =>
        request(server)
          .get('/flows')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle large payload attacks', async () => {
      const largePayload = {
        title: 'a'.repeat(1000000), // 1MB payload
        description: 'b'.repeat(1000000),
        category: 'Health',
        frequency: 'daily',
        startDate: '2024-01-01'
      };

      const response = await request(server)
        .post('/flows')
        .set('Authorization', 'Bearer valid-token')
        .send(largePayload)
        .expect(413); // Payload too large

      expect(response.body).toEqual({
        success: false,
        error: 'Payload too large',
        code: 'PAYLOAD_TOO_LARGE'
      });
    });
  });

  describe('🔐 Session Security', () => {
    it('should invalidate sessions on logout', async () => {
      const authToken = 'valid-jwt-token';
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: 'user-123',
        email: 'test@example.com'
      });

      // Logout
      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Token should be invalidated
      const response = await request(server)
        .get('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.code).toBe('TOKEN_INVALIDATED');
    });

    it('should implement secure session cookies', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        cookies.forEach(cookie => {
          expect(cookie).toContain('HttpOnly');
          expect(cookie).toContain('Secure');
          expect(cookie).toContain('SameSite=Strict');
        });
      }
    });
  });
});
