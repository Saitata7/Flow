// utils/privacyRegulations.js

/**
 * Privacy Regulations Compliance Utilities
 * Critical for production apps to ensure legal compliance with GDPR/CCPA/COPPA
 */

/**
 * Validates GDPR compliance requirements
 * @param {Object} gdprData - GDPR compliance data
 * @returns {boolean} - True if GDPR compliant
 */
export const validateGDPRCompliance = (gdprData) => {
  if (!gdprData || typeof gdprData !== 'object') {
    return false;
  }

  const {
    hasConsent,
    consentDate,
    consentVersion,
    dataProcessingPurpose,
    dataRetentionPeriod,
    hasDataPortability,
    hasRightToErasure
  } = gdprData;

  return (
    hasConsent === true &&
    typeof consentDate === 'string' &&
    consentDate.length > 0 &&
    typeof consentVersion === 'string' &&
    consentVersion.length > 0 &&
    typeof dataProcessingPurpose === 'string' &&
    dataProcessingPurpose.length > 0 &&
    typeof dataRetentionPeriod === 'string' &&
    dataRetentionPeriod.length > 0 &&
    hasDataPortability === true &&
    hasRightToErasure === true
  );
};

/**
 * Validates CCPA compliance requirements
 * @param {Object} ccpaData - CCPA compliance data
 * @returns {boolean} - True if CCPA compliant
 */
export const validateCCPACompliance = (ccpaData) => {
  if (!ccpaData || typeof ccpaData !== 'object') {
    return false;
  }

  const {
    hasOptOut,
    optOutDate,
    hasDisclosure,
    disclosureDate,
    hasDataDeletion,
    hasDataPortability,
    hasNonDiscrimination
  } = ccpaData;

  return (
    hasOptOut === false &&
    optOutDate === null &&
    hasDisclosure === true &&
    typeof disclosureDate === 'string' &&
    disclosureDate.length > 0 &&
    hasDataDeletion === true &&
    hasDataPortability === true &&
    hasNonDiscrimination === true
  );
};

/**
 * Validates COPPA compliance for users under 13
 * @param {Object} coppaData - COPPA compliance data
 * @returns {boolean} - True if COPPA compliant
 */
export const validateCOPPACompliance = (coppaData) => {
  if (!coppaData || typeof coppaData !== 'object') {
    return false;
  }

  const {
    userAge,
    hasParentalConsent,
    parentalConsentDate,
    parentalConsentMethod,
    hasDataMinimization,
    hasNoProfiling,
    hasNoMarketing
  } = coppaData;

  return (
    typeof userAge === 'number' &&
    userAge < 13 &&
    hasParentalConsent === true &&
    typeof parentalConsentDate === 'string' &&
    parentalConsentDate.length > 0 &&
    typeof parentalConsentMethod === 'string' &&
    parentalConsentMethod.length > 0 &&
    hasDataMinimization === true &&
    hasNoProfiling === true &&
    hasNoMarketing === true
  );
};
