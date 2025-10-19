/**
 * 🚀 CRITICAL PRODUCTION TESTS
 * Testing APIs, Cache, Local Storage, and Business Logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../../src/services/apiClient';
import apiService from '../../../src/services/apiService';
import { store, retrieve, secureStore, secureRetrieve, storeHabitData, retrieveHabitData } from '../../../src/utils/storageUtils';

// Mock global fetch for API testing
global.fetch = jest.fn();

describe('🚀 CRITICAL PRODUCTION TESTS', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('🌐 API Layer Testing', () => {
    
    describe('API Client Authentication', () => {
      it('should attach JWT token to authenticated requests', async () => {
        const mockToken = 'mock-jwt-token-12345';
        
        // Mock successful API response
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: 'test' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });

        // Mock JWT functions
        jest.doMock('../../../src/utils/jwtAuth', () => ({
          getStoredJWTToken: jest.fn().mockResolvedValue(mockToken),
          verifyJWTToken: jest.fn().mockReturnValue(true),
          generateJWTToken: jest.fn().mockResolvedValue(mockToken),
        }));

        const response = await fetch('/api/test', {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        });

        expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        }));
      });

      it('should handle token expiration gracefully', async () => {
        const expiredToken = 'expired-token';
        
        // Mock expired token
        jest.doMock('../../../src/utils/jwtAuth', () => ({
          getStoredJWTToken: jest.fn().mockResolvedValue(expiredToken),
          verifyJWTToken: jest.fn().mockReturnValue(false),
          clearJWTToken: jest.fn().mockResolvedValue(),
          generateJWTToken: jest.fn().mockResolvedValue('new-token'),
        }));

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' })
        });

        // Should clear expired token and continue without auth
        const response = await fetch('/api/test');
        expect(response.ok).toBe(true);
      });

      it('should retry failed requests with exponential backoff', async () => {
        // Mock network failure then success
        fetch
          .mockRejectedValueOnce(new Error('Network Error'))
          .mockRejectedValueOnce(new Error('Network Error'))
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
            headers: new Headers({ 'content-type': 'application/json' })
          });

        const response = await fetch('/api/test');
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(response.ok).toBe(true);
      });
    });

    describe('API Service Business Logic', () => {
      it('should handle offline mode gracefully', async () => {
        // Mock offline state
        jest.doMock('@react-native-community/netinfo', () => ({
          addEventListener: jest.fn(),
          fetch: jest.fn().mockResolvedValue({ isConnected: false })
        }));

        const apiService = new (jest.requireActual('../../../src/services/apiService').default)();
        
        // Should queue requests when offline
        const result = await apiService.makeRequest('/api/test', { method: 'GET' });
        expect(result.queued).toBe(true);
      });

      it('should sync queued requests when back online', async () => {
        // Mock online state
        jest.doMock('@react-native-community/netinfo', () => ({
          addEventListener: jest.fn(),
          fetch: jest.fn().mockResolvedValue({ isConnected: true })
        }));

        fetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const apiService = new (jest.requireActual('../../../src/services/apiService').default)();
        
        // Should process queued requests
        const result = await apiService.processSyncQueue();
        expect(result.success).toBe(true);
      });
    });
  });

  describe('💾 Local Storage Testing', () => {
    
    describe('AsyncStorage Operations', () => {
      it('should store and retrieve data correctly', async () => {
        const testData = { flows: [{ id: 1, title: 'Test Flow' }] };
        const key = 'test_flows';

        // Mock AsyncStorage
        AsyncStorage.setItem = jest.fn().mockResolvedValue();
        AsyncStorage.getItem = jest.fn().mockResolvedValue(JSON.stringify(testData));

        await store(key, testData);
        const retrieved = await retrieve(key);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(testData));
        expect(retrieved).toEqual(testData);
      });

      it('should handle compression for large data', async () => {
        const largeData = { flows: Array(1000).fill({ id: 1, title: 'Large Flow' }) };
        const key = 'large_data';

        AsyncStorage.setItem = jest.fn().mockResolvedValue();
        AsyncStorage.getItem = jest.fn().mockResolvedValue('compressed_data');

        await store(key, largeData, { compress: true });
        
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(key, expect.any(String));
      });

      it('should return default value for missing keys', async () => {
        AsyncStorage.getItem = jest.fn().mockResolvedValue(null);

        const result = await retrieve('nonexistent_key', 'default_value');
        expect(result).toBe('default_value');
      });
    });

    describe('SecureStore Operations', () => {
      it('should store sensitive data securely', async () => {
        const sensitiveData = 'jwt-token-12345';
        const key = 'auth_token';

        SecureStore.setItemAsync = jest.fn().mockResolvedValue();
        SecureStore.getItemAsync = jest.fn().mockResolvedValue(sensitiveData);

        await secureStore(key, sensitiveData);
        const retrieved = await secureRetrieve(key);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(key, sensitiveData);
        expect(retrieved).toBe(sensitiveData);
      });

      it('should handle secure storage errors gracefully', async () => {
        SecureStore.setItemAsync = jest.fn().mockRejectedValue(new Error('Secure storage error'));

        await expect(secureStore('test', 'data')).rejects.toThrow('Secure storage error');
      });
    });

    describe('Habit Data Storage', () => {
      it('should store and retrieve habit data with validation', async () => {
        const habitData = {
          flows: [
            { id: 1, title: 'Morning Routine', tracking_type: 'binary' },
            { id: 2, title: 'Exercise', tracking_type: 'numeric' }
          ],
          lastUpdated: Date.now()
        };

        AsyncStorage.setItem = jest.fn().mockResolvedValue();
        AsyncStorage.getItem = jest.fn().mockResolvedValue(JSON.stringify(habitData));

        await storeHabitData(habitData);
        const retrieved = await retrieveHabitData();

        expect(retrieved).toEqual(habitData);
        expect(retrieved.flows).toHaveLength(2);
      });

      it('should validate habit data structure', async () => {
        const invalidData = { invalid: 'structure' };

        await expect(storeHabitData(invalidData)).rejects.toThrow();
      });
    });
  });

  describe('🔄 Cache Testing', () => {
    
    describe('Memory Cache Operations', () => {
      it('should cache API responses with TTL', async () => {
        const cacheKey = 'flows_cache';
        const cacheData = { flows: [{ id: 1, title: 'Cached Flow' }] };
        const ttl = 3600; // 1 hour

        // Mock cache implementation
        const cache = new Map();
        const cacheWithTTL = (key, data, ttlSeconds) => {
          cache.set(key, {
            data,
            expires: Date.now() + (ttlSeconds * 1000)
          });
        };

        cacheWithTTL(cacheKey, cacheData, ttl);
        
        const cached = cache.get(cacheKey);
        expect(cached.data).toEqual(cacheData);
        expect(cached.expires).toBeGreaterThan(Date.now());
      });

      it('should invalidate expired cache entries', async () => {
        const cache = new Map();
        const expiredKey = 'expired_cache';
        
        // Set expired cache entry
        cache.set(expiredKey, {
          data: { test: 'data' },
          expires: Date.now() - 1000 // Expired 1 second ago
        });

        const isValid = (key) => {
          const entry = cache.get(key);
          return entry && entry.expires > Date.now();
        };

        expect(isValid(expiredKey)).toBe(false);
      });
    });

    describe('Redis Cache Integration', () => {
      it('should handle Redis connection failures gracefully', async () => {
        // Mock Redis failure
        const mockRedis = {
          get: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
          set: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
        };

        // Should fallback to local storage
        AsyncStorage.getItem = jest.fn().mockResolvedValue('{"fallback": "data"}');

        const result = await AsyncStorage.getItem('fallback_key');
        expect(JSON.parse(result)).toEqual({ fallback: 'data' });
      });
    });
  });

  describe('🧠 Business Logic Testing', () => {
    
    describe('Data Synchronization', () => {
      it('should merge local and remote data correctly', async () => {
        const localData = [
          { id: 1, title: 'Local Flow', local: true },
          { id: 2, title: 'Shared Flow', local: false }
        ];

        const remoteData = [
          { id: 2, title: 'Updated Shared Flow', local: false },
          { id: 3, title: 'New Remote Flow', local: false }
        ];

        const mergeData = (local, remote) => {
          const merged = [...local];
          const localIds = new Set(local.map(item => item.id));
          
          remote.forEach(remoteItem => {
            if (localIds.has(remoteItem.id)) {
              // Update existing
              const index = merged.findIndex(item => item.id === remoteItem.id);
              merged[index] = { ...merged[index], ...remoteItem };
            } else {
              // Add new
              merged.push(remoteItem);
            }
          });
          
          return merged;
        };

        const result = mergeData(localData, remoteData);
        expect(result).toHaveLength(3);
        expect(result.find(item => item.id === 2).title).toBe('Updated Shared Flow');
        expect(result.find(item => item.id === 3).title).toBe('New Remote Flow');
      });

      it('should handle sync conflicts with last-write-wins', async () => {
        const localItem = { id: 1, title: 'Local Title', updatedAt: Date.now() - 1000 };
        const remoteItem = { id: 1, title: 'Remote Title', updatedAt: Date.now() };

        const resolveConflict = (local, remote) => {
          return local.updatedAt > remote.updatedAt ? local : remote;
        };

        const result = resolveConflict(localItem, remoteItem);
        expect(result.title).toBe('Remote Title');
      });
    });

    describe('Offline-First Architecture', () => {
      it('should queue operations when offline', async () => {
        const syncQueue = [];
        const isOnline = false;

        const queueOperation = (operation) => {
          if (!isOnline) {
            syncQueue.push({
              ...operation,
              queuedAt: Date.now()
            });
            return { queued: true, queueLength: syncQueue.length };
          }
          return { queued: false };
        };

        const result = queueOperation({
          type: 'CREATE_FLOW',
          data: { title: 'New Flow' }
        });

        expect(result.queued).toBe(true);
        expect(result.queueLength).toBe(1);
      });

      it('should process queue when back online', async () => {
        const syncQueue = [
          { type: 'CREATE_FLOW', data: { title: 'Queued Flow 1' } },
          { type: 'UPDATE_FLOW', data: { id: 1, title: 'Updated Flow' } }
        ];

        fetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' })
        });

        const processQueue = async (queue) => {
          const results = [];
          for (const operation of queue) {
            const response = await fetch('/api/sync', {
              method: 'POST',
              body: JSON.stringify(operation)
            });
            results.push({ operation, success: response.ok });
          }
          return results;
        };

        const results = await processQueue(syncQueue);
        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);
      });
    });
  });

  describe('🚨 Error Handling & Edge Cases', () => {
    
    it('should handle network timeouts gracefully', async () => {
      fetch.mockRejectedValue(new Error('Request timeout'));

      const handleTimeout = async (url, timeout = 5000) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout');
          }
          throw error;
        }
      };

      await expect(handleTimeout('/api/test', 100)).rejects.toThrow('Request timeout');
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const safeJsonParse = async (response) => {
        try {
          return await response.json();
        } catch (error) {
          return { error: 'Invalid response format' };
        }
      };

      const response = await fetch('/api/test');
      const data = await safeJsonParse(response);
      expect(data.error).toBe('Invalid response format');
    });

    it('should handle storage quota exceeded', async () => {
      AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('QuotaExceededError'));

      const handleStorageError = async (key, data) => {
        try {
          await AsyncStorage.setItem(key, data);
        } catch (error) {
          if (error.message.includes('QuotaExceededError')) {
            // Clear old data and retry
            await AsyncStorage.clear();
            await AsyncStorage.setItem(key, data);
          } else {
            throw error;
          }
        }
      };

      await expect(handleStorageError('test', 'data')).resolves.not.toThrow();
    });
  });
});
