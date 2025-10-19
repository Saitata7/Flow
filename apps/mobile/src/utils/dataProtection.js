// utils/dataProtection.js

/**
 * Data Protection Principles Utilities
 * Critical for production apps to ensure data protection compliance
 */

/**
 * Validates data minimization principle
 * @param {Object} minimizationData - Data minimization data
 * @returns {boolean} - True if data minimization is compliant
 */
export const validateDataMinimization = (minimizationData) => {
  if (!minimizationData || typeof minimizationData !== 'object') {
    return false;
  }

  const {
    hasDataMinimization,
    dataCategories,
    hasUnnecessaryData,
    dataPurpose,
    hasRegularReview,
    lastReviewDate
  } = minimizationData;

  return (
    hasDataMinimization === true &&
    Array.isArray(dataCategories) &&
    dataCategories.length > 0 &&
    hasUnnecessaryData === false &&
    typeof dataPurpose === 'string' &&
    dataPurpose.length > 0 &&
    hasRegularReview === true &&
    typeof lastReviewDate === 'string' &&
    lastReviewDate.length > 0
  );
};

/**
 * Validates purpose limitation principle
 * @param {Object} purposeData - Purpose limitation data
 * @returns {boolean} - True if purpose limitation is compliant
 */
export const validatePurposeLimitation = (purposeData) => {
  if (!purposeData || typeof purposeData !== 'object') {
    return false;
  }

  const {
    hasPurposeLimitation,
    primaryPurpose,
    secondaryPurposes,
    hasConsentForSecondary,
    hasPurposeChange,
    purposeChangeDate
  } = purposeData;

  return (
    hasPurposeLimitation === true &&
    typeof primaryPurpose === 'string' &&
    primaryPurpose.length > 0 &&
    Array.isArray(secondaryPurposes) &&
    secondaryPurposes.length > 0 &&
    hasConsentForSecondary === true &&
    hasPurposeChange === false &&
    purposeChangeDate === null
  );
};

/**
 * Validates storage limitation principle
 * @param {Object} storageData - Storage limitation data
 * @returns {boolean} - True if storage limitation is compliant
 */
export const validateStorageLimitation = (storageData) => {
  if (!storageData || typeof storageData !== 'object') {
    return false;
  }

  const {
    hasStorageLimitation,
    retentionPeriod,
    hasAutomaticDeletion,
    deletionDate,
    hasDataArchiving,
    archiveDate
  } = storageData;

  return (
    hasStorageLimitation === true &&
    typeof retentionPeriod === 'string' &&
    retentionPeriod.length > 0 &&
    hasAutomaticDeletion === true &&
    typeof deletionDate === 'string' &&
    deletionDate.length > 0 &&
    hasDataArchiving === true &&
    typeof archiveDate === 'string' &&
    archiveDate.length > 0
  );
};
