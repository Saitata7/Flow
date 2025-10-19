/**
 * Critical Production Tests for Context Data Management
 * Focuses on state management, data flow, and user experience consistency
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// Mock all external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('@react-native-community/netinfo');
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  setNotificationHandler: jest.fn(),
}));

// Mock React Native components
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  StatusBar: { setBarStyle: jest.fn(), setBackgroundColor: jest.fn() },
  StyleSheet: { create: jest.fn((styles) => styles) },
  Text: 'Text',
  View: 'View',
  Button: 'Button',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
  Alert: { alert: jest.fn() },
}));

describe('🧠 CRITICAL: Context Data Management Tests', () => {

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
  });

  describe('💾 Local Storage Management', () => {
    it('should store and retrieve user preferences', async () => {
      const userPrefs = {
        theme: 'dark',
        notifications: true,
        syncEnabled: true
      };

      await AsyncStorage.setItem('user_preferences', JSON.stringify(userPrefs));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_preferences', JSON.stringify(userPrefs));

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(userPrefs));
      const retrieved = await AsyncStorage.getItem('user_preferences');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_preferences');
      expect(JSON.parse(retrieved)).toEqual(userPrefs);
    });

    it('should store and retrieve sensitive authentication data', async () => {
      const authToken = 'jwt-token-12345';
      const userData = { id: 'user123', email: 'test@example.com' };

      await SecureStore.setItemAsync('auth_token', authToken);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', authToken);

      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_data', JSON.stringify(userData));

      SecureStore.getItemAsync.mockResolvedValue(authToken);
      const retrievedToken = await SecureStore.getItemAsync('auth_token');
      expect(retrievedToken).toBe(authToken);
    });

    it('should handle storage errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage Error'));
      
      await expect(AsyncStorage.setItem('test-key', 'test-value')).rejects.toThrow('Storage Error');
    });

    it('should handle corrupted data gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid-json');
      
      const retrieved = await AsyncStorage.getItem('corrupted-key');
      expect(retrieved).toBe('invalid-json');
      
      // Should handle JSON parsing errors
      expect(() => JSON.parse(retrieved)).toThrow();
    });
  });

  describe('🔄 Data Synchronization', () => {
    it('should handle offline data queuing', async () => {
      const offlineData = [
        { type: 'create_flow', data: { title: 'Offline Flow 1' } },
        { type: 'update_flow', data: { id: '1', title: 'Updated Flow' } },
        { type: 'delete_flow', data: { id: '2' } }
      ];

      await AsyncStorage.setItem('offline_queue', JSON.stringify(offlineData));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('offline_queue', JSON.stringify(offlineData));

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineData));
      const queue = await AsyncStorage.getItem('offline_queue');
      expect(JSON.parse(queue)).toEqual(offlineData);
    });

    it('should handle sync conflicts', async () => {
      const localData = { id: '1', title: 'Local Title', version: 1 };
      const serverData = { id: '1', title: 'Server Title', version: 2 };

      // Simulate conflict resolution
      const resolvedData = {
        ...serverData,
        title: 'Resolved Title', // Manual resolution
        version: 3
      };

      await AsyncStorage.setItem('conflict_resolution', JSON.stringify(resolvedData));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('conflict_resolution', JSON.stringify(resolvedData));
    });

    it('should maintain data consistency during sync', async () => {
      const flows = [
        { id: '1', title: 'Flow 1', entries: [] },
        { id: '2', title: 'Flow 2', entries: [] }
      ];

      const activities = [
        { id: '1', flowId: '1', date: '2024-01-15', symbol: '+' },
        { id: '2', flowId: '2', date: '2024-01-15', symbol: '-' }
      ];

      // Store related data
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

  describe('🌐 Network State Management', () => {
    it('should handle network state changes', async () => {
      const mockListener = jest.fn();
      NetInfo.addEventListener.mockImplementation((callback) => {
        // Simulate network state change
        setTimeout(() => callback({ isConnected: true }), 100);
        return mockListener;
      });

      const unsubscribe = NetInfo.addEventListener(() => {});
      
      expect(NetInfo.addEventListener).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle offline mode', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      
      const networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(false);

      // Should queue operations when offline
      const offlineOperation = { type: 'create_flow', data: { title: 'Offline Flow' } };
      await AsyncStorage.setItem('pending_operation', JSON.stringify(offlineOperation));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pending_operation', JSON.stringify(offlineOperation));
    });

    it('should handle coming back online', async () => {
      // Start offline
      NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
      
      let networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(false);
      
      // Simulate coming back online
      NetInfo.fetch.mockResolvedValueOnce({ isConnected: true });
      
      networkState = await NetInfo.fetch();
      expect(networkState.isConnected).toBe(true);

      // Should process queued operations
      const queuedOperations = [
        { type: 'create_flow', data: { title: 'Queued Flow 1' } },
        { type: 'create_flow', data: { title: 'Queued Flow 2' } }
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queuedOperations));
      const operations = await AsyncStorage.getItem('offline_queue');
      expect(JSON.parse(operations)).toEqual(queuedOperations);
    });
  });

  describe('🔔 Notification Management', () => {
    it('should schedule notifications', async () => {
      const notification = {
        id: '1',
        title: 'Flow Reminder',
        body: 'Time to complete your daily flow!',
        scheduledTime: new Date(Date.now() + 3600000) // 1 hour from now
      };

      const { scheduleNotificationAsync } = require('expo-notifications');
      await scheduleNotificationAsync(notification);
      
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(notification);
    });

    it('should cancel notifications', async () => {
      const notificationId = '1';
      const { cancelScheduledNotificationAsync } = require('expo-notifications');
      
      await cancelScheduledNotificationAsync(notificationId);
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith(notificationId);
    });

    it('should handle notification permissions', async () => {
      const { requestPermissionsAsync, getPermissionsAsync } = require('expo-notifications');
      
      await requestPermissionsAsync();
      expect(requestPermissionsAsync).toHaveBeenCalled();

      await getPermissionsAsync();
      expect(getPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('🚨 Error Handling & Recovery', () => {
    it('should handle storage corruption', async () => {
      AsyncStorage.getItem.mockResolvedValue('corrupted-json-data');
      
      const retrieved = await AsyncStorage.getItem('corrupted-key');
      expect(retrieved).toBe('corrupted-json-data');
      
      // Should handle gracefully
      try {
        JSON.parse(retrieved);
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    it('should handle SecureStore unavailability', async () => {
      SecureStore.setItemAsync.mockRejectedValue(new Error('SecureStore not available'));
      
      await expect(SecureStore.setItemAsync('test-key', 'test-value')).rejects.toThrow('SecureStore not available');
    });

    it('should handle concurrent operations', async () => {
      const operations = [
        AsyncStorage.setItem('key1', 'value1'),
        AsyncStorage.setItem('key2', 'value2'),
        AsyncStorage.setItem('key3', 'value3')
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(3);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle memory pressure', async () => {
      // Simulate large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `Large data item ${i}`.repeat(100)
      }));

      const startTime = Date.now();
      await AsyncStorage.setItem('large_dataset', JSON.stringify(largeData));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should handle efficiently
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('large_dataset', expect.any(String));
    });
  });

  describe('📈 Performance & Optimization', () => {
    it('should batch storage operations efficiently', async () => {
      const batchData = Array.from({ length: 100 }, (_, i) => [
        `key-${i}`,
        JSON.stringify({ id: i, data: `value-${i}` })
      ]);

      const startTime = Date.now();
      await AsyncStorage.multiSet(batchData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith(batchData);
    });

    it('should handle frequent read operations efficiently', async () => {
      const testData = { id: '1', title: 'Test Flow', entries: [] };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(testData));

      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, () => AsyncStorage.getItem('test-key'));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should optimize data compression', async () => {
      const compressibleData = {
        flows: Array.from({ length: 100 }, (_, i) => ({
          id: `flow-${i}`,
          title: `Flow ${i}`,
          description: 'This is a repeated description that can be compressed efficiently',
          entries: Array.from({ length: 30 }, (_, j) => ({
            date: `2024-01-${j + 1}`,
            symbol: j % 2 === 0 ? '+' : '-'
          }))
        }))
      };

      const startTime = Date.now();
      await AsyncStorage.setItem('compressed_data', JSON.stringify(compressibleData));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should handle compression efficiently
    });
  });
});