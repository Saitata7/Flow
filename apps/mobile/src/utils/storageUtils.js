// utils/storageUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { compress, decompress } from 'lz-string'; // Assume installed

// Secure, performant storage system for habit tracker
// Supports sensitive data (tokens) and app data (habits, preferences)
// Usage: import { store, secureStore, storeHabitData } from './storageUtils';

/**
 * Stores data in AsyncStorage with compression
 * @param {string} key
 * @param {any} value
 * @param {object} options
 * @returns {Promise<void>}
 */
export const store = async (key, value, options = { compress: false }) => {
  const data = options.compress ? compress(JSON.stringify(value)) : JSON.stringify(value);
  await AsyncStorage.setItem(key, data);
};

/**
 * Retrieves data from AsyncStorage
 * @param {string} key
 * @param {any} defaultValue
 * @returns {Promise<any>}
 */
export const retrieve = async (key, defaultValue = null) => {
  const data = await AsyncStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(decompress(data) || data);
  } catch {
    return defaultValue;
  }
};

/**
 * Stores sensitive data in Keychain/SecureStore
 * @param {string} key
 * @param {string} value
 * @param {boolean} biometricProtection
 * @returns {Promise<void>}
 */
export const secureStore = async (key, value, biometricProtection = false) => {
  await SecureStore.setItemAsync(key, value, {
    requireAuthentication: biometricProtection,
  });
};

/**
 * Stores habit data with encryption option
 * @param {object[]} habits
 * @param {boolean} encrypted
 * @returns {Promise<void>}
 */
export const storeHabitData = async (habits, encrypted = false) => {
  if (encrypted) {
    await secureStore('habits', JSON.stringify(habits), true);
  } else {
    await store('habits', habits, { compress: true });
  }
};