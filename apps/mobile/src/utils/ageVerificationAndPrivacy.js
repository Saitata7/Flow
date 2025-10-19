/**
 * Age Verification & Privacy Compliance Utilities
 * Handles age verification (18+ minimum), privacy regulations (GDPR/CCPA/COPPA),
 * and data protection compliance for the Flow app
 */

import moment from 'moment';

// Age verification constants
const MINIMUM_AGE = 18;
const COPPA_MINIMUM_AGE = 13;

/**
 * Validates if a user meets the minimum age requirement (18+)
 * @param {number} age - The user's age
 * @returns {boolean} - True if age is 18 or older
 */
export const validateAge = (age) => {
  if (typeof age !== 'number' || isNaN(age)) {
    return false;
  }
  return age >= MINIMUM_AGE;
};

/**
 * Validates date of birth for age verification
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
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
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
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
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
export const formatDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return '';
  }

  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return '';
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = months[birthDate.getMonth()];
    const day = birthDate.getDate();
    const year = birthDate.getFullYear();

    return `${month} ${day}, ${year}`;
  } catch (error) {
    return '';
  }
};

/**
 * Validates GDPR compliance requirements
 * @param {Object} consentData - User consent data
 * @returns {boolean} - True if GDPR compliant
 */
export const validateGDPRCompliance = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  const requiredFields = ['dataProcessing', 'marketing', 'analytics'];
  return requiredFields.every(field => 
    consentData.hasOwnProperty(field) && typeof consentData[field] === 'boolean'
  );
};

/**
 * Validates CCPA compliance requirements
 * @param {Object} consentData - User consent data
 * @returns {boolean} - True if CCPA compliant
 */
export const validateCCPACompliance = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  const requiredFields = ['dataSharing', 'saleOfData'];
  return requiredFields.every(field => 
    consentData.hasOwnProperty(field) && typeof consentData[field] === 'boolean'
  );
};

/**
 * Validates COPPA compliance for users under 13
 * @param {number} age - User's age
 * @param {Object} parentalConsent - Parental consent data
 * @returns {boolean} - True if COPPA compliant
 */
export const validateCOPPACompliance = (age, parentalConsent) => {
  if (age >= COPPA_MINIMUM_AGE) {
    return true; // Not subject to COPPA
  }

  if (!parentalConsent || typeof parentalConsent !== 'object') {
    return false;
  }

  return parentalConsent.hasParentalConsent === true && 
         parentalConsent.verificationMethod !== undefined;
};

/**
 * Validates privacy consent requirements
 * @param {Object} consentData - User consent data
 * @returns {boolean} - True if consent is valid
 */
export const validatePrivacyConsent = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  const requiredConsents = ['dataProcessing', 'privacyPolicy'];
  return requiredConsents.every(consent => 
    consentData[consent] === true
  );
};

/**
 * Validates data processing consent
 * @param {Object} consentData - User consent data
 * @returns {boolean} - True if data processing consent is valid
 */
export const validateDataProcessingConsent = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  return consentData.dataProcessing === true && 
         consentData.dataProcessingDate !== undefined;
};

/**
 * Validates marketing consent
 * @param {Object} consentData - User consent data
 * @returns {boolean} - True if marketing consent is valid
 */
export const validateMarketingConsent = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  return consentData.hasOwnProperty('marketing') && 
         typeof consentData.marketing === 'boolean';
};

/**
 * Validates account privacy settings
 * @param {Object} privacySettings - User privacy settings
 * @returns {boolean} - True if privacy settings are valid
 */
export const validateAccountPrivacy = (privacySettings) => {
  if (!privacySettings || typeof privacySettings !== 'object') {
    return false;
  }

  // Check if it's a private account (more secure)
  const isPrivateAccount = privacySettings.profileVisibility === 'private' && 
                          privacySettings.dataSharing === false;

  // Check if it's a public account (less secure)
  const isPublicAccount = privacySettings.profileVisibility === 'public' && 
                         privacySettings.dataSharing === true;

  // Return true only for private accounts, false for public accounts
  return isPrivateAccount && !isPublicAccount;
};

/**
 * Validates data retention policies
 * @param {Object} retentionPolicy - Data retention policy
 * @returns {boolean} - True if retention policy is valid
 */
export const validateDataRetentionPolicy = (retentionPolicy) => {
  if (!retentionPolicy || typeof retentionPolicy !== 'object') {
    return false;
  }

  const requiredFields = ['retentionPeriod', 'deletionMethod'];
  return requiredFields.every(field => 
    retentionPolicy.hasOwnProperty(field) && 
    retentionPolicy[field] !== undefined
  );
};

/**
 * Validates data deletion requests
 * @param {Object} deletionRequest - Data deletion request
 * @returns {boolean} - True if deletion request is valid
 */
export const validateDataDeletionRequest = (deletionRequest) => {
  if (!deletionRequest || typeof deletionRequest !== 'object') {
    return false;
  }

  const requiredFields = ['userId', 'requestDate', 'deletionType'];
  return requiredFields.every(field => 
    deletionRequest.hasOwnProperty(field) && 
    deletionRequest[field] !== undefined
  );
};

/**
 * Validates user consent management
 * @param {Object} consentManagement - Consent management data
 * @returns {boolean} - True if consent management is valid
 */
export const validateUserConsentManagement = (consentManagement) => {
  if (!consentManagement || typeof consentManagement !== 'object') {
    return false;
  }

  const requiredFields = ['consentHistory', 'currentConsents', 'lastUpdated'];
  return requiredFields.every(field => 
    consentManagement.hasOwnProperty(field)
  );
};

/**
 * Validates consent withdrawal process
 * @param {Object} withdrawalRequest - Consent withdrawal request
 * @returns {boolean} - True if withdrawal request is valid
 */
