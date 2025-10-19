/**
 * End-to-End Tests for API Service
 * Tests complete user workflows and system integration
 */

const request = require('supertest');
const fastify = require('fastify');

// Mock external dependencies
jest.mock('../../src/db/config');
jest.mock('../../src/redis/client');
jest.mock('firebase-admin');
jest.mock('jsonwebtoken');

const app = require('../../src/server');

describe('🔄 API End-to-End Tests', () => {
  let server;
  let authToken;
  let userId;

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
    userId = 'user-e2e-123';
    authToken = 'e2e-jwt-token';
  });

  describe('👤 Complete User Registration & Onboarding Flow', () => {
    it('should complete full user registration and onboarding', async () => {
      const jwt = require('jsonwebtoken');
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Step 1: Register new user
      const registerData = {
        email: 'e2e@example.com',
        password: 'password123',
        displayName: 'E2E Test User'
      };

      const mockUser = {
        id: userId,
        email: 'e2e@example.com',
        displayName: 'E2E Test User',
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ rows: [mockUser] }); // Create user

      const registerResponse = await request(server)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.id).toBe(userId);

      // Step 2: Login with new credentials
      jwt.sign.mockReturnValue(authToken);
      mockDbQuery.mockResolvedValue({ rows: [mockUser] });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBe(authToken);

      // Step 3: Update user profile
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });

      const profileUpdate = {
        displayName: 'Updated E2E User',
        bio: 'E2E test user bio',
        timezone: 'UTC'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: userId }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [{ ...mockUser, ...profileUpdate }] }); // Update

      const profileResponse = await request(server)
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdate)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.displayName).toBe('Updated E2E User');
    });
  });

  describe('📊 Complete Flow Management Workflow', () => {
    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });
    });

    it('should complete full flow lifecycle', async () => {
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Step 1: Create a new flow
      const flowData = {
        title: 'E2E Test Flow',
        description: 'Complete flow for E2E testing',
        category: 'Health',
        frequency: 'daily',
        startDate: '2024-01-01'
      };

      const createdFlow = {
        id: 'flow-e2e-123',
        ...flowData,
        userId,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [createdFlow] });

      const createResponse = await request(server)
        .post('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(flowData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.id).toBe('flow-e2e-123');

      // Step 2: Fetch the created flow
      mockDbQuery
        .mockResolvedValueOnce({ rows: [createdFlow] }) // Get flow
        .mockResolvedValueOnce({ rows: [] }); // Get entries (empty initially)

      const getFlowResponse = await request(server)
        .get('/flows/flow-e2e-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getFlowResponse.body.success).toBe(true);
      expect(getFlowResponse.body.data.title).toBe('E2E Test Flow');

      // Step 3: Add flow entries
      const entryData = {
        date: '2024-01-01',
        symbol: '+',
        note: 'Completed successfully',
        emotion: 'happy',
        moodScore: 4
      };

      const createdEntry = {
        id: 'entry-e2e-123',
        flowId: 'flow-e2e-123',
        ...entryData,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'flow-e2e-123', userId }] }) // Check flow ownership
        .mockResolvedValueOnce({ rows: [createdEntry] }); // Create entry

      const addEntryResponse = await request(server)
        .post('/flows/flow-e2e-123/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entryData)
        .expect(201);

      expect(addEntryResponse.body.success).toBe(true);
      expect(addEntryResponse.body.data.symbol).toBe('+');

      // Step 4: Update the flow
      const updateData = {
        title: 'Updated E2E Test Flow',
        description: 'Updated description for E2E testing'
      };

      const updatedFlow = {
        ...createdFlow,
        ...updateData,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'flow-e2e-123', userId }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [updatedFlow] }); // Update

      const updateResponse = await request(server)
        .put('/flows/flow-e2e-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated E2E Test Flow');

      // Step 5: Fetch flow with entries
      mockDbQuery
        .mockResolvedValueOnce({ rows: [updatedFlow] }) // Get flow
        .mockResolvedValueOnce({ rows: [createdEntry] }); // Get entries

      const getFlowWithEntriesResponse = await request(server)
        .get('/flows/flow-e2e-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getFlowWithEntriesResponse.body.success).toBe(true);
      expect(getFlowWithEntriesResponse.body.data.entries).toHaveLength(1);

      // Step 6: Delete the flow
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'flow-e2e-123', userId }] }) // Check ownership
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete entries
        .mockResolvedValueOnce({ rowCount: 1 }); // Delete flow

      const deleteResponse = await request(server)
        .delete('/flows/flow-e2e-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('📈 Complete Stats & Analytics Workflow', () => {
    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });
    });

    it('should generate and fetch comprehensive stats', async () => {
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Step 1: Create multiple flows for stats
      const flows = [
        {
          id: 'flow-stats-1',
          title: 'Morning Routine',
          category: 'Health',
          userId
        },
        {
          id: 'flow-stats-2',
          title: 'Exercise',
          category: 'Fitness',
          userId
        },
        {
          id: 'flow-stats-3',
          title: 'Reading',
          category: 'Learning',
          userId
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: flows });

      const createFlowsResponse = await request(server)
        .post('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(flows[0])
        .expect(201);

      expect(createFlowsResponse.body.success).toBe(true);

      // Step 2: Add entries to flows
      const entries = [
        { flowId: 'flow-stats-1', date: '2024-01-01', symbol: '+', moodScore: 4 },
        { flowId: 'flow-stats-1', date: '2024-01-02', symbol: '+', moodScore: 5 },
        { flowId: 'flow-stats-2', date: '2024-01-01', symbol: '+', moodScore: 3 },
        { flowId: 'flow-stats-3', date: '2024-01-01', symbol: '-', moodScore: 2 }
      ];

      mockDbQuery
        .mockResolvedValue({ rows: [{ id: 'flow-stats-1', userId }] }) // Check ownership
        .mockResolvedValue({ rows: [{}] }); // Create entry

      for (const entry of entries) {
        await request(server)
          .post(`/flows/${entry.flowId}/entries`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(entry)
          .expect(201);
      }

      // Step 3: Fetch overview stats
      const overviewStats = {
        totalFlows: 3,
        activeFlows: 3,
        totalEntries: 4,
        currentStreak: 2,
        longestStreak: 2,
        completionRate: 0.75,
        averageMoodScore: 3.5
      };

      mockDbQuery.mockResolvedValue({ rows: [overviewStats] });

      const overviewResponse = await request(server)
        .get('/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(overviewResponse.body.success).toBe(true);
      expect(overviewResponse.body.data.totalFlows).toBe(3);
      expect(overviewResponse.body.data.completionRate).toBe(0.75);

      // Step 4: Fetch flow-specific stats
      const flowStats = {
        flowId: 'flow-stats-1',
        totalEntries: 2,
        completionRate: 1.0,
        currentStreak: 2,
        longestStreak: 2,
        averageMoodScore: 4.5
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'flow-stats-1', userId }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [flowStats] }); // Get stats

      const flowStatsResponse = await request(server)
        .get('/stats/flow/flow-stats-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(flowStatsResponse.body.success).toBe(true);
      expect(flowStatsResponse.body.data.completionRate).toBe(1.0);
    });
  });

  describe('🔄 Complete Sync & Offline Workflow', () => {
    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });
    });

    it('should handle complete offline-to-online sync', async () => {
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Step 1: Simulate offline operations (queued)
      const offlineOperations = [
        {
          type: 'create_flow',
          data: {
            id: 'offline-flow-1',
            title: 'Offline Flow',
            category: 'Health',
            userId
          }
        },
        {
          type: 'create_entry',
          data: {
            id: 'offline-entry-1',
            flowId: 'offline-flow-1',
            date: '2024-01-01',
            symbol: '+',
            userId
          }
        },
        {
          type: 'update_flow',
          data: {
            id: 'offline-flow-1',
            title: 'Updated Offline Flow',
            userId
          }
        }
      ];

      // Step 2: Sync offline operations when coming online
      mockDbQuery
        .mockResolvedValue({ rows: [] }) // Check if flow exists
        .mockResolvedValue({ rows: [offlineOperations[0].data] }) // Create flow
        .mockResolvedValue({ rows: [{ id: 'offline-flow-1', userId }] }) // Check ownership
        .mockResolvedValue({ rows: [offlineOperations[1].data] }) // Create entry
        .mockResolvedValue({ rows: [{ id: 'offline-flow-1', userId }] }) // Check ownership
        .mockResolvedValue({ rows: [offlineOperations[2].data] }); // Update flow

      const syncResponse = await request(server)
        .post('/sync/process-queue')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ operations: offlineOperations })
        .expect(200);

      expect(syncResponse.body.success).toBe(true);
      expect(syncResponse.body.data.processed).toBe(3);
      expect(syncResponse.body.data.failed).toBe(0);

      // Step 3: Verify synced data
      mockDbQuery
        .mockResolvedValueOnce({ rows: [offlineOperations[2].data] }) // Get flow
        .mockResolvedValueOnce({ rows: [offlineOperations[1].data] }); // Get entries

      const verifyResponse = await request(server)
        .get('/flows/offline-flow-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.title).toBe('Updated Offline Flow');
      expect(verifyResponse.body.data.entries).toHaveLength(1);
    });
  });

  describe('🔔 Complete Notification Workflow', () => {
    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });
    });

    it('should handle complete notification lifecycle', async () => {
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Step 1: Create flow with notifications enabled
      const flowData = {
        title: 'Notification Flow',
        description: 'Flow with notifications',
        category: 'Health',
        frequency: 'daily',
        startDate: '2024-01-01',
        notificationSettings: {
          enabled: true,
          time: '09:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      };

      const createdFlow = {
        id: 'notification-flow-1',
        ...flowData,
        userId,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [createdFlow] });

      const createFlowResponse = await request(server)
        .post('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(flowData)
        .expect(201);

      expect(createFlowResponse.body.success).toBe(true);

      // Step 2: Schedule notifications
      const notificationData = {
        flowId: 'notification-flow-1',
        type: 'reminder',
        scheduledTime: '2024-01-02T09:00:00Z',
        message: 'Time for your daily flow!'
      };

      const scheduledNotification = {
        id: 'notification-1',
        ...notificationData,
        userId,
        status: 'scheduled'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'notification-flow-1', userId }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [scheduledNotification] }); // Schedule notification

      const scheduleResponse = await request(server)
        .post('/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(scheduleResponse.body.success).toBe(true);
      expect(scheduleResponse.body.data.status).toBe('scheduled');

      // Step 3: Fetch scheduled notifications
      mockDbQuery.mockResolvedValue({ rows: [scheduledNotification] });

      const getNotificationsResponse = await request(server)
        .get('/notifications/scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getNotificationsResponse.body.success).toBe(true);
      expect(getNotificationsResponse.body.data).toHaveLength(1);

      // Step 4: Cancel notification
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'notification-1', userId }] }) // Check ownership
        .mockResolvedValueOnce({ rowCount: 1 }); // Cancel notification

      const cancelResponse = await request(server)
        .delete('/notifications/notification-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
    });
  });

  describe('🚨 Error Recovery & Resilience Workflow', () => {
    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });
    });

    it('should handle and recover from system failures', async () => {
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Step 1: Simulate database failure
      mockDbQuery.mockRejectedValue(new Error('Database connection lost'));

      const failureResponse = await request(server)
        .get('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(failureResponse.body.success).toBe(false);
      expect(failureResponse.body.error).toBe('Internal server error');

      // Step 2: Simulate recovery
      mockDbQuery.mockResolvedValue({ rows: [] });

      const recoveryResponse = await request(server)
        .get('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(recoveryResponse.body.success).toBe(true);
      expect(recoveryResponse.body.data).toEqual([]);

      // Step 3: Test retry mechanism
      const flowData = {
        title: 'Recovery Test Flow',
        category: 'Health',
        frequency: 'daily',
        startDate: '2024-01-01'
      };

      mockDbQuery
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ rows: [{ id: 'recovery-flow-1', ...flowData, userId }] });

      const retryResponse = await request(server)
        .post('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(flowData)
        .expect(201);

      expect(retryResponse.body.success).toBe(true);
    });
  });

  describe('📊 Performance & Load Testing Workflow', () => {
    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        uid: userId,
        email: 'e2e@example.com'
      });
    });

    it('should handle concurrent operations efficiently', async () => {
      const mockDbQuery = jest.fn();
      const mockDb = { query: mockDbQuery };
      
      jest.doMock('../../src/db/config', () => ({
        getPool: () => mockDb
      }));

      // Create multiple flows concurrently
      const flowPromises = Array.from({ length: 10 }, (_, i) => {
        const flowData = {
          title: `Concurrent Flow ${i}`,
          category: 'Health',
          frequency: 'daily',
          startDate: '2024-01-01'
        };

        mockDbQuery.mockResolvedValue({ rows: [{ id: `concurrent-flow-${i}`, ...flowData, userId }] });

        return request(server)
          .post('/flows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(flowData);
      });

      const startTime = Date.now();
      const responses = await Promise.all(flowPromises);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds

      // Verify all flows were created
      mockDbQuery.mockResolvedValue({ rows: Array.from({ length: 10 }, (_, i) => ({ id: `concurrent-flow-${i}` })) });

      const getFlowsResponse = await request(server)
        .get('/flows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getFlowsResponse.body.data).toHaveLength(10);
    });
  });
});
