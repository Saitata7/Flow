// utils/safeAsyncStorage.js
// Safe AsyncStorage wrapper to prevent undefined/null value errors

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safely set an item in AsyncStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {Promise<void>}
 */
export const safeSetItem = async (key, value) => {
  try {
    if (value === null || value === undefined) {
      console.warn(`⚠️ Attempted to store null/undefined value for key: ${key}. Removing item instead.`);
      await AsyncStorage.removeItem(key);
      return;
    }
    
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`❌ Error storing item ${key}:`, error);
    throw error;
  }
};

/**
 * Safely get an item from AsyncStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if item doesn't exist
 * @returns {Promise<any>}
 */
export const safeGetItem = async (key, defaultValue = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value);
  } catch (error) {
    console.error(`❌ Error retrieving item ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Safely remove an item from AsyncStorage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const safeRemoveItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`❌ Error removing item ${key}:`, error);
    throw error;
  }
};

/**
 * Safely store multiple items
 * @param {Object} items - Object with key-value pairs
 * @returns {Promise<void>}
 */
export const safeMultiSet = async (items) => {
  try {
    const safeItems = [];
    
    for (const [key, value] of Object.entries(items)) {
      if (value === null || value === undefined) {
        console.warn(`⚠️ Skipping null/undefined value for key: ${key}`);
        continue;
      }
      
      safeItems.push([key, JSON.stringify(value)]);
    }
    
    if (safeItems.length > 0) {
      await AsyncStorage.multiSet(safeItems);
    }
  } catch (error) {
    console.error('❌ Error storing multiple items:', error);
    throw error;
  }
};

/**
 * Safely get multiple items
 * @param {string[]} keys - Array of keys to retrieve
 * @returns {Promise<Object>} Object with key-value pairs
 */
export const safeMultiGet = async (keys) => {
  try {
    const results = await AsyncStorage.multiGet(keys);
    const parsedResults = {};
    
    for (const [key, value] of results) {
      if (value !== null) {
        try {
          parsedResults[key] = JSON.parse(value);
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse value for key ${key}:`, parseError);
          parsedResults[key] = value; // Return raw value if parsing fails
        }
      } else {
        parsedResults[key] = null;
      }
    }
    
    return parsedResults;
  } catch (error) {
    console.error('❌ Error retrieving multiple items:', error);
    throw error;
  }
};

export default {
  setItem: safeSetItem,
  getItem: safeGetItem,
  removeItem: safeRemoveItem,
  multiSet: safeMultiSet,
  multiGet: safeMultiGet,
};
