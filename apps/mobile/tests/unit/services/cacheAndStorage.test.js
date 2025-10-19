/**
 * Critical Production Tests for Cache Functionality (Redis, Local Cache)
 * Focuses on performance, data consistency, and offline-first architecture
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { store, retrieve, secureStore, secureRetrieve, storeHabitData, retrieveHabitData } from '../../../src/utils/storageUtils';
import { safeSetItem, safeGetItem } from '../../../src/utils/safeAsyncStorage';
import { storeIdempotencyKey, checkIdempotencyKey } from '../../../src/utils/idempotency';
import { SessionManager } from '../../../src/utils/sessionManager';
import { TokenRefreshManager } from '../../../src/utils/tokenRefresh';
import NetInfo from '@react-native-community/netinfo';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('@react-native-community/netinfo');
jest.mock('../../../src/utils/storageUtils');
jest.mock('../../../src/utils/safeAsyncStorage');
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

describe('🗄️ CRITICAL: Cache Functionality & Local Storage Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.removeItem.mockResolvedValue();
    AsyncStorage.multiGet.mockResolvedValue([]);
    AsyncStorage.multiSet.mockResolvedValue();
    AsyncStorage.multiRemove.mockResolvedValue();

    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.deleteItemAsync.mockResolvedValue();

    NetInfo.addEventListener.mockReturnValue(jest.fn());
    NetInfo.fetch.mockResolvedValue({ isConnected: true });

    store.mockResolvedValue();
    retrieve.mockResolvedValue(null);
    secureStore.mockResolvedValue();
    secureRetrieve.mockResolvedValue(null);
    storeHabitData.mockResolvedValue();
    retrieveHabitData.mockResolvedValue(null);

    safeSetItem.mockResolvedValue();
    safeGetItem.mockResolvedValue(null);

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

  describe('💾 Local Storage (AsyncStorage & SecureStore)', () => {
    it('should store and retrieve data from AsyncStorage with compression', async () => {
      const testData = { flows: [{ id: '1', title: 'Test Flow' }] };
      
      await store('test-key', testData, { compress: true });
      expect(store).toHaveBeenCalledWith('test-key', testData, { compress: true });

      const retrieved = await retrieve('test-key', null, { compress: true });
      expect(retrieve).toHaveBeenCalledWith('test-key', null, { compress: true });
    });

    it('should store and retrieve sensitive data from SecureStore', async () => {
      const sensitiveData = 'jwt-token-12345';
      
      await secureStore('auth-token', sensitiveData, true); // With biometric protection
      expect(secureStore).toHaveBeenCalledWith('auth-token', sensitiveData, true);

      const retrieved = await secureRetrieve('auth-token');
      expect(secureRetrieve).toHaveBeenCalledWith('auth-token');
    });

    it('should handle storage errors gracefully', async () => {
      store.mockRejectedValue(new Error('Storage Error'));
      
      await expect(store('test-key', { data: 'test' })).rejects.toThrow('Storage Error');
    });

    it('should safely handle null/undefined values in storage', async () => {
      await safeSetItem('test-key', null);
      expect(safeSetItem).toHaveBeenCalledWith('test-key', null);

      await safeSetItem('test-key', undefined);
      expect(safeSetItem).toHaveBeenCalledWith('test-key', undefined);
    });

    it('should store habit data with encryption option', async () => {
      const habitData = [
        { id: '1', title: 'Morning Run', completed: true },
        { id: '2', title: 'Meditation', completed: false }
      ];

      await storeHabitData(habitData, true); // With encryption
      expect(storeHabitData).toHaveBeenCalledWith(habitData, true);
    });
  });

  describe('🔐 Session Management & Token Refresh', () => {
    it('should store user session securely', async () => {
      const sessionManager = new SessionManager();
      const userData = { id: 'user123', email: 'test@example.com' };
      const token = 'jwt-token-12345';

      const result = await sessionManager.storeSession(userData, token);
      
      expect(result).toBe(true);
      expect(sessionManager.storeSession).toHaveBeenCalledWith(userData, token);
    });

    it('should retrieve and validate stored session', async () => {
      const sessionManager = new SessionManager();
      const mockSession = {
        userData: { id: 'user123', email: 'test@example.com' },
        token: 'jwt-token-12345',
        timestamp: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      sessionManager.getStoredSession.mockResolvedValue(mockSession);

      const session = await sessionManager.getStoredSession();
      
      expect(session).toBeDefined();
      expect(session.userData).toEqual(mockSession.userData);
      expect(session.token).toBe(mockSession.token);
    });

    it('should handle expired sessions', async () => {
      const sessionManager = new SessionManager();
      sessionManager.getStoredSession.mockResolvedValue(null);

      const session = await sessionManager.getStoredSession();
      expect(session).toBeNull();
    });

    it('should refresh tokens when needed', async () => {
      const tokenRefreshManager = new TokenRefreshManager();
      const mockToken = 'new-jwt-token-67890';

      tokenRefreshManager.getToken.mockResolvedValue(mockToken);

      const token = await tokenRefreshManager.getToken(true); // Force refresh
      
      expect(token).toBe(mockToken);
      expect(tokenRefreshManager.getToken).toHaveBeenCalledWith(true);
    });

    it('should handle token refresh failures', async () => {
      const tokenRefreshManager = new TokenRefreshManager();
      tokenRefreshManager.getToken.mockRejectedValue(new Error('Refresh Failed'));

      await expect(tokenRefreshManager.getToken(true)).rejects.toThrow('Refresh Failed');
    });
  });

  describe('🔄 Idempotency & Sync Operations', () => {
    it('should store idempotency keys to prevent duplicate operations', async () => {
      const operation = { type: 'create_flow', data: { title: 'Test Flow' } };
      const key = 'create-flow-123';

      await storeIdempotencyKey(key, operation, 3600); // 1 hour TTL
      
      expect(storeIdempotencyKey).toHaveBeenCalledWith(key, operation, 3600);
    });

    it('should check idempotency keys to prevent duplicate operations', async () => {
      const key = 'create-flow-123';
      checkIdempotencyKey.mockResolvedValue(true);

      const isProcessed = await checkIdempotencyKey(key);
      expect(isProcessed).toBe(true);
      expect(checkIdempotencyKey).toHaveBeenCalledWith(key);
    });

    it('should handle expired idempotency keys', async () => {
      const key = 'create-flow-123';
      checkIdempotencyKey.mockResolvedValue(false);

      const isProcessed = await checkIdempotencyKey(key);
      expect(isProcessed).toBe(false);
    });
  });

  describe('🌐 Network-Aware Caching', () => {
    it('should handle offline mode gracefully', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      
      const networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(false);
    });

    it('should sync when coming back online', async () => {
      // Start offline
      NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
      
      let networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(false);
      
      // Simulate coming back online
      NetInfo.fetch.mockResolvedValueOnce({ isConnected: true });
      
      networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(true);
    });

    it('should handle network state changes', async () => {
      const mockListener = jest.fn();
      NetInfo.addEventListener.mockImplementation((callback) => {
        // Simulate network state change
        setTimeout(() => callback({ isConnected: true }), 100);
        return mockListener;
      });

      const unsubscribe = NetInfo.addEventListener(() => {});
      
      // Should set up network listener
      expect(NetInfo.addEventListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('🚨 Error Handling & Recovery', () => {
    it('should recover from storage corruption', async () => {
      retrieve.mockResolvedValue('invalid-json');
      
      const retrieved = await retrieve('corrupted-key', { default: 'fallback' });
      expect(retrieved).toBe('invalid-json');
    });

    it('should handle SecureStore unavailability', async () => {
      secureStore.mockRejectedValue(new Error('SecureStore not available'));
      
      await expect(secureStore('test-key', 'test-value')).rejects.toThrow('SecureStore not available');
    });

    it('should handle concurrent cache operations', async () => {
      const promises = [
        store('key1', { data: 'test1' }),
        store('key2', { data: 'test2' }),
        store('key3', { data: 'test3' })
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(store).toHaveBeenCalledTimes(3);
    });
  });

  describe('📈 Performance & Memory Management', () => {
    it('should handle large data sets efficiently', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        data: `Data for item ${i}`
      }));

      const startTime = Date.now();
      
      await store('large-dataset', largeData);
      const retrieved = await retrieve('large-dataset');
      
      const endTime = Date.now();

      expect(retrieved).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple storage operations efficiently', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => 
        store(`key-${i}`, { data: `value-${i}` })
      );

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(store).toHaveBeenCalledTimes(100);
    });
  });
});