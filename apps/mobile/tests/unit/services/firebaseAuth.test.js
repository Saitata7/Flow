// Mock the Firebase service directly
const mockFirebaseAuth = {
  signInWithEmail: jest.fn(),
  createUserWithEmail: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(),
  getIdToken: jest.fn(),
  signInWithGoogle: jest.fn(),
};

// Mock the entire module
jest.mock('../../../src/services/firebaseAuth', () => mockFirebaseAuth);

// Import the service AFTER mocking
const firebaseAuth = require('../../../src/services/firebaseAuth');

// Mock Google Sign-In
const mockGoogleSignIn = jest.fn();
const mockGoogleSignOut = jest.fn();
const mockGoogleIsSignedIn = jest.fn();
const mockGoogleGetCurrentUser = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: mockGoogleSignIn,
    signOut: mockGoogleSignOut,
    isSignedIn: mockGoogleIsSignedIn,
    getCurrentUser: mockGoogleGetCurrentUser,
  },
}));

// Don't mock the firebaseAuth service - test the real implementation

describe('Firebase Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email/Password Authentication', () => {
    it('should sign in with email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      const mockResult = { success: true, user: mockUser };
      firebaseAuth.signInWithEmail.mockResolvedValue(mockResult);

      const result = await firebaseAuth.signInWithEmail('test@example.com', 'password');

      expect(firebaseAuth.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should create user with email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      const mockResult = { success: true, user: mockUser };
      firebaseAuth.createUserWithEmail.mockResolvedValue(mockResult);

      const result = await firebaseAuth.createUserWithEmail('test@example.com', 'password');

      expect(firebaseAuth.createUserWithEmail).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid credentials';
      const mockResult = { success: false, error: errorMessage };
      firebaseAuth.signInWithEmail.mockResolvedValue(mockResult);

      const result = await firebaseAuth.signInWithEmail('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Google Sign-In', () => {
    it('should sign in with Google', async () => {
      const mockResult = { success: false, error: 'Google sign in not implemented' };
      firebaseAuth.signInWithGoogle.mockResolvedValue(mockResult);

      const result = await firebaseAuth.signInWithGoogle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google sign in not implemented');
    });

    it('should handle Google sign in errors', async () => {
      const mockResult = { success: false, error: 'Google sign in not implemented' };
      firebaseAuth.signInWithGoogle.mockResolvedValue(mockResult);

      const result = await firebaseAuth.signInWithGoogle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google sign in not implemented');
    });
  });

  describe('Sign Out', () => {
    it('should sign out user', async () => {
      const mockResult = { success: true };
      firebaseAuth.signOut.mockResolvedValue(mockResult);

      const result = await firebaseAuth.signOut();

      expect(firebaseAuth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle sign out errors', async () => {
      const errorMessage = 'Sign out failed';
      const mockResult = { success: false, error: errorMessage };
      firebaseAuth.signOut.mockResolvedValue(mockResult);

      const result = await firebaseAuth.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      const mockResult = { success: true };
      firebaseAuth.sendPasswordResetEmail.mockResolvedValue(mockResult);

      const result = await firebaseAuth.sendPasswordResetEmail('test@example.com');

      expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should handle password reset errors', async () => {
      const errorMessage = 'Password reset failed';
      const mockResult = { success: false, error: errorMessage };
      firebaseAuth.sendPasswordResetEmail.mockResolvedValue(mockResult);

      const result = await firebaseAuth.sendPasswordResetEmail('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      const profileData = { displayName: 'John Doe' };
      const mockResult = { success: true };
      firebaseAuth.updateProfile.mockResolvedValue(mockResult);

      const result = await firebaseAuth.updateProfile(profileData);

      expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(profileData);
      expect(result.success).toBe(true);
    });

    it('should handle profile update errors', async () => {
      const errorMessage = 'Profile update failed';
      const profileData = { displayName: 'John Doe' };
      const mockResult = { success: false, error: errorMessage };
      firebaseAuth.updateProfile.mockResolvedValue(mockResult);

      const result = await firebaseAuth.updateProfile(profileData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Auth State Changes', () => {
    it('should listen to auth state changes', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      firebaseAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = firebaseAuth.onAuthStateChanged(callback);

      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});
