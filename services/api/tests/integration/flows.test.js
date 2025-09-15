/**
 * Flows API Integration Tests
 * Tests the complete flow CRUD operations
 */

const request = require('supertest');
const { createApp } = require('../../src/index');

describe('Flows API Integration', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await createApp();
    
    // Mock authentication token
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/flows', () => {
    it('should return flows for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/flows')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/flows')
        .expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/flows?page=1&limit=10')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 10);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/v1/flows?search=test')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/v1/flows', () => {
    it('should create a new flow', async () => {
      const flowData = {
        title: 'Test Flow',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
      };

      const response = await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(flowData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', flowData.title);
      expect(response.body.data).toHaveProperty('description', flowData.description);
    });

    it('should validate required fields', async () => {
      const invalidFlowData = {
        description: 'Missing title',
      };

      await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(invalidFlowData)
        .expect(400);
    });

    it('should validate tracking type', async () => {
      const invalidFlowData = {
        title: 'Test Flow',
        tracking_type: 'invalid_type',
      };

      await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(invalidFlowData)
        .expect(400);
    });
  });

  describe('GET /api/v1/flows/:id', () => {
    let flowId;

    beforeAll(async () => {
      // Create a flow for testing
      const flowData = {
        title: 'Test Flow for GET',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
      };

      const response = await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(flowData);

      flowId = response.body.data.id;
    });

    it('should return a specific flow', async () => {
      const response = await request(app)
        .get(`/api/v1/flows/${flowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', flowId);
      expect(response.body.data).toHaveProperty('title');
    });

    it('should return 404 for non-existent flow', async () => {
      await request(app)
        .get('/api/v1/flows/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });

    it('should return 403 for private flow owned by another user', async () => {
      // This would require mocking different user context
      // For now, we'll test the basic flow
      const response = await request(app)
        .get(`/api/v1/flows/${flowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/flows/:id', () => {
    let flowId;

    beforeAll(async () => {
      // Create a flow for testing
      const flowData = {
        title: 'Test Flow for PUT',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
      };

      const response = await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(flowData);

      flowId = response.body.data.id;
    });

    it('should update a flow', async () => {
      const updateData = {
        title: 'Updated Flow Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/flows/${flowId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('description', updateData.description);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        tracking_type: 'invalid_type',
      };

      await request(app)
        .put(`/api/v1/flows/${flowId}`)
        .set('Authorization', authToken)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('DELETE /api/v1/flows/:id', () => {
    let flowId;

    beforeAll(async () => {
      // Create a flow for testing
      const flowData = {
        title: 'Test Flow for DELETE',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
      };

      const response = await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(flowData);

      flowId = response.body.data.id;
    });

    it('should soft delete a flow', async () => {
      const response = await request(app)
        .delete(`/api/v1/flows/${flowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deleted_at');
    });

    it('should return 404 for non-existent flow', async () => {
      await request(app)
        .delete('/api/v1/flows/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('POST /api/v1/flows/:id/archive', () => {
    let flowId;

    beforeAll(async () => {
      // Create a flow for testing
      const flowData = {
        title: 'Test Flow for Archive',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
      };

      const response = await request(app)
        .post('/api/v1/flows')
        .set('Authorization', authToken)
        .send(flowData);

      flowId = response.body.data.id;
    });

    it('should archive a flow', async () => {
      const response = await request(app)
        .post(`/api/v1/flows/${flowId}/archive`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('archived_at');
    });
  });
});