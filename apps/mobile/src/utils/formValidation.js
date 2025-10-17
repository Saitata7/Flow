// utils/formValidation.js
import { validateInput } from './validation';

/**
 * Form validation utilities for consistent validation feedback
 * Provides real-time validation and error handling across forms
 */

/**
 * Real-time validation for input fields
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {object} formData - Complete form data
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validateField = (field, value, formData = {}) => {
  switch (field) {
    case 'email':
      return validateInput('email', value);
    
    case 'password':
      return validateInput('password', value);
    
    case 'confirmPassword':
      return validateInput('password', value);
    
    case 'name':
    case 'displayName':
      return validateInput('title', value);
    
    case 'acceptTerms':
      return { 
        valid: value === true, 
        error: value === true ? null : 'You must accept the terms and conditions' 
      };
    
    default:
      return { valid: true, error: null };
  }
};

/**
 * Validate entire form and return all errors
 * @param {object} formData - Form data object
 * @param {string[]} fields - Array of field names to validate
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateForm = (formData, fields) => {
  const errors = {};
  let valid = true;

  fields.forEach(field => {
    const validation = validateField(field, formData[field], formData);
    if (!validation.valid) {
      valid = false;
      errors[field] = validation.error;
    }
  });

  return { valid, errors };
};

/**
 * Get validation state for a field (for UI feedback)
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {object} formData - Complete form data
 * @param {object} errors - Current form errors
 * @returns {{ isValid: boolean, hasError: boolean, errorMessage: string | null }}
 */
export const getFieldValidationState = (field, value, formData, errors) => {
  const validation = validateField(field, value, formData);
  const hasError = !!errors[field];
  const errorMessage = errors[field] || null;
  
  return {
    isValid: validation.valid && !hasError,
    hasError: hasError || (!validation.valid && value !== ''),
    errorMessage,
  };
};

/**
 * Common form validation schemas
 */
export const validationSchemas = {
  login: ['email', 'password'],
  register: ['name', 'email', 'password', 'confirmPassword', 'acceptTerms'],
  forgotPassword: ['email'],
  profile: ['displayName', 'email'],
};

/**
 * Validate form using predefined schema
 * @param {object} formData - Form data
 * @param {string} schema - Schema name
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateFormSchema = (formData, schema) => {
  const fields = validationSchemas[schema] || [];
  return validateForm(formData, fields);
};

/**
 * Get input style based on validation state
 * @param {object} validationState - Validation state from getFieldValidationState
 * @param {object} styles - Style object with input, inputError, etc.
 * @returns {object} Style object for input
 */
export const getInputStyle = (validationState, styles) => {
  if (validationState.hasError) {
    return [styles.input, styles.inputError];
  }
  return styles.input;
};

/**
 * Get error text style
 * @param {object} validationState - Validation state
 * @param {object} styles - Style object
 * @returns {object} Style object for error text
 */
export const getErrorTextStyle = (validationState, styles) => {
  if (validationState.hasError) {
    return styles.errorText;
  }
  return null;
};

/**
 * Debounced validation for real-time feedback
 * @param {function} validationFn - Validation function
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced validation function
 */
export const createDebouncedValidation = (validationFn, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        const result = validationFn(...args);
        resolve(result);
      }, delay);
    });
  };
};

/**
 * Password strength indicator
 * @param {string} password - Password to analyze
 * @returns {{ score: number, feedback: string[], strength: string }}
 */
export const getPasswordStrength = (password) => {
  if (!password) {
    return { score: 0, feedback: [], strength: 'weak' };
  }

  const feedback = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }

  let strength;
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return { score, feedback, strength };
};

/**
 * Email format suggestions
 * @param {string} email - Email to analyze
 * @returns {string[]} Array of suggestions
 */
export const getEmailSuggestions = (email) => {
  if (!email || !email.includes('@')) {
    return [];
  }

  const suggestions = [];
  const [localPart, domain] = email.split('@');

  // Common domain suggestions
  const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  
  if (domain && !commonDomains.includes(domain.toLowerCase())) {
    const similarDomain = commonDomains.find(d => 
      d.startsWith(domain.toLowerCase().substring(0, 2))
    );
    if (similarDomain) {
      suggestions.push(`${localPart}@${similarDomain}`);
    }
  }

  return suggestions;
};

/**
 * Form submission handler with validation
 * @param {object} formData - Form data
 * @param {string} schema - Validation schema name
 * @param {function} submitFn - Submit function
 * @param {function} setErrors - Function to set form errors
 * @param {function} setLoading - Function to set loading state
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const handleFormSubmission = async (formData, schema, submitFn, setErrors, setLoading) => {
  try {
    setLoading(true);
    setErrors({});

    // Validate form
    const validation = validateFormSchema(formData, schema);
    if (!validation.valid) {
      setErrors(validation.errors);
      return { success: false, error: 'Please fix the form errors' };
    }

    // Submit form
    const result = await submitFn(formData);
    return result;
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, error: error.message || 'An error occurred' };
  } finally {
    setLoading(false);
  }
};

export default {
  validateField,
  validateForm,
  validateFormSchema,
  getFieldValidationState,
  getInputStyle,
  getErrorTextStyle,
  createDebouncedValidation,
  getPasswordStrength,
  getEmailSuggestions,
  handleFormSubmission,
};
