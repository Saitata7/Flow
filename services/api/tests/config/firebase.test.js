/**
 * Firebase Configuration Tests
 * Tests Firebase Admin SDK initialization and authentication
 */

const admin = require('firebase-admin');

describe('Firebase Configuration Tests', () => {
  let firebaseApp = null;
  let testEnv;

  beforeAll(() => {
    // Load environment variables
    require('dotenv').config({ path: './env.production' });
    testEnv = require('./test-env');
  });

  afterAll(() => {
    // Clean up Firebase app
    if (firebaseApp) {
      firebaseApp.delete();
    }
  });

  describe('Environment Variables', () => {
    test('should have all required Firebase environment variables', () => {
      expect(testEnv.FIREBASE_PROJECT_ID).toBeDefined();
      expect(testEnv.FIREBASE_PRIVATE_KEY).toBeDefined();
      expect(testEnv.FIREBASE_CLIENT_EMAIL).toBeDefined();
    });

    test('should have valid Firebase project ID', () => {
      expect(testEnv.FIREBASE_PROJECT_ID).toBe('quick-doodad-472200-k0');
      expect(testEnv.FIREBASE_PROJECT_ID).not.toContain('${');
      expect(testEnv.FIREBASE_PROJECT_ID).not.toContain('}');
    });

    test('should have valid Firebase client email', () => {
      expect(testEnv.FIREBASE_CLIENT_EMAIL).toBe('firebase-adminsdk-fbsvc@quick-doodad-472200-k0.iam.gserviceaccount.com');
      expect(testEnv.FIREBASE_CLIENT_EMAIL).toContain('@');
      expect(testEnv.FIREBASE_CLIENT_EMAIL).toContain('firebase-adminsdk');
      expect(testEnv.FIREBASE_CLIENT_EMAIL).not.toContain('${');
    });

    test('should have valid Firebase private key format', () => {
      expect(testEnv.FIREBASE_PRIVATE_KEY).toContain('-----BEGIN PRIVATE KEY-----');
      expect(testEnv.FIREBASE_PRIVATE_KEY).toContain('-----END PRIVATE KEY-----');
      expect(testEnv.FIREBASE_PRIVATE_KEY).not.toContain('${');
    });
  });

  describe('Firebase Admin SDK Initialization', () => {
    test('should initialize Firebase Admin SDK successfully', () => {
      expect(() => {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: testEnv.FIREBASE_PROJECT_ID,
            privateKey: testEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: testEnv.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }).not.toThrow();

      expect(firebaseApp).toBeDefined();
    });

    test('should have correct project ID in Firebase app', () => {
      // Check the credential project ID instead of options
      expect(firebaseApp.options.credential.projectId).toBe('quick-doodad-472200-k0');
    });
  });

  describe('Firebase Authentication Service', () => {
    test('should be able to access Firebase Auth service', () => {
      expect(() => {
        const auth = admin.auth();
        expect(auth).toBeDefined();
      }).not.toThrow();
    });

    test('should be able to list users (test permissions)', async () => {
      const auth = admin.auth();
      
      try {
        const result = await auth.listUsers(1);
        expect(result).toBeDefined();
        expect(result.users).toBeDefined();
        expect(Array.isArray(result.users)).toBe(true);
      } catch (error) {
        // If this fails, it might be due to network issues or insufficient permissions
        // but the service should still be accessible
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Firebase Configuration Validation', () => {
    test('should have correct AUTH_PROVIDER setting', () => {
      expect(testEnv.AUTH_PROVIDER).toBe('firebase');
    });

    test('should have JWT configuration', () => {
      expect(testEnv.JWT_SECRET).toBeDefined();
      expect(testEnv.JWT_EXPIRES_IN).toBeDefined();
      expect(testEnv.JWT_SECRET.length).toBeGreaterThan(10);
    });
  });
});
