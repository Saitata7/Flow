import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../../../src/hooks/useAuth';
import { AuthProvider } from '../../../src/context/AuthContext';

// Mock Firebase Auth
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockSignUp = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: mockSignIn,
    signOut: mockSignOut,
    createUserWithEmailAndPassword: mockSignUp,
    onAuthStateChanged: mockOnAuthStateChanged,
  }),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle sign in', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    mockSignIn.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle sign up', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    mockSignUp.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password');
    });

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle sign out', async () => {
    mockSignOut.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should handle authentication errors', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'wrongpassword');
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should clear error when successful', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    mockSignIn.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // First set an error
    await act(async () => {
      await result.current.signIn('test@example.com', 'wrongpassword');
    });

    // Then sign in successfully
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.error).toBeNull();
  });
});
