// utils/profileValidation.js
// Utility functions for checking user profile completeness

/**
 * Check if user profile is complete
 * @param {Object} user - User object from auth context
 * @param {Object} profile - User profile data
 * @returns {Object} - { isComplete: boolean, missingFields: string[], message: string }
 */
export const checkProfileCompleteness = (user, profile) => {
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
      isComplete: false,
      missingFields: ['user'],
      message: 'User not authenticated'
    };
  }

  // Check if profile exists
  if (!profile) {
    return {
      isComplete: false,
      missingFields: requiredFields,
      message: 'Profile information is missing. Please complete your profile first.'
    };
  }

  // Check each required field
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
    isComplete,
    missingFields,
    message
  };
};

/**
 * Get user-friendly field names for display
 * @param {string} field - Field name
 * @returns {string} - User-friendly field name
 */
export const getFieldDisplayName = (field) => {
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

/**
 * Check if profile has minimum required information for flow creation
 * @param {Object} user - User object from auth context
 * @param {Object} profile - User profile data
 * @returns {Object} - { canCreateFlows: boolean, message: string }
 */
export const canCreateFlows = (user, profile) => {
  const profileCheck = checkProfileCompleteness(user, profile);
  
  if (!profileCheck.isComplete) {
    return {
      canCreateFlows: false,
      message: profileCheck.message,
      missingFields: profileCheck.missingFields
    };
  }

  return {
    canCreateFlows: true,
    message: 'Profile is complete',
    missingFields: []
  };
};
