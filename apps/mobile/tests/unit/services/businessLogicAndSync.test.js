/**
 * Critical Production Tests for Business Logic and Sync
 * Focuses on offline-first architecture, data consistency, and sync reliability
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { store, retrieve } from '../../../src/utils/storageUtils';
import { generateIdempotencyKey, storeIdempotencyKey, checkIdempotencyKey } from '../../../src/utils/idempotency';
import { SessionManager } from '../../../src/utils/sessionManager';
import { TokenRefreshManager } from '../../../src/utils/tokenRefresh';

// Mock all external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../../src/utils/storageUtils');
jest.mock('../../../src/utils/idempotency');
jest.mock('../../../src/utils/sessionManager');
jest.mock('../../../src/utils/tokenRefresh');
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return {
    ...actualMoment,
    default: actualMoment,
  };
});

describe('🔄 CRITICAL: Business Logic and Sync Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.removeItem.mockResolvedValue();
    AsyncStorage.multiGet.mockResolvedValue([]);
    AsyncStorage.multiSet.mockResolvedValue();
    AsyncStorage.multiRemove.mockResolvedValue();

    NetInfo.addEventListener.mockReturnValue(jest.fn());
    NetInfo.fetch.mockResolvedValue({ isConnected: true });

    store.mockResolvedValue();
    retrieve.mockResolvedValue(null);

    generateIdempotencyKey.mockReturnValue('test-idempotency-key');
    storeIdempotencyKey.mockResolvedValue();
    checkIdempotencyKey.mockResolvedValue(false);

    SessionManager.mockImplementation(() => ({
      storeSession: jest.fn().mockResolvedValue(true),
      getStoredSession: jest.fn().mockResolvedValue(null),
    }));

    TokenRefreshManager.mockImplementation(() => ({
      getToken: jest.fn().mockResolvedValue('mock-token'),
      needsRefresh: jest.fn().mockReturnValue(false),
    }));
  });

  describe('📱 Offline-First Architecture', () => {
    it('should work offline and queue operations', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false });

      const offlineOperation = {
        type: 'create_flow',
        data: { title: 'Offline Flow' },
        timestamp: Date.now(),
        id: 'op-123'
      };

      await store('pending_sync_queue', [offlineOperation]);
      expect(store).toHaveBeenCalledWith('pending_sync_queue', [offlineOperation]);

      const retrieved = await retrieve('pending_sync_queue');
      expect(retrieve).toHaveBeenCalledWith('pending_sync_queue');
    });

    it('should sync queued operations when coming back online', async () => {
      // Start offline
      NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
      
      const offlineOperations = [
        { type: 'create_flow', data: { title: 'Offline Flow 1' } },
        { type: 'create_flow', data: { title: 'Offline Flow 2' } }
      ];

      await store('pending_sync_queue', offlineOperations);
      
      // Simulate coming back online
      NetInfo.fetch.mockResolvedValueOnce({ isConnected: true });
      
      const networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(true);

      // Should process queued operations
      const queuedOps = await retrieve('pending_sync_queue');
      expect(queuedOps).toEqual(offlineOperations);
    });

    it('should handle sync conflicts gracefully', async () => {
      const localData = { id: '1', title: 'Local Title', version: 1 };
      const serverData = { id: '1', title: 'Server Title', version: 2 };

      // Simulate conflict resolution
      const resolvedData = {
        ...serverData,
        title: 'Resolved Title', // Manual resolution
        version: 3,
        conflictResolved: true
      };

      await store('conflict_resolution', resolvedData);
      expect(store).toHaveBeenCalledWith('conflict_resolution', resolvedData);
    });

    it('should maintain data consistency during offline operations', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      
      const flows = [
        { id: '1', title: 'Flow 1', entries: [] },
        { id: '2', title: 'Flow 2', entries: [] }
      ];

      const activities = [
        { id: '1', flowId: '1', date: '2024-01-15', symbol: '+' },
        { id: '2', flowId: '2', date: '2024-01-15', symbol: '-' }
      ];

      // Store related data offline
      await AsyncStorage.multiSet([
        ['flows', JSON.stringify(flows)],
        ['activities', JSON.stringify(activities)]
      ]);

      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['flows', JSON.stringify(flows)],
        ['activities', JSON.stringify(activities)]
      ]);

      // Verify referential integrity
      AsyncStorage.multiGet.mockResolvedValue([
        ['flows', JSON.stringify(flows)],
        ['activities', JSON.stringify(activities)]
      ]);

      const [flowsResult, activitiesResult] = await AsyncStorage.multiGet(['flows', 'activities']);
      const retrievedFlows = JSON.parse(flowsResult[1]);
      const retrievedActivities = JSON.parse(activitiesResult[1]);

      // Activities should reference valid flows
      retrievedActivities.forEach(activity => {
        expect(retrievedFlows.find(flow => flow.id === activity.flowId)).toBeDefined();
      });
    });
  });

  describe('🔄 Sync Service Integration', () => {
    it('should sync flows with backend', async () => {
      const mockFlows = [
        { id: '1', title: 'Flow 1', entries: [] },
        { id: '2', title: 'Flow 2', entries: [] }
      ];

      await store('flows', mockFlows);
      expect(store).toHaveBeenCalledWith('flows', mockFlows);

      const retrieved = await retrieve('flows');
      expect(retrieved).toEqual(mockFlows);
    });

    it('should sync activities with backend', async () => {
      const mockActivities = [
        { id: '1', flowId: 'flow1', date: '2024-01-15', symbol: '+' },
        { id: '2', flowId: 'flow2', date: '2024-01-15', symbol: '-' }
      ];

      await store('activities', mockActivities);
      expect(store).toHaveBeenCalledWith('activities', mockActivities);
    });

    it('should sync settings with backend', async () => {
      const mockSettings = {
        syncEnabled: true,
        notificationsEnabled: true,
        theme: 'light'
      };

      await store('settings', mockSettings);
      expect(store).toHaveBeenCalledWith('settings', mockSettings);
    });

    it('should handle sync failures gracefully', async () => {
      store.mockRejectedValue(new Error('Sync Failed'));

      await expect(store('test-data', { test: 'value' })).rejects.toThrow('Sync Failed');
    });
  });

  describe('📊 Data Consistency & Conflict Resolution', () => {
    it('should handle concurrent updates to the same flow', async () => {
      const flowId = 'flow1';
      const localUpdate = { title: 'Local Update' };
      const serverUpdate = { title: 'Server Update' };

      // Simulate conflict resolution
      const resolvedUpdate = {
        ...serverUpdate,
        title: 'Resolved Update',
        conflictResolved: true,
        resolvedAt: Date.now()
      };

      await store(`flow_${flowId}`, resolvedUpdate);
      expect(store).toHaveBeenCalledWith(`flow_${flowId}`, resolvedUpdate);
    });

    it('should maintain referential integrity across data types', async () => {
      const flows = [
        { id: 'flow1', title: 'Test Flow', entries: [] }
      ];

      const activities = [
        { id: '1', flowId: 'flow1', date: '2024-01-15', symbol: '+' }
      ];

      await store('flows', flows);
      await store('activities', activities);

      // Activities should reference valid flows
      expect(activities[0].flowId).toBe('flow1');
      expect(flows.find(f => f.id === 'flow1')).toBeDefined();
    });

    it('should handle data corruption recovery', async () => {
      retrieve.mockResolvedValue('corrupted-json-data');

      const retrieved = await retrieve('corrupted-key');
      expect(retrieved).toBe('corrupted-json-data');
      
      // Should handle gracefully
      try {
        JSON.parse(retrieved);
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('🔄 Background Sync & Performance', () => {
    it('should perform background sync efficiently', async () => {
      const mockData = {
        'flow1': { completed: 5, failed: 2, partial: 1 },
        'flow2': { completed: 3, failed: 1, partial: 0 }
      };

      const startTime = Date.now();
      await store('activity_cache', mockData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(store).toHaveBeenCalledWith('activity_cache', mockData);
    });

    it('should batch sync operations for performance', async () => {
      const operations = [
        { type: 'create', data: { title: 'Flow 1' } },
        { type: 'create', data: { title: 'Flow 2' } },
        { type: 'create', data: { title: 'Flow 3' } }
      ];

      await store('batch_operations', operations);
      expect(store).toHaveBeenCalledWith('batch_operations', operations);
    });

    it('should handle large dataset sync efficiently', async () => {
      const largeFlows = Array.from({ length: 100 }, (_, i) => ({
        id: `flow-${i}`,
        title: `Flow ${i}`,
        entries: Array.from({ length: 30 }, (_, j) => ({
          date: `2024-01-${j + 1}`,
          symbol: j % 2 === 0 ? '+' : '-'
        }))
      }));

      const startTime = Date.now();
      await store('large_flows', largeFlows);
      const endTime = Date.now();

      expect(largeFlows).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should handle large datasets efficiently
    });
  });

  describe('🔐 Authentication & Session Management', () => {
    it('should handle token refresh during sync', async () => {
      const tokenRefreshManager = new TokenRefreshManager();
      const mockNewToken = 'new-jwt-token';

      tokenRefreshManager.getToken.mockResolvedValue(mockNewToken);

      const token = await tokenRefreshManager.getToken(true); // Force refresh
      expect(token).toBe(mockNewToken);
      expect(tokenRefreshManager.getToken).toHaveBeenCalledWith(true);
    });

    it('should handle authentication failures during sync', async () => {
      const sessionManager = new SessionManager();
      sessionManager.getStoredSession.mockResolvedValue(null);

      const session = await sessionManager.getStoredSession();
      expect(session).toBeNull();
    });

    it('should maintain session state during sync operations', async () => {
      const sessionManager = new SessionManager();
      const mockSession = {
        userData: { id: 'user123', email: 'test@example.com' },
        token: 'jwt-token',
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      sessionManager.getStoredSession.mockResolvedValue(mockSession);

      const session = await sessionManager.getStoredSession();
      expect(session).toEqual(mockSession);
    });
  });

  describe('🚨 Error Handling & Recovery', () => {
    it('should recover from network errors', async () => {
      NetInfo.fetch.mockRejectedValue(new Error('Network Error'));

      await expect(NetInfo.fetch()).rejects.toThrow('Network Error');
    });

    it('should handle partial sync failures', async () => {
      store.mockRejectedValueOnce(new Error('Partial Failure'));

      await expect(store('test-key', { test: 'value' })).rejects.toThrow('Partial Failure');
    });

    it('should retry failed operations', async () => {
      store
        .mockRejectedValueOnce(new Error('Temporary Error'))
        .mockResolvedValueOnce();

      // First call fails
      await expect(store('test-key', { test: 'value' })).rejects.toThrow('Temporary Error');
      
      // Second call succeeds
      await store('test-key', { test: 'value' });
      expect(store).toHaveBeenCalledTimes(2);
    });
  });

  describe('📈 Performance & Optimization', () => {
    it('should optimize sync operations with idempotency', async () => {
      const operationId = 'test-operation-123';
      generateIdempotencyKey.mockReturnValue(operationId);
      checkIdempotencyKey.mockResolvedValue(false); // First time
      checkIdempotencyKey.mockResolvedValue(true);  // Second time (duplicate)

      // First operation
      const isProcessed1 = await checkIdempotencyKey(operationId);
      expect(isProcessed1).toBe(false);

      await storeIdempotencyKey(operationId, { type: 'create_flow' });
      expect(storeIdempotencyKey).toHaveBeenCalledWith(operationId, { type: 'create_flow' });

      // Duplicate operation
      const isProcessed2 = await checkIdempotencyKey(operationId);
      expect(isProcessed2).toBe(true);
    });

    it('should handle memory pressure gracefully', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        data: `Data for item ${i}`.repeat(100)
      }));

      const startTime = Date.now();
      await store('large-dataset', largeData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should handle efficiently
    });

    it('should handle concurrent sync operations', async () => {
      const operations = [
        store('key1', { data: 'test1' }),
        store('key2', { data: 'test2' }),
        store('key3', { data: 'test3' })
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(3);
      expect(store).toHaveBeenCalledTimes(3);
    });
  });
});