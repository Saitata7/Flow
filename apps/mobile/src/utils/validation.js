// src/utils/validation.js
/**
 * Universal validation utility for Flow mobile app
 * Provides input sanitization, length validation, and security checks
 */

/**
 * Sanitize text input to prevent XSS and SQL injection
 * @param {string} input - Input text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeTextInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .replace(/[;\\]/g, '') // Remove semicolons and backslashes
    .trim();
};

/**
 * Validate input based on type and constraints
 * @param {string} type - Type of input (title, description, username, etc.)
 * @param {string} value - Value to validate
 * @returns {object} - Validation result with valid flag and errors
 */
export const validateInput = (type, value) => {
  const errors = [];
  
  if (!value || typeof value !== 'string') {
    errors.push(`${type} is required`);
    return { valid: false, error: errors[0], errors };
  }

  const sanitized = sanitizeTextInput(value);
  
  switch (type) {
    case 'title':
      if (sanitized.length < 3) errors.push('Title must be at least 3 characters');
      if (sanitized.length > 20) errors.push('Title must be no more than 20 characters');
      break;
      
    case 'description':
      if (sanitized.length > 200) errors.push('Description must be no more than 200 characters');
      break;
      
    case 'username':
      if (sanitized.length < 3) errors.push('Username must be at least 3 characters');
      if (sanitized.length > 25) errors.push('Username must be no more than 25 characters');
      if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
      break;
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        errors.push('Please enter a valid email address');
      }
      break;
      
    case 'password':
      if (sanitized.length < 8) errors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(sanitized)) errors.push('Password must contain at least one uppercase letter');
      if (!/[0-9]/.test(sanitized)) errors.push('Password must contain at least one number');
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(sanitized)) {
        errors.push('Password must contain at least one special character: !@#$%^&*()_+-=[]{}|;:,.<>?');
      }
      break;
      
    default:
      // Generic validation
      if (sanitized.length === 0) errors.push(`${type} cannot be empty`);
  }
  
  return {
    valid: errors.length === 0,
    error: errors[0] || null,
    errors,
    sanitized: sanitized
  };
};

/**
 * Validate flow data before API submission
 * @param {object} flowData - Flow data to validate
 * @returns {object} - Validation result
 */
export const validateFlowData = (flowData) => {
  const errors = [];
  
  const titleValidation = validateInput('title', flowData.title);
  if (!titleValidation.valid) {
    errors.push(...titleValidation.errors);
  }
  
  if (flowData.description) {
    const descValidation = validateInput('description', flowData.description);
    if (!descValidation.valid) {
      errors.push(...descValidation.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...flowData,
      title: titleValidation.sanitized,
      description: flowData.description ? validateInput('description', flowData.description).sanitized : ''
    }
  };
};

/**
 * Validate plan data before API submission
 * @param {object} planData - Plan data to validate
 * @returns {object} - Validation result
 */
export const validatePlanData = (planData) => {
  const errors = [];
  
  const titleValidation = validateInput('title', planData.title);
  if (!titleValidation.valid) {
    errors.push(...titleValidation.errors);
  }
  
  if (planData.description) {
    const descValidation = validateInput('description', planData.description);
    if (!descValidation.valid) {
      errors.push(...descValidation.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...planData,
      title: titleValidation.sanitized,
      description: planData.description ? validateInput('description', planData.description).sanitized : ''
    }
  };
};

/**
 * Validate user profile data
 * @param {object} userData - User data to validate
 * @returns {object} - Validation result
 */
export const validateUserData = (userData) => {
  const errors = [];
  
  if (userData.username) {
    const usernameValidation = validateInput('username', userData.username);
    if (!usernameValidation.valid) {
      errors.push(...usernameValidation.errors);
    }
  }
  
  if (userData.email) {
    const emailValidation = validateInput('email', userData.email);
    if (!emailValidation.valid) {
      errors.push(...emailValidation.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData: {
      ...userData,
      username: userData.username ? validateInput('username', userData.username).sanitized : userData.username,
      email: userData.email ? validateInput('email', userData.email).sanitized : userData.email
    }
  };
};

/**
 * Validate numeric input with min/max constraints
 * @param {string|number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of the field for error messages
 * @returns {object} - Validation result
 */
export const validateNumericInput = (value, min, max, fieldName = 'Value') => {
  const errors = [];
  
  if (value === '' || value === null || value === undefined) {
    errors.push(`${fieldName} is required`);
    return { valid: false, errors, sanitized: '' };
  }
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    errors.push(`${fieldName} must be a valid number`);
    return { valid: false, errors, sanitized: '' };
  }
  
  if (numericValue < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }
  
  if (numericValue > max) {
    errors.push(`${fieldName} must be no more than ${max}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized: numericValue.toString()
  };
};

/**
 * Validate session token
 * @param {string} token - Session token to validate
 * @returns {object} - Validation result
 */
export const validateSessionToken = (token) => {
  const errors = [];
  
  if (!token) {
    errors.push('Session token is required');
    return { valid: false, errors };
  }
  
  if (typeof token !== 'string') {
    errors.push('Session token must be a string');
    return { valid: false, errors };
  }
  
  if (token.length < 10) {
    errors.push('Session token is too short');
    return { valid: false, errors };
  }
  
  // Basic JWT structure check (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    errors.push('Session token format is invalid');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate session data
 * @param {object} sessionData - Session data to validate
 * @returns {object} - Validation result
 */
export const validateSessionData = (sessionData) => {
  const errors = [];
  
  if (!sessionData) {
    errors.push('Session data is required');
    return { valid: false, errors };
  }
  
  if (!sessionData.userData) {
    errors.push('User data is required in session');
    return { valid: false, errors };
  }
  
  // Validate user data
  const userValidation = validateUserData(sessionData.userData);
  if (!userValidation.valid) {
    errors.push(...userValidation.errors);
  }
  
  // Validate session metadata
  if (sessionData.expiresAt && typeof sessionData.expiresAt !== 'number') {
    errors.push('Session expiration must be a number');
  }
  
  if (sessionData.lastTokenRefresh && typeof sessionData.lastTokenRefresh !== 'number') {
    errors.push('Last token refresh must be a number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};