// utils/validation.js
import validator from 'validator';
import moment from 'moment';

// Comprehensive validation system for habit tracker
// Ensures data quality for habit creation, user inputs, and forms
// Usage: import { validateHabitName, createValidator } from './validation';

/**
 * Validates habit name
 * @param {string} name
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateHabitName = (name) => {
  if (!name || name.length < 3) return { valid: false, error: 'Name must be at least 3 characters' };
  if (name.length > 50) return { valid: false, error: 'Name must be under 50 characters' };
  return { valid: true, error: null };
};

/**
 * Validates email per RFC 5322
 * @param {string} email
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateEmail = (email) => {
  if (!validator.isEmail(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, error: null };
};

/**
 * Creates validator from schema
 * @param {object} schema - { field: (value) => { valid, error } }
 * @param {object} options
 * @returns {(data: object) => { valid: boolean, errors: object }}
 */
export const createValidator = (schema, options = { async: false }) => {
  return async (data) => {
    const errors = {};
    let valid = true;

    for (const [field, validatorFn] of Object.entries(schema)) {
      const result = options.async ? await validatorFn(data[field]) : validatorFn(data[field]);
      if (!result.valid) {
        valid = false;
        errors[field] = result.error;
      }
    }

    return { valid, errors };
  };
};

// Example schema
const habitSchema = {
  name: validateHabitName,
  // Add more fields
};