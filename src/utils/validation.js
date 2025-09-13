// utils/validation.js
import validator from 'validator';
import moment from 'moment';

// Comprehensive validation system for Flow tracker
// Ensures data quality for flow creation, user inputs, and forms
// Usage: import { validateFlowTitle, validateFlowData, createValidator } from './validation';

/**
 * Validates flow title
 * @param {string} title
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateFlowTitle = (title) => {
  if (!title || !title.trim()) return { valid: false, error: 'Title is required' };
  if (title.trim().length < 3) return { valid: false, error: 'Title must be at least 3 characters' };
  if (title.trim().length > 100) return { valid: false, error: 'Title must be under 100 characters' };
  return { valid: true, error: null };
};

/**
 * Validates flow description
 * @param {string} description
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateFlowDescription = (description) => {
  if (description && description.length > 500) return { valid: false, error: 'Description must be under 500 characters' };
  return { valid: true, error: null };
};

/**
 * Validates tracking type
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateTrackingType = (trackingType) => {
  const validTypes = ['Binary', 'Quantitative', 'Time-based'];
  if (!validTypes.includes(trackingType)) return { valid: false, error: 'Invalid tracking type' };
  return { valid: true, error: null };
};

/**
 * Validates frequency
 * @param {string} frequency
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateFrequency = (frequency) => {
  const validFrequencies = ['Daily', 'Monthly'];
  if (!validFrequencies.includes(frequency)) return { valid: false, error: 'Invalid frequency' };
  return { valid: true, error: null };
};

/**
 * Validates selected days for frequency
 * @param {string[]} selectedDays
 * @param {string} frequency
 * @param {boolean} everyDay
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateSelectedDays = (selectedDays, frequency, everyDay) => {
  if (frequency === 'Daily' && !everyDay && (!selectedDays || selectedDays.length === 0)) {
    return { valid: false, error: 'Please select at least one day or enable "Every Day"' };
  }
  if (frequency === 'Monthly' && (!selectedDays || selectedDays.length === 0)) {
    return { valid: false, error: 'Please select at least one day of the month' };
  }
  return { valid: true, error: null };
};

/**
 * Validates unit text for quantitative tracking
 * @param {string} unitText
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateUnitText = (unitText, trackingType) => {
  if (trackingType === 'Quantitative') {
    if (!unitText || !unitText.trim()) return { valid: false, error: 'Unit is required for Quantitative tracking' };
    if (unitText.trim().length > 20) return { valid: false, error: 'Unit must be under 20 characters' };
  }
  return { valid: true, error: null };
};

/**
 * Validates goal for quantitative tracking
 * @param {number|string} goal
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateGoal = (goal, trackingType) => {
  if (trackingType === 'Quantitative' && goal !== undefined && goal !== null && goal !== '') {
    const numGoal = typeof goal === 'string' ? parseInt(goal) : goal;
    if (isNaN(numGoal) || numGoal < 0) return { valid: false, error: 'Goal must be a non-negative number' };
    if (numGoal > 9999) return { valid: false, error: 'Goal must be under 9999' };
  }
  return { valid: true, error: null };
};

/**
 * Validates time-based duration
 * @param {number} hours
 * @param {number} minutes
 * @param {number} seconds
 * @param {string} trackingType
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateTimeDuration = (hours, minutes, seconds, trackingType) => {
  if (trackingType === 'Time-based') {
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return { valid: false, error: 'Please set a non-zero goal duration for Time-based tracking' };
    }
    if (hours < 0 || hours > 23) return { valid: false, error: 'Hours must be between 0 and 23' };
    if (minutes < 0 || minutes > 59) return { valid: false, error: 'Minutes must be between 0 and 59' };
    if (seconds < 0 || seconds > 59) return { valid: false, error: 'Seconds must be between 0 and 59' };
  }
  return { valid: true, error: null };
};

/**
 * Validates reminder time
 * @param {Date|string|null} reminderTime
 * @param {boolean} reminderTimeEnabled
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateReminderTime = (reminderTime, reminderTimeEnabled) => {
  if (reminderTimeEnabled && reminderTime) {
    const time = moment(reminderTime);
    if (!time.isValid()) return { valid: false, error: 'Invalid reminder time format' };
  }
  return { valid: true, error: null };
};

/**
 * Validates reminder level
 * @param {string|number} reminderLevel
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateReminderLevel = (reminderLevel) => {
  const validLevels = ['1', '2', '3', 1, 2, 3];
  if (!validLevels.includes(reminderLevel)) return { valid: false, error: 'Invalid reminder level' };
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
 * Validates numeric input
 * @param {string|number} value
 * @param {number} min
 * @param {number} max
 * @param {string} fieldName
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateNumericInput = (value, min = 0, max = 9999, fieldName = 'Value') => {
  if (value === '' || value === null || value === undefined) return { valid: true, error: null };
  
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(numValue)) return { valid: false, error: `${fieldName} must be a valid number` };
  if (numValue < min) return { valid: false, error: `${fieldName} must be at least ${min}` };
  if (numValue > max) return { valid: false, error: `${fieldName} must be at most ${max}` };
  
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

/**
 * Comprehensive flow validation schema
 */
export const flowValidationSchema = {
  title: validateFlowTitle,
  description: validateFlowDescription,
  trackingType: validateTrackingType,
  frequency: validateFrequency,
  unitText: (value, data) => validateUnitText(value, data.trackingType),
  goal: (value, data) => validateGoal(value, data.trackingType),
  hours: (value, data) => validateTimeDuration(value, data.minutes, data.seconds, data.trackingType),
  minutes: (value, data) => validateTimeDuration(data.hours, value, data.seconds, data.trackingType),
  seconds: (value, data) => validateTimeDuration(data.hours, data.minutes, value, data.trackingType),
  reminderTime: (value, data) => validateReminderTime(value, data.reminderTimeEnabled),
  reminderLevel: validateReminderLevel,
  selectedDays: (value, data) => validateSelectedDays(value, data.frequency, data.everyDay),
};

/**
 * Validates complete flow data
 * @param {object} flowData
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateFlowData = async (flowData) => {
  const validator = createValidator(flowValidationSchema);
  return await validator(flowData);
};