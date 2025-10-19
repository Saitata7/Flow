// utils/consentManagement.js

/**
 * Consent Management Utilities
 * Critical for production apps to manage user consent properly
 */

/**
 * Validates user consent
 * @param {Object} consentData - User consent data
 * @returns {boolean} - True if consent is valid
 */
export const validateUserConsent = (consentData) => {
  if (!consentData || typeof consentData !== 'object') {
    return false;
  }

  const {
    hasConsent,
    consentDate,
    consentVersion,
    consentMethod,
    hasWithdrawal,
    withdrawalDate,
    consentHistory
  } = consentData;

  return (
    hasConsent === true &&
    typeof consentDate === 'string' &&
    consentDate.length > 0 &&
    typeof consentVersion === 'string' &&
    consentVersion.length > 0 &&
    typeof consentMethod === 'string' &&
    consentMethod.length > 0 &&
    hasWithdrawal === true &&
    (withdrawalDate === null || typeof withdrawalDate === 'string') &&
    Array.isArray(consentHistory) &&
    consentHistory.length > 0
  );
};

/**
 * Validates consent withdrawal process
 * @param {Object} withdrawalData - Withdrawal process data
 * @returns {boolean} - True if withdrawal process is valid
 */
export const validateConsentWithdrawal = (withdrawalData) => {
  if (!withdrawalData || typeof withdrawalData !== 'object') {
    return false;
  }

  const {
    hasWithdrawal,
    withdrawalDate,
    withdrawalMethod,
    hasConfirmation,
    confirmationDate,
    hasDataProcessing,
    processingStoppedDate
  } = withdrawalData;

  return (
    hasWithdrawal === true &&
    typeof withdrawalDate === 'string' &&
    withdrawalDate.length > 0 &&
    typeof withdrawalMethod === 'string' &&
    withdrawalMethod.length > 0 &&
    hasConfirmation === true &&
    typeof confirmationDate === 'string' &&
    confirmationDate.length > 0 &&
    hasDataProcessing === false &&
    typeof processingStoppedDate === 'string' &&
    processingStoppedDate.length > 0
  );
};

/**
 * Validates consent history tracking
 * @param {Object} historyData - Consent history data
 * @returns {boolean} - True if consent history is valid
 */
export const validateConsentHistory = (historyData) => {
  if (!historyData || typeof historyData !== 'object') {
    return false;
  }

  const {
    consentHistory,
    hasAuditTrail,
    lastUpdated
  } = historyData;

  if (!Array.isArray(consentHistory) || consentHistory.length === 0) {
    return false;
  }

  // Validate each consent history entry
  const validHistory = consentHistory.every(entry => {
    return (
      typeof entry.version === 'string' &&
      entry.version.length > 0 &&
      typeof entry.date === 'string' &&
      entry.date.length > 0 &&
      typeof entry.action === 'string' &&
      entry.action.length > 0 &&
      typeof entry.method === 'string' &&
      entry.method.length > 0
    );
  });

  return (
    validHistory &&
    hasAuditTrail === true &&
    typeof lastUpdated === 'string' &&
    lastUpdated.length > 0
  );
};
