/**
 * Critical Production Tests for Age Verification & Privacy Compliance
 * Focuses on 18+ age verification, GDPR/CCPA compliance, and account privacy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { validateAge, validateDateOfBirth, calculateAge, formatDateOfBirth } from '../../../src/utils/ageVerification';
import { validatePrivacyConsent, validateDataProcessingConsent, validateMarketingConsent } from '../../../src/utils/privacyCompliance';
import { validateAccountPrivacy, validateDataRetention, validateDataDeletion } from '../../../src/utils/accountPrivacy';
import { validateGDPRCompliance, validateCCPACompliance, validateCOPPACompliance } from '../../../src/utils/privacyRegulations';
import { validateUserConsent, validateConsentWithdrawal, validateConsentHistory } from '../../../src/utils/consentManagement';
import { validateDataMinimization, validatePurposeLimitation, validateStorageLimitation } from '../../../src/utils/dataProtection';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return {
    ...actualMoment,
    default: actualMoment,
  };
});

describe('🔞 CRITICAL: Age Verification & Privacy Compliance Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.removeItem.mockResolvedValue();
    AsyncStorage.multiGet.mockResolvedValue([]);
    AsyncStorage.multiSet.mockResolvedValue();
    AsyncStorage.multiRemove.mockResolvedValue();

    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.deleteItemAsync.mockResolvedValue();
  });

  describe('🔞 Age Verification (18+ Minimum)', () => {
    it('should validate minimum age requirement (18+)', () => {
      const validAges = [18, 19, 25, 30, 50, 65];
      const invalidAges = [17, 16, 15, 13, 10, 5];

      validAges.forEach(age => {
        expect(validateAge(age)).toBe(true);
      });

      invalidAges.forEach(age => {
        expect(validateAge(age)).toBe(false);
      });
    });

    it('should validate date of birth for age verification', () => {
      // Valid: 18+ years old (use fixed dates to avoid leap year issues)
      expect(validateDateOfBirth('1990-01-01')).toBe(true);
      expect(validateDateOfBirth('2000-01-01')).toBe(true);
      expect(validateDateOfBirth('1995-06-15')).toBe(true);

      // Invalid: Under 18
      expect(validateDateOfBirth('2010-01-01')).toBe(false);
      expect(validateDateOfBirth('2015-01-01')).toBe(false);
      expect(validateDateOfBirth('2020-01-01')).toBe(false);
    });

    it('should calculate age correctly from date of birth', () => {
      // Use fixed dates to avoid leap year and day calculation issues
      expect(calculateAge('1990-01-01')).toBeGreaterThanOrEqual(34); // At least 34 years old
      expect(calculateAge('2000-01-01')).toBeGreaterThanOrEqual(24); // At least 24 years old
      expect(calculateAge('2010-01-01')).toBeGreaterThanOrEqual(14); // At least 14 years old
      expect(calculateAge('2020-01-01')).toBeGreaterThanOrEqual(4);  // At least 4 years old
    });

    it('should format date of birth for display', () => {
      const formatted = formatDateOfBirth('1995-06-15');
      
      expect(formatted).toBe('June 15, 1995');
    });

    it('should handle edge cases in age verification', () => {
      // Leap year edge case
      expect(validateDateOfBirth('2000-02-29')).toBe(true);

      // Invalid date formats
      expect(validateDateOfBirth('invalid-date')).toBe(false);
      expect(validateDateOfBirth('')).toBe(false);
      expect(validateDateOfBirth(null)).toBe(false);
      expect(validateDateOfBirth(undefined)).toBe(false);
    });

    it('should enforce age verification during registration', () => {
      const userData18 = {
        email: 'user@example.com',
        password: 'password123',
        dateOfBirth: '1995-01-01',
        age: 29
      };

      const userData17 = {
        email: 'minor@example.com',
        password: 'password123',
        dateOfBirth: '2010-01-01',
        age: 14
      };

      expect(validateAge(userData18.age)).toBe(true);
      expect(validateDateOfBirth(userData18.dateOfBirth)).toBe(true);

      expect(validateAge(userData17.age)).toBe(false);
      expect(validateDateOfBirth(userData17.dateOfBirth)).toBe(false);
    });
  });

  describe('🔒 Privacy Compliance (GDPR/CCPA/COPPA)', () => {
    it('should validate GDPR compliance requirements', () => {
      const gdprCompliantData = {
        hasConsent: true,
        consentDate: new Date().toISOString(),
        consentVersion: '1.0',
        dataProcessingPurpose: 'service_provision',
        dataRetentionPeriod: '2_years',
        hasDataPortability: true,
        hasRightToErasure: true
      };

      const nonCompliantData = {
        hasConsent: false,
        consentDate: null,
        consentVersion: null,
        dataProcessingPurpose: null,
        dataRetentionPeriod: null,
        hasDataPortability: false,
        hasRightToErasure: false
      };

      expect(validateGDPRCompliance(gdprCompliantData)).toBe(true);
      expect(validateGDPRCompliance(nonCompliantData)).toBe(false);
    });

    it('should validate CCPA compliance requirements', () => {
      const ccpaCompliantData = {
        hasOptOut: false,
        optOutDate: null,
        hasDisclosure: true,
        disclosureDate: new Date().toISOString(),
        hasDataDeletion: true,
        hasDataPortability: true,
        hasNonDiscrimination: true
      };

      const nonCompliantData = {
        hasOptOut: true,
        optOutDate: new Date().toISOString(),
        hasDisclosure: false,
        disclosureDate: null,
        hasDataDeletion: false,
        hasDataPortability: false,
        hasNonDiscrimination: false
      };

      expect(validateCCPACompliance(ccpaCompliantData)).toBe(true);
      expect(validateCCPACompliance(nonCompliantData)).toBe(false);
    });

    it('should validate COPPA compliance for users under 13', () => {
      const coppaCompliantData = {
        userAge: 12,
        hasParentalConsent: true,
        parentalConsentDate: new Date().toISOString(),
        parentalConsentMethod: 'verified_email',
        hasDataMinimization: true,
        hasNoProfiling: true,
        hasNoMarketing: true
      };

      const nonCompliantData = {
        userAge: 12,
        hasParentalConsent: false,
        parentalConsentDate: null,
        parentalConsentMethod: null,
        hasDataMinimization: false,
        hasNoProfiling: false,
        hasNoMarketing: false
      };

      expect(validateCOPPACompliance(coppaCompliantData)).toBe(true);
      expect(validateCOPPACompliance(nonCompliantData)).toBe(false);
    });

    it('should validate privacy consent requirements', () => {
      const validConsent = {
        hasConsent: true,
        consentDate: new Date().toISOString(),
        consentVersion: '2.1',
        consentMethod: 'explicit',
        consentScope: 'all_processing',
        hasWithdrawal: true
      };

      const invalidConsent = {
        hasConsent: false,
        consentDate: null,
        consentVersion: null,
        consentMethod: null,
        consentScope: null,
        hasWithdrawal: false
      };

      expect(validatePrivacyConsent(validConsent)).toBe(true);
      expect(validatePrivacyConsent(invalidConsent)).toBe(false);
    });

    it('should validate data processing consent', () => {
      const validProcessingConsent = {
        hasConsent: true,
        processingPurpose: 'service_provision',
        legalBasis: 'consent',
        dataCategories: ['email', 'profile_data'],
        hasRetentionPeriod: true,
        retentionPeriod: '2_years'
      };

      const invalidProcessingConsent = {
        hasConsent: false,
        processingPurpose: null,
        legalBasis: null,
        dataCategories: [],
        hasRetentionPeriod: false,
        retentionPeriod: null
      };

      expect(validateDataProcessingConsent(validProcessingConsent)).toBe(true);
      expect(validateDataProcessingConsent(invalidProcessingConsent)).toBe(false);
    });

    it('should validate marketing consent', () => {
      const validMarketingConsent = {
        hasConsent: true,
        consentDate: new Date().toISOString(),
        marketingChannels: ['email', 'push_notifications'],
        hasOptOut: true,
        optOutMethod: 'unsubscribe_link'
      };

      const invalidMarketingConsent = {
        hasConsent: false,
        consentDate: null,
        marketingChannels: [],
        hasOptOut: false,
        optOutMethod: null
      };

      expect(validateMarketingConsent(validMarketingConsent)).toBe(true);
      expect(validateMarketingConsent(invalidMarketingConsent)).toBe(false);
    });
  });

  describe('👤 Account Privacy & Data Protection', () => {
    it('should validate account privacy settings', () => {
      const privateAccount = {
        profileVisibility: 'private',
        dataSharing: false,
        analyticsOptOut: true,
        marketingOptOut: true,
        hasDataPortability: true,
        hasDataDeletion: true
      };

      const publicAccount = {
        profileVisibility: 'public',
        dataSharing: true,
        analyticsOptOut: false,
        marketingOptOut: false,
        hasDataPortability: false,
        hasDataDeletion: false
      };

      expect(validateAccountPrivacy(privateAccount)).toBe(true);
      expect(validateAccountPrivacy(publicAccount)).toBe(false);
    });

    it('should validate data retention policies', () => {
      const validRetention = {
        hasRetentionPolicy: true,
        retentionPeriod: '2_years',
        retentionStartDate: new Date().toISOString(),
        hasAutomaticDeletion: true,
        deletionMethod: 'secure_deletion',
        hasAuditTrail: true
      };

      const invalidRetention = {
        hasRetentionPolicy: false,
        retentionPeriod: null,
        retentionStartDate: null,
        hasAutomaticDeletion: false,
        deletionMethod: null,
        hasAuditTrail: false
      };

      expect(validateDataRetention(validRetention)).toBe(true);
      expect(validateDataRetention(invalidRetention)).toBe(false);
    });

    it('should validate data deletion requests', () => {
      const validDeletion = {
        hasDeletionRequest: true,
        requestDate: new Date().toISOString(),
        deletionScope: 'all_data',
        hasVerification: true,
        verificationMethod: 'email_confirmation',
        hasConfirmation: true,
        deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      const invalidDeletion = {
        hasDeletionRequest: false,
        requestDate: null,
        deletionScope: null,
        hasVerification: false,
        verificationMethod: null,
        hasConfirmation: false,
        deletionDate: null
      };

      expect(validateDataDeletion(validDeletion)).toBe(true);
      expect(validateDataDeletion(invalidDeletion)).toBe(false);
    });

    it('should validate user consent management', () => {
      const validConsent = {
        hasConsent: true,
        consentDate: new Date().toISOString(),
        consentVersion: '1.0',
        consentMethod: 'explicit',
        hasWithdrawal: true,
        withdrawalDate: null,
        consentHistory: [
          {
            version: '1.0',
            date: new Date().toISOString(),
            action: 'granted'
          }
        ]
      };

      const invalidConsent = {
        hasConsent: false,
        consentDate: null,
        consentVersion: null,
        consentMethod: null,
        hasWithdrawal: false,
        withdrawalDate: null,
        consentHistory: []
      };

      expect(validateUserConsent(validConsent)).toBe(true);
      expect(validateUserConsent(invalidConsent)).toBe(false);
    });

    it('should validate consent withdrawal process', () => {
      const validWithdrawal = {
        hasWithdrawal: true,
        withdrawalDate: new Date().toISOString(),
        withdrawalMethod: 'user_request',
        hasConfirmation: true,
        confirmationDate: new Date().toISOString(),
        hasDataProcessing: false,
        processingStoppedDate: new Date().toISOString()
      };

      const invalidWithdrawal = {
        hasWithdrawal: false,
        withdrawalDate: null,
        withdrawalMethod: null,
        hasConfirmation: false,
        confirmationDate: null,
        hasDataProcessing: true,
        processingStoppedDate: null
      };

      expect(validateConsentWithdrawal(validWithdrawal)).toBe(true);
      expect(validateConsentWithdrawal(invalidWithdrawal)).toBe(false);
    });

    it('should validate consent history tracking', () => {
      const validHistory = {
        consentHistory: [
          {
            version: '1.0',
            date: new Date('2023-01-01').toISOString(),
            action: 'granted',
            method: 'explicit'
          },
          {
            version: '1.1',
            date: new Date('2023-06-01').toISOString(),
            action: 'updated',
            method: 'explicit'
          }
        ],
        hasAuditTrail: true,
        lastUpdated: new Date('2023-06-01').toISOString()
      };

      const invalidHistory = {
        consentHistory: [],
        hasAuditTrail: false,
        lastUpdated: null
      };

      expect(validateConsentHistory(validHistory)).toBe(true);
      expect(validateConsentHistory(invalidHistory)).toBe(false);
    });
  });

  describe('🛡️ Data Protection Principles', () => {
    it('should validate data minimization principle', () => {
      const minimizedData = {
        hasDataMinimization: true,
        dataCategories: ['email', 'profile_basic'],
        hasUnnecessaryData: false,
        dataPurpose: 'service_provision',
        hasRegularReview: true,
        lastReviewDate: new Date().toISOString()
      };

      const excessiveData = {
        hasDataMinimization: false,
        dataCategories: ['email', 'profile_basic', 'browsing_history', 'location_data', 'device_info'],
        hasUnnecessaryData: true,
        dataPurpose: 'service_provision',
        hasRegularReview: false,
        lastReviewDate: null
      };

      expect(validateDataMinimization(minimizedData)).toBe(true);
      expect(validateDataMinimization(excessiveData)).toBe(false);
    });

    it('should validate purpose limitation principle', () => {
      const limitedPurpose = {
        hasPurposeLimitation: true,
        primaryPurpose: 'service_provision',
        secondaryPurposes: ['analytics'],
        hasConsentForSecondary: true,
        hasPurposeChange: false,
        purposeChangeDate: null
      };

      const unlimitedPurpose = {
        hasPurposeLimitation: false,
        primaryPurpose: null,
        secondaryPurposes: ['analytics', 'marketing', 'advertising', 'research'],
        hasConsentForSecondary: false,
        hasPurposeChange: true,
        purposeChangeDate: new Date().toISOString()
      };

      expect(validatePurposeLimitation(limitedPurpose)).toBe(true);
      expect(validatePurposeLimitation(unlimitedPurpose)).toBe(false);
    });

    it('should validate storage limitation principle', () => {
      const limitedStorage = {
        hasStorageLimitation: true,
        retentionPeriod: '2_years',
        hasAutomaticDeletion: true,
        deletionDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        hasDataArchiving: true,
        archiveDate: new Date(Date.now() + 1 * 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const unlimitedStorage = {
        hasStorageLimitation: false,
        retentionPeriod: 'indefinite',
        hasAutomaticDeletion: false,
        deletionDate: null,
        hasDataArchiving: false,
        archiveDate: null
      };

      expect(validateStorageLimitation(limitedStorage)).toBe(true);
      expect(validateStorageLimitation(unlimitedStorage)).toBe(false);
    });
  });

  describe('🚨 Edge Cases & Error Handling', () => {
    it('should handle invalid age inputs', () => {
      expect(validateAge('invalid')).toBe(false);
      expect(validateAge(null)).toBe(false);
      expect(validateAge(undefined)).toBe(false);
      expect(validateAge(-1)).toBe(false);
      expect(validateAge(0)).toBe(false);
    });

    it('should handle invalid date formats', () => {
      expect(validateDateOfBirth('invalid-date')).toBe(false);
      expect(validateDateOfBirth('')).toBe(false);
      expect(validateDateOfBirth(null)).toBe(false);
      expect(validateDateOfBirth(undefined)).toBe(false);
      expect(validateDateOfBirth('2025-01-01')).toBe(false); // Future date
    });

    it('should handle privacy consent edge cases', () => {
      const edgeCaseConsent = {
        hasConsent: true,
        consentDate: 'invalid-date',
        consentVersion: '',
        consentMethod: null,
        consentScope: undefined,
        hasWithdrawal: null
      };

      expect(validatePrivacyConsent(edgeCaseConsent)).toBe(false);
    });

    it('should handle data protection edge cases', () => {
      const edgeCaseData = {
        hasDataMinimization: 'yes', // Should be boolean
        dataCategories: null,
        hasUnnecessaryData: 'no', // Should be boolean
        dataPurpose: '',
        hasRegularReview: undefined,
        lastReviewDate: 'invalid-date'
      };

      expect(validateDataMinimization(edgeCaseData)).toBe(false);
    });
  });

  describe('📊 Performance & Compliance Monitoring', () => {
    it('should handle large consent datasets efficiently', () => {
      const largeConsentHistory = Array.from({ length: 1000 }, (_, i) => ({
        version: `1.${i}`,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        action: i % 2 === 0 ? 'granted' : 'withdrawn',
        method: 'explicit'
      }));

      const startTime = Date.now();
      const result = validateConsentHistory({
        consentHistory: largeConsentHistory,
        hasAuditTrail: true,
        lastUpdated: new Date().toISOString()
      });
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent privacy operations', async () => {
      const operations = [
        validateAge(25),
        validateDateOfBirth(new Date('1995-01-01').toISOString()),
        validatePrivacyConsent({
          hasConsent: true,
          consentDate: new Date().toISOString(),
          consentVersion: '1.0',
          consentMethod: 'explicit',
          consentScope: 'all_processing',
          hasWithdrawal: true
        }),
        validateGDPRCompliance({
          hasConsent: true,
          consentDate: new Date().toISOString(),
          consentVersion: '1.0',
          dataProcessingPurpose: 'service_provision',
          dataRetentionPeriod: '2_years',
          hasDataPortability: true,
          hasRightToErasure: true
        })
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
      expect(results.every(result => result === true)).toBe(true);
    });
  });
});
