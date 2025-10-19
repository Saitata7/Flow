// utils/ageVerification.js

/**
 * Age Verification Utilities for 18+ Compliance
 * Critical for production apps to ensure legal compliance
 */

const MINIMUM_AGE = 18;

/**
 * Validates if age meets minimum requirement (18+)
 * @param {number} age - Age to validate
 * @returns {boolean} - True if age is 18 or older
 */
export const validateAge = (age) => {
  if (typeof age !== 'number' || age < 0) {
    return false;
  }
  return age >= MINIMUM_AGE;
};

/**
 * Validates date of birth for age verification
 * @param {string} dateOfBirth - ISO date string
 * @returns {boolean} - True if user is 18+ years old
 */
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return false;
  }

  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return false;
    }

    const today = new Date();
    if (birthDate > today) {
      return false;
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return (age - 1) >= MINIMUM_AGE;
    }
    
    return age >= MINIMUM_AGE;
  } catch (error) {
    return false;
  }
};

/**
 * Calculates age from date of birth
 * @param {string} dateOfBirth - ISO date string
 * @returns {number} - Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return 0;
  }

  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return 0;
    }

    const today = new Date();
    if (birthDate > today) {
      return 0;
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  } catch (error) {
    return 0;
  }
};

/**
 * Formats date of birth for display
 * @param {string} dateOfBirth - ISO date string
 * @returns {string} - Formatted date string
 */
export const formatDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return '';
  }

  try {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateOfBirth.split('-');
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(birthDate.getTime())) {
      return '';
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = months[birthDate.getMonth()];
    const dayNum = birthDate.getDate();
    const yearNum = birthDate.getFullYear();

    return `${monthName} ${dayNum}, ${yearNum}`;
  } catch (error) {
    return '';
  }
};

/**
 * Validates account privacy settings
 * @param {Object} privacySettings - Privacy settings object
 * @returns {boolean} - True if privacy settings are valid
 */
export const validateAccountPrivacy = (privacySettings) => {
  if (!privacySettings || typeof privacySettings !== 'object') {
    return false;
  }

  const { 
    profileVisibility, 
    dataSharing, 
    analyticsOptOut, 
    marketingOptOut, 
    hasDataPortability, 
    hasDataDeletion 
  } = privacySettings;

  // For compliance, both private and public accounts should have data protection enabled
  // This ensures GDPR/CCPA compliance regardless of visibility setting
  return hasDataPortability === true && hasDataDeletion === true;
};
