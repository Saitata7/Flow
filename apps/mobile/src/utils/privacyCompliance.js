// utils/privacyCompliance.js

/**
 * Privacy Compliance Utilities for GDPR/CCPA/COPPA
 * Critical for production apps to ensure legal compliance
 */

/**
 * Validates privacy consent requirements
 * @param {Object} consentData - Consent data object
 * @returns {boolean} - True if consent is valid
 */
export const validatePrivacyConsent = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  const {
    hasConsent,
    consentDate,
    consentVersion,
    consentMethod,
    consentScope,
    hasWithdrawal
  } = consentData;

  return (
    hasConsent === true &&
    typeof consentDate === 'string' &&
    consentDate.length > 0 &&
    typeof consentVersion === 'string' &&
    consentVersion.length > 0 &&
    typeof consentMethod === 'string' &&
    consentMethod.length > 0 &&
    typeof consentScope === 'string' &&
    consentScope.length > 0 &&
    hasWithdrawal === true
  );
};

/**
 * Validates data processing consent
 * @param {Object} processingData - Processing consent data
 * @returns {boolean} - True if processing consent is valid
 */
export const validateDataProcessingConsent = (processingData) => {
  if (!processingData || typeof processingData !== 'object') {
    return false;
  }

  const {
    hasConsent,
    processingPurpose,
    legalBasis,
    dataCategories,
    hasRetentionPeriod,
    retentionPeriod
  } = processingData;

  return (
    hasConsent === true &&
    typeof processingPurpose === 'string' &&
    processingPurpose.length > 0 &&
    typeof legalBasis === 'string' &&
    legalBasis.length > 0 &&
    Array.isArray(dataCategories) &&
    dataCategories.length > 0 &&
    hasRetentionPeriod === true &&
    typeof retentionPeriod === 'string' &&
    retentionPeriod.length > 0
  );
};

/**
 * Validates marketing consent
 * @param {Object} marketingData - Marketing consent data
 * @returns {boolean} - True if marketing consent is valid
 */
export const validateMarketingConsent = (marketingData) => {
  if (!marketingData || typeof marketingData !== 'object') {
    return false;
  }

  const {
    hasConsent,
    consentDate,
    marketingChannels,
    hasOptOut,
    optOutMethod
  } = marketingData;

  return (
    hasConsent === true &&
    typeof consentDate === 'string' &&
    consentDate.length > 0 &&
    Array.isArray(marketingChannels) &&
    marketingChannels.length > 0 &&
    hasOptOut === true &&
    typeof optOutMethod === 'string' &&
    optOutMethod.length > 0
  );
};
