import { firebaseAuth } from '../../../src/services/firebaseAuth';

// Mock Firebase Auth
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    sendPasswordResetEmail: mockSendPasswordResetEmail,
    currentUser: {
      updateProfile: mockUpdateProfile,
    },
  }),
}));

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

describe('Firebase Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email/Password Authentication', () => {
    it('should sign in with email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await firebaseAuth.signInWithEmail('test@example.com', 'password');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should create user with email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      const result = await firebaseAuth.createUserWithEmail('test@example.com', 'password');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      await expect(firebaseAuth.signInWithEmail('test@example.com', 'wrongpassword'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('Google Sign-In', () => {
    it('should sign in with Google', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      mockGoogleSignIn.mockResolvedValue({ user: mockUser });

      const result = await firebaseAuth.signInWithGoogle();

      expect(mockGoogleSignIn).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle Google sign in errors', async () => {
      const errorMessage = 'Google sign in failed';
      mockGoogleSignIn.mockRejectedValue(new Error(errorMessage));

      await expect(firebaseAuth.signInWithGoogle()).rejects.toThrow(errorMessage);
    });
  });

  describe('Sign Out', () => {
    it('should sign out user', async () => {
      mockSignOut.mockResolvedValue();

      await firebaseAuth.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      await expect(firebaseAuth.signOut()).rejects.toThrow(errorMessage);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValue();

      await firebaseAuth.sendPasswordResetEmail('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle password reset errors', async () => {
      const errorMessage = 'Password reset failed';
      mockSendPasswordResetEmail.mockRejectedValue(new Error(errorMessage));

      await expect(firebaseAuth.sendPasswordResetEmail('test@example.com'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      const profileData = { displayName: 'John Doe' };
      mockUpdateProfile.mockResolvedValue();

      await firebaseAuth.updateProfile(profileData);

      expect(mockUpdateProfile).toHaveBeenCalledWith(profileData);
    });

    it('should handle profile update errors', async () => {
      const errorMessage = 'Profile update failed';
      mockUpdateProfile.mockRejectedValue(new Error(errorMessage));

      await expect(firebaseAuth.updateProfile({ displayName: 'John Doe' }))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('Auth State Changes', () => {
    it('should listen to auth state changes', () => {
      const callback = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(jest.fn());

      firebaseAuth.onAuthStateChanged(callback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(callback);
    });
  });
});
