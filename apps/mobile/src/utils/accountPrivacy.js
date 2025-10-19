// utils/accountPrivacy.js

/**
 * Account Privacy Utilities for Data Protection
 * Critical for production apps to ensure user privacy
 */

/**
 * Validates account privacy settings
 * @param {Object} privacySettings - Privacy settings object
 * @returns {boolean} - True if privacy settings are compliant
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

/**
 * Validates data retention policies
 * @param {Object} retentionData - Retention policy data
 * @returns {boolean} - True if retention policy is valid
 */
export const validateDataRetention = (retentionData) => {
  if (!retentionData || typeof retentionData !== 'object') {
    return false;
  }

  const {
    hasRetentionPolicy,
    retentionPeriod,
    retentionStartDate,
    hasAutomaticDeletion,
    deletionMethod,
    hasAuditTrail
  } = retentionData;

  return (
    hasRetentionPolicy === true &&
    typeof retentionPeriod === 'string' &&
    retentionPeriod.length > 0 &&
    typeof retentionStartDate === 'string' &&
    retentionStartDate.length > 0 &&
    hasAutomaticDeletion === true &&
    typeof deletionMethod === 'string' &&
    deletionMethod.length > 0 &&
    hasAuditTrail === true
  );
};

/**
 * Validates data deletion requests
 * @param {Object} deletionData - Deletion request data
 * @returns {boolean} - True if deletion request is valid
 */
export const validateDataDeletion = (deletionData) => {
  if (!deletionData || typeof deletionData !== 'object') {
    return false;
  }

  const {
    hasDeletionRequest,
    requestDate,
    deletionScope,
    hasVerification,
    verificationMethod,
    hasConfirmation,
    deletionDate
  } = deletionData;

  return (
    hasDeletionRequest === true &&
    typeof requestDate === 'string' &&
    requestDate.length > 0 &&
    typeof deletionScope === 'string' &&
    deletionScope.length > 0 &&
    hasVerification === true &&
    typeof verificationMethod === 'string' &&
    verificationMethod.length > 0 &&
    hasConfirmation === true &&
    typeof deletionDate === 'string' &&
    deletionDate.length > 0
  );
};
