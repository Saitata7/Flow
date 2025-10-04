/**
 * Data Models Validation Tests
 * Tests JSON schema validation functionality
 */

const { validateFlow, validateFlowEntry, validatePlan, validateUserProfile, validateUserSettings } = require('../src/validation');

describe('Data Models Validation', () => {
  describe('Flow Validation', () => {
    it('should validate a valid flow', () => {
      const validFlow = {
        id: '123',
        title: 'Test Flow',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlow(validFlow);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject flow with missing required fields', () => {
      const invalidFlow = {
        title: 'Test Flow',
        // Missing required fields
      };

      const result = validateFlow(invalidFlow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject flow with invalid tracking type', () => {
      const invalidFlow = {
        id: '123',
        title: 'Test Flow',
        description: 'Test flow description',
        tracking_type: 'invalid_type',
        visibility: 'private',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlow(invalidFlow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject flow with invalid visibility', () => {
      const invalidFlow = {
        id: '123',
        title: 'Test Flow',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'invalid_visibility',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlow(invalidFlow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate flow with optional fields', () => {
      const flowWithOptionals = {
        id: '123',
        title: 'Test Flow',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        archived_at: '2024-01-20T10:00:00Z',
        deleted_at: null,
        tags: ['health', 'fitness'],
        metadata: {
          color: '#007AFF',
          icon: 'heart',
        },
      };

      const result = validateFlow(flowWithOptionals);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('FlowEntry Validation', () => {
    it('should validate a valid flow entry', () => {
      const validEntry = {
        id: '123',
        flow_id: '456',
        content: 'Test entry content',
        symbol: '+',
        date: '2024-01-15',
        mood_score: 5,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlowEntry(validEntry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject entry with invalid symbol', () => {
      const invalidEntry = {
        id: '123',
        flow_id: '456',
        content: 'Test entry content',
        symbol: 'invalid_symbol',
        date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlowEntry(invalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject entry with invalid mood score', () => {
      const invalidEntry = {
        id: '123',
        flow_id: '456',
        content: 'Test entry content',
        symbol: '+',
        date: '2024-01-15',
        mood_score: 15, // Invalid: should be 1-10
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlowEntry(invalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject entry with invalid date format', () => {
      const invalidEntry = {
        id: '123',
        flow_id: '456',
        content: 'Test entry content',
        symbol: '+',
        date: 'invalid-date',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateFlowEntry(invalidEntry);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Plan Validation', () => {
    it('should validate a valid plan', () => {
      const validPlan = {
        id: '123',
        title: 'Test Plan',
        description: 'Test plan description',
        visibility: 'public',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validatePlan(validPlan);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject plan with missing required fields', () => {
      const invalidPlan = {
        title: 'Test Plan',
        // Missing required fields
      };

      const result = validatePlan(invalidPlan);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate plan with optional fields', () => {
      const planWithOptionals = {
        id: '123',
        title: 'Test Plan',
        description: 'Test plan description',
        visibility: 'public',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        archived_at: '2024-01-20T10:00:00Z',
        deleted_at: null,
        tags: ['health', 'fitness'],
        metadata: {
          color: '#007AFF',
          icon: 'heart',
        },
        max_participants: 100,
        start_date: '2024-01-15',
        end_date: '2024-12-31',
      };

      const result = validatePlan(planWithOptionals);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('UserProfile Validation', () => {
    it('should validate a valid user profile', () => {
      const validProfile = {
        id: '123',
        user_id: '456',
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Test user bio',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateUserProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject profile with invalid username format', () => {
      const invalidProfile = {
        id: '123',
        user_id: '456',
        username: 'invalid username!', // Invalid: contains spaces and special chars
        display_name: 'Test User',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject profile with invalid avatar URL', () => {
      const invalidProfile = {
        id: '123',
        user_id: '456',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'not-a-valid-url',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('UserSettings Validation', () => {
    it('should validate valid user settings', () => {
      const validSettings = {
        id: '123',
        user_id: '456',
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          reminders: true,
        },
        privacy: {
          profile_visibility: 'public',
          stats_visibility: 'public',
        },
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateUserSettings(validSettings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject settings with invalid theme', () => {
      const invalidSettings = {
        id: '123',
        user_id: '456',
        theme: 'invalid_theme',
        language: 'en',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateUserSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject settings with invalid language', () => {
      const invalidSettings = {
        id: '123',
        user_id: '456',
        theme: 'light',
        language: 'invalid_language',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const result = validateUserSettings(invalidSettings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      const result = validateFlow(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle undefined input gracefully', () => {
      const result = validateFlow(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle empty object input gracefully', () => {
      const result = validateFlow({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle extra fields gracefully', () => {
      const flowWithExtraFields = {
        id: '123',
        title: 'Test Flow',
        description: 'Test flow description',
        tracking_type: 'binary',
        visibility: 'private',
        owner_id: '456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        extra_field: 'should be ignored',
        another_extra: 123,
      };

      const result = validateFlow(flowWithExtraFields);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeNull();
    });
  });
});
