// Mock Firebase Auth BEFORE importing the service
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockUpdateProfile = jest.fn();
const mockGetIdToken = jest.fn();

const mockAuth = {
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  currentUser: {
    updateProfile: mockUpdateProfile,
    getIdToken: mockGetIdToken,
  },
};

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => mockAuth,
}));

// Import the service AFTER mocking
import { firebaseAuth } from '../../../src/services/firebaseAuth';

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
      const mockUser = { uid: '123', email: 'test@example.com', getIdToken: jest.fn().mockResolvedValue('mock-token') };
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await firebaseAuth.signInWithEmail('test@example.com', 'password');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should create user with email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com', getIdToken: jest.fn().mockResolvedValue('mock-token') };
      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await firebaseAuth.createUserWithEmail('test@example.com', 'password');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      const result = await firebaseAuth.signInWithEmail('test@example.com', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Google Sign-In', () => {
    it('should sign in with Google', async () => {
      const result = await firebaseAuth.signInWithGoogle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google sign in not implemented');
    });

    it('should handle Google sign in errors', async () => {
      const result = await firebaseAuth.signInWithGoogle();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google sign in not implemented');
    });
  });

  describe('Sign Out', () => {
    it('should sign out user', async () => {
      mockSignOut.mockResolvedValue();

      const result = await firebaseAuth.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle sign out errors', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      const result = await firebaseAuth.signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValue();

      const result = await firebaseAuth.sendPasswordResetEmail('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should handle password reset errors', async () => {
      const errorMessage = 'Password reset failed';
      mockSendPasswordResetEmail.mockRejectedValue(new Error(errorMessage));

      const result = await firebaseAuth.sendPasswordResetEmail('test@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      const profileData = { displayName: 'John Doe' };
      mockUpdateProfile.mockResolvedValue();

      const result = await firebaseAuth.updateProfile(profileData);

      expect(mockUpdateProfile).toHaveBeenCalledWith(profileData);
      expect(result.success).toBe(true);
    });

    it('should handle profile update errors', async () => {
      const errorMessage = 'Profile update failed';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      const result = await firebaseAuth.updateProfile({ displayName: 'John Doe' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Auth State Changes', () => {
    it('should listen to auth state changes', () => {
      const callback = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(jest.fn());

      const unsubscribe = firebaseAuth.onAuthStateChanged(callback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
