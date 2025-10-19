/**
 * Critical Production Tests for Input Validation
 * Tests security, data integrity, and business logic validation
 */

import {
  sanitizeTextInput,
  validateInput,
  validateFlowData,
  validatePlanData,
  validateUserData,
  validateNumericInput,
  validateSessionToken,
  validateSessionData
} from '../../../src/utils/validation';

describe('🔒 CRITICAL: Input Validation Security Tests', () => {
  
  describe('🛡️ XSS Prevention', () => {
    it('should sanitize HTML tags from input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const result = sanitizeTextInput(maliciousInput);
      expect(result).toBe('scriptalert(xss)/scriptHello');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should sanitize SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const result = sanitizeTextInput(sqlInjection);
      expect(result).toBe('DROP TABLE users --');
      expect(result).not.toContain("'");
      expect(result).not.toContain('"');
    });

    it('should sanitize backslashes and semicolons', () => {
      const maliciousInput = 'test\\; malicious; code';
      const result = sanitizeTextInput(maliciousInput);
      expect(result).toBe('test malicious code');
      expect(result).not.toContain('\\');
      expect(result).not.toContain(';');
    });
  });

  describe('📏 Length Validation (Business Logic)', () => {
    it('should enforce title length constraints', () => {
      // Too short
      const shortTitle = validateInput('title', 'ab');
      expect(shortTitle.valid).toBe(false);
      expect(shortTitle.errors).toContain('Title must be at least 3 characters');

      // Too long
      const longTitle = validateInput('title', 'a'.repeat(21));
      expect(longTitle.valid).toBe(false);
      expect(longTitle.errors).toContain('Title must be no more than 20 characters');

      // Valid
      const validTitle = validateInput('title', 'Valid Title');
      expect(validTitle.valid).toBe(true);
      expect(validTitle.errors).toHaveLength(0);
    });

    it('should enforce description length constraints', () => {
      // Too long
      const longDesc = validateInput('description', 'a'.repeat(201));
      expect(longDesc.valid).toBe(false);
      expect(longDesc.errors).toContain('Description must be no more than 200 characters');

      // Valid
      const validDesc = validateInput('description', 'Valid description');
      expect(validDesc.valid).toBe(true);
    });

    it('should enforce username constraints', () => {
      // Too short
      const shortUser = validateInput('username', 'ab');
      expect(shortUser.valid).toBe(false);

      // Too long
      const longUser = validateInput('username', 'a'.repeat(26));
      expect(longUser.valid).toBe(false);

      // Invalid characters
      const invalidUser = validateInput('username', 'user@name!');
      expect(invalidUser.valid).toBe(false);
      expect(invalidUser.errors).toContain('Username can only contain letters, numbers, underscores, and hyphens');

      // Valid
      const validUser = validateInput('username', 'valid_user-123');
      expect(validUser.valid).toBe(true);
    });
  });

  describe('📧 Email Validation', () => {
    it('should validate email format', () => {
      // Invalid emails
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain'
      ];

      invalidEmails.forEach(email => {
        const result = validateInput('email', email);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Please enter a valid email address');
      });

      // Valid emails
      const validEmails = [
        'user@domain.com',
        'test.email@subdomain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = validateInput('email', email);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('🔐 Password Security', () => {
    it('should enforce minimum password length', () => {
      const shortPassword = validateInput('password', '12345');
      expect(shortPassword.valid).toBe(false);
      expect(shortPassword.errors).toContain('Password must be at least 6 characters');

      const validPassword = validateInput('password', '123456');
      expect(validPassword.valid).toBe(true);
    });
  });

  describe('📊 Flow Data Validation', () => {
    it('should validate complete flow data', () => {
      const validFlowData = {
        title: 'Test Flow',
        description: 'A test flow description',
        tracking_type: 'binary'
      };

      const result = validateFlowData(validFlowData);
      expect(result.valid).toBe(true);
      expect(result.sanitizedData.title).toBe('Test Flow');
    });

    it('should reject invalid flow data', () => {
      const invalidFlowData = {
        title: 'ab', // Too short
        description: 'a'.repeat(201) // Too long
      };

      const result = validateFlowData(invalidFlowData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize malicious flow data', () => {
      const maliciousFlowData = {
        title: '<script>alert("xss")</script>Flow',
        description: "'; DROP TABLE flows; --"
      };

      const result = validateFlowData(maliciousFlowData);
      expect(result.sanitizedData.title).not.toContain('<');
      expect(result.sanitizedData.title).not.toContain('>');
      expect(result.sanitizedData.description).not.toContain("'");
    });
  });

  describe('👤 User Data Validation', () => {
    it('should validate user profile data', () => {
      const validUserData = {
        username: 'validuser',
        email: 'user@example.com'
      };

      const result = validateUserData(validUserData);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid user data', () => {
      const invalidUserData = {
        username: 'ab', // Too short
        email: 'invalid-email'
      };

      const result = validateUserData(invalidUserData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('🔢 Numeric Input Validation', () => {
    it('should validate numeric constraints', () => {
      // Valid range
      const validNumber = validateNumericInput(5, 1, 10, 'Score');
      expect(validNumber.valid).toBe(true);

      // Below minimum
      const belowMin = validateNumericInput(0, 1, 10, 'Score');
      expect(belowMin.valid).toBe(false);
      expect(belowMin.errors).toContain('Score must be at least 1');

      // Above maximum
      const aboveMax = validateNumericInput(15, 1, 10, 'Score');
      expect(aboveMax.valid).toBe(false);
      expect(aboveMax.errors).toContain('Score must be no more than 10');

      // Invalid number
      const invalidNumber = validateNumericInput('abc', 1, 10, 'Score');
      expect(invalidNumber.valid).toBe(false);
      expect(invalidNumber.errors).toContain('Score must be a valid number');
    });
  });

  describe('🎫 Session Security', () => {
    it('should validate session tokens', () => {
      // Valid token
      const validToken = validateSessionToken('valid.token.12345');
      expect(validToken.valid).toBe(true);

      // Too short
      const shortToken = validateSessionToken('short');
      expect(shortToken.valid).toBe(false);
      expect(shortToken.errors).toContain('Session token is too short');

      // Empty token
      const emptyToken = validateSessionToken('');
      expect(emptyToken.valid).toBe(false);
      expect(emptyToken.errors).toContain('Session token is required');
    });

    it('should validate session data integrity', () => {
      const validSessionData = {
        userData: {
          username: 'testuser',
          email: 'test@example.com'
        },
        expiresAt: Date.now() + 3600000,
        lastTokenRefresh: Date.now()
      };

      const result = validateSessionData(validSessionData);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid session data', () => {
      const invalidSessionData = {
        userData: {
          username: 'ab', // Invalid username
          email: 'invalid-email'
        }
      };

      const result = validateSessionData(invalidSessionData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('🚨 Edge Cases & Error Handling', () => {
    it('should handle null and undefined inputs', () => {
      expect(validateInput('title', null).valid).toBe(false);
      expect(validateInput('title', undefined).valid).toBe(false);
      expect(validateInput('title', '').valid).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(validateInput('title', 123).valid).toBe(false);
      expect(validateInput('title', {}).valid).toBe(false);
      expect(validateInput('title', []).valid).toBe(false);
    });

    it('should handle empty objects and arrays', () => {
      expect(validateFlowData({})).toBeDefined();
      expect(validateUserData({})).toBeDefined();
      expect(validateSessionData(null)).toBeDefined();
    });
  });
});
