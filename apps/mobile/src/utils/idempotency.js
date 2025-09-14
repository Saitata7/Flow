// utils/idempotency.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

// Idempotency system to prevent duplicate operations (e.g., double-tap completions)
// Uses timestamp-based string concatenation for simplicity, avoiding external dependencies
// Usage: import { generateIdempotencyKey, isOperationProcessed } from './idempotency';

/**
 * Generates a unique idempotency key for operations
 * @param {string} operation - Operation type (e.g., 'login', 'habit_completion')
 * @param {string} userId - User identifier
 * @param {string|Date} timestamp - Timestamp for the operation
 * @returns {string} - Unique idempotency key
 */
export const generateIdempotencyKey = (operation, userId, timestamp) => {
  const timestampStr = moment(timestamp).toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 10); // Simple random suffix
  return `${operation}_${userId}_${timestampStr}_${randomSuffix}`.replace(/[^a-zA-Z0-9]/g, '_');
};

/**
 * Generates a unique identifier (simple random string for fallback)
 * @returns {string} - Unique identifier
 */
export const generateUUIDv4 = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

/**
 * Stores idempotency key with operation data
 * @param {string} key - Idempotency key
 * @param {object} operation - Operation details
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<void>}
 */
export const storeIdempotencyKey = async (key, operation, ttl = 24 * 60 * 60) => {
  try {
    const data = { operation, expiresAt: Date.now() + ttl * 1000 };
    await AsyncStorage.setItem(`idempotency:${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Idempotency key storage error:', err);
  }
};

/**
 * Checks if an operation was processed
 * @param {string} key - Idempotency key
 * @returns {Promise<boolean>} - True if operation was processed and not expired
 */
export const isOperationProcessed = async (key) => {
  try {
    const data = await AsyncStorage.getItem(`idempotency:${key}`);
    if (!data) return false;
    const { expiresAt } = JSON.parse(data);
    return expiresAt > Date.now();
  } catch (err) {
    console.error('Idempotency key retrieval error:', err);
    return false;
  }
};

/**
 * Generates idempotency key for habit completion
 * @param {string} habitId - Habit identifier
 * @param {Date} date - Completion date
 * @param {string} userId - User identifier
 * @returns {string} - Idempotency key
 */
export const generateHabitCompletionKey = (habitId, date, userId) =>
  generateIdempotencyKey('habit_completion', userId, `${habitId}:${moment(date).toISOString()}`);

/**
 * Prevents duplicate habit completions
 * @param {string} habitId - Habit identifier
 * @param {Date} date - Completion date
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} - True if operation is a duplicate
 */
export const preventDuplicateCompletion = async (habitId, date, userId) => {
  const key = generateHabitCompletionKey(habitId, date, userId);
  return isOperationProcessed(key);
};