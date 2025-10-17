/**
 * Profile validation utilities for backend API
 * Matches the frontend validation logic
 */

/**
 * Check if a user's profile is complete enough to create flows
 * @param {Object} user - User object from auth context
 * @param {Object} profile - User profile data
 * @returns {Object} - { canCreateFlows: boolean, message: string, missingFields: string[] }
 */
const canCreateFlows = (user, profile) => {
  const requiredFields = [
    'firstName',
    'lastName', 
    'username',
    'dateOfBirth',
    'gender'
  ];

  const missingFields = [];
  
  // Check if user exists
  if (!user) {
    return {
      canCreateFlows: false,
      message: 'User not authenticated',
      missingFields: ['user']
    };
  }

  if (!profile) {
    return {
      canCreateFlows: false,
      message: 'Profile information is missing. Please complete your profile first.',
      missingFields: requiredFields
    };
  }

  // Check required fields
  requiredFields.forEach(field => {
    const value = profile[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  });

  // Special validation for dateOfBirth
  if (profile.dateOfBirth) {
    try {
      const date = new Date(profile.dateOfBirth);
      if (isNaN(date.getTime())) {
        if (!missingFields.includes('dateOfBirth')) {
          missingFields.push('dateOfBirth');
        }
      } else {
        // Check age restriction (minimum 18 years)
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) 
          ? age - 1 
          : age;
        
        if (actualAge < 18) {
          return {
            canCreateFlows: false,
            message: 'You must be at least 18 years old to use this app. We are working on features for younger users in future versions.',
            missingFields: ['ageRestriction']
          };
        }
      }
    } catch (error) {
      if (!missingFields.includes('dateOfBirth')) {
        missingFields.push('dateOfBirth');
      }
    }
  }

  const isComplete = missingFields.length === 0;
  
  let message = '';
  if (!isComplete) {
    if (missingFields.length === requiredFields.length) {
      message = 'Profile information is missing. Please complete your profile first.';
    } else {
      const fieldNames = missingFields.map(field => {
        switch (field) {
          case 'firstName': return 'First Name';
          case 'lastName': return 'Last Name';
          case 'username': return 'Username';
          case 'dateOfBirth': return 'Date of Birth';
          case 'gender': return 'Gender';
          default: return field;
        }
      }).join(', ');
      message = `Please complete the following profile fields: ${fieldNames}`;
    }
  }

  return {
    canCreateFlows: isComplete,
    message,
    missingFields
  };
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} - { valid: boolean, message: string }
 */
const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return { valid: false, message: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { valid: false, message: 'Username must be less than 20 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  
  if (username.startsWith('_') || username.endsWith('_')) {
    return { valid: false, message: 'Username cannot start or end with underscore' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validate age restriction (18+)
 * @param {string|Date} dateOfBirth - Date of birth to validate
 * @returns {Object} - { valid: boolean, message: string, age: number }
 */
const validateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return { valid: false, message: 'Date of birth is required', age: 0 };
  }
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    return { valid: false, message: 'Invalid date of birth', age: 0 };
  }
  
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;
  
  if (actualAge < 18) {
    return {
      valid: false,
      message: 'You must be at least 18 years old to use this app. We are working on features for younger users in future versions.',
      age: actualAge
    };
  }
  
  return { valid: true, message: '', age: actualAge };
};

/**
 * Get user-friendly field names for display
 * @param {string} field - Field name
 * @returns {string} - User-friendly field name
 */
const getFieldDisplayName = (field) => {
  const fieldNames = {
    firstName: 'First Name',
    lastName: 'Last Name',
    username: 'Username',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    phoneNumber: 'Phone Number',
    race: 'Race/Ethnicity',
    disability: 'Disability Status',
    preferredLanguage: 'Preferred Language',
    country: 'Country',
    timezone: 'Timezone'
  };
  
  return fieldNames[field] || field;
};

module.exports = {
  canCreateFlows,
  validateUsername,
  validateAge,
  getFieldDisplayName
};