export const validateConsentWithdrawal = (withdrawalRequest) => {
  if (!withdrawalRequest || typeof withdrawalRequest !== 'object') {
    return false;
  }

  const requiredFields = ['userId', 'consentType', 'withdrawalDate'];
  return requiredFields.every(field => 
    withdrawalRequest.hasOwnProperty(field) && 
    withdrawalRequest[field] !== undefined
  );
};

/**
 * Validates consent history tracking
 * @param {Array} consentHistory - Array of consent history entries
 * @returns {boolean} - True if consent history is valid
 */
export const validateConsentHistoryTracking = (consentHistory) => {
  if (!Array.isArray(consentHistory)) {
    return false;
  }

  return consentHistory.every(entry => 
    entry && 
    typeof entry === 'object' && 
    entry.hasOwnProperty('consentType') && 
    entry.hasOwnProperty('timestamp') && 
    entry.hasOwnProperty('action')
  );
};

/**
 * Validates data minimization principle
 * @param {Object} dataCollection - Data collection practices
 * @returns {boolean} - True if data minimization is followed
 */
export const validateDataMinimization = (dataCollection) => {
  if (!dataCollection || typeof dataCollection !== 'object') {
    return false;
  }

  return dataCollection.collectsOnlyNecessaryData === true && 
         dataCollection.hasDataPurpose === true;
};

/**
 * Validates purpose limitation principle
 * @param {Object} dataUsage - Data usage practices
 * @returns {boolean} - True if purpose limitation is followed
 */
export const validatePurposeLimitation = (dataUsage) => {
  if (!dataUsage || typeof dataUsage !== 'object') {
    return false;
  }

  return dataUsage.hasSpecificPurpose === true && 
         dataUsage.purposeIsDocumented === true;
};

/**
 * Validates storage limitation principle
 * @param {Object} dataStorage - Data storage practices
 * @returns {boolean} - True if storage limitation is followed
 */
export const validateStorageLimitation = (dataStorage) => {
  if (!dataStorage || typeof dataStorage !== 'object') {
    return false;
  }

  return dataStorage.hasRetentionPeriod === true && 
         dataStorage.retentionPeriodIsReasonable === true;
};

/**
 * Handles invalid age inputs gracefully
 * @param {*} ageInput - Age input of any type
 * @returns {boolean} - False for invalid inputs
 */
export const handleInvalidAgeInput = (ageInput) => {
  if (ageInput === null || ageInput === undefined) {
    return false;
  }

  if (typeof ageInput === 'string') {
    const parsedAge = parseInt(ageInput, 10);
    return !isNaN(parsedAge) && parsedAge >= MINIMUM_AGE;
  }

  if (typeof ageInput === 'number') {
    return !isNaN(ageInput) && ageInput >= MINIMUM_AGE;
  }

  return false;
};

/**
 * Handles invalid date formats gracefully
 * @param {*} dateInput - Date input of any type
 * @returns {boolean} - False for invalid date formats
 */
export const handleInvalidDateFormat = (dateInput) => {
  if (!dateInput) {
    return false;
  }

  try {
    const date = moment(dateInput);
    return date.isValid();
  } catch (error) {
    return false;
  }
};

/**
 * Handles privacy consent edge cases
 * @param {Object} consentData - Consent data
 * @returns {boolean} - True if edge cases are handled properly
 */
export const handlePrivacyConsentEdgeCases = (consentData) => {
  if (!consentData) {
    return false;
  }

  // Handle partial consent data
  if (Object.keys(consentData).length === 0) {
    return false;
  }

  // Handle malformed consent data
  const hasValidConsentTypes = Object.values(consentData).every(value => 
    typeof value === 'boolean' || value === null || value === undefined
  );

  return hasValidConsentTypes;
};

/**
 * Handles data protection edge cases
 * @param {Object} dataProtectionData - Data protection data
 * @returns {boolean} - True if edge cases are handled properly
 */
export const handleDataProtectionEdgeCases = (dataProtectionData) => {
  if (!dataProtectionData) {
    return false;
  }

  // Handle empty data protection object
  if (Object.keys(dataProtectionData).length === 0) {
    return false;
  }

  // Handle malformed data protection data
  const hasValidProtectionSettings = Object.values(dataProtectionData).every(value => 
    typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number'
  );

  return hasValidProtectionSettings;
};

/**
 * Handles large consent datasets efficiently
 * @param {Array} largeConsentDataset - Large array of consent data
 * @returns {boolean} - True if handled efficiently
 */
export const handleLargeConsentDatasets = (largeConsentDataset) => {
  if (!Array.isArray(largeConsentDataset)) {
    return false;
  }

  // For large datasets, we should validate in batches
  const batchSize = 1000;
  const batches = [];
  
  for (let i = 0; i < largeConsentDataset.length; i += batchSize) {
    batches.push(largeConsentDataset.slice(i, i + batchSize));
  }

  // Validate each batch
  return batches.every(batch => 
    batch.every(consent => 
      consent && typeof consent === 'object' && consent.hasOwnProperty('consentType')
    )
  );
};

/**
 * Handles concurrent privacy operations
 * @param {Array} concurrentOperations - Array of concurrent operations
 * @returns {Promise<boolean>} - True if all operations succeed
 */
export const handleConcurrentPrivacyOperations = async (concurrentOperations) => {
  if (!Array.isArray(concurrentOperations)) {
    return false;
  }

  try {
    const results = await Promise.all(
      concurrentOperations.map(async (operation) => {
        if (typeof operation === 'function') {
          return await operation();
        }
        // If it's already a result (boolean), return it directly
        return operation === true;
      })
    );

    return results.every(result => result === true);
  } catch (error) {
    return false;
  }
};
