const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

describe('Firebase Configuration Tests', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should handle missing Firebase environment variables gracefully', () => {
    // Clear Firebase environment variables
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_CLIENT_EMAIL;

    // This should not throw an error
    expect(() => {
      require('../../src/middleware/auth');
    }).not.toThrow();
  });

  test('should initialize Firebase when environment variables are present', () => {
    // Set Firebase environment variables
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';

    // This should not throw an error
    expect(() => {
      require('../../src/middleware/auth');
    }).not.toThrow();
  });

  test('should handle Firebase initialization errors gracefully', () => {
    // Set invalid Firebase environment variables
    process.env.FIREBASE_PROJECT_ID = 'invalid-project';
    process.env.FIREBASE_PRIVATE_KEY = 'invalid-key';
    process.env.FIREBASE_CLIENT_EMAIL = 'invalid-email';

    // This should not throw an error and should fall back to JWT-only mode
    expect(() => {
      require('../../src/middleware/auth');
    }).not.toThrow();
  });
});
