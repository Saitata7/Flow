import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../../../src/hooks/useAuth';

// Mock sessionManager
const mockSessionManager = {
  getStoredSession: jest.fn(),
  initialize: jest.fn(),
  clearSession: jest.fn(),
  storeSession: jest.fn(),
};

jest.mock('../../../src/utils/sessionManager', () => mockSessionManager);

// Mock clearDemoData
jest.mock('../../../src/utils/clearDemoData', () => ({
  clearDemoData: jest.fn(),
}));

// Mock generateIdempotencyKey
jest.mock('../../../src/utils/idempotency', () => ({
  generateIdempotencyKey: jest.fn(() => 'mock-idempotency-key'),
}));

// Create a test wrapper with QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no user when no session exists', async () => {
    mockSessionManager.getStoredSession.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createTestWrapper(),
    });

    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return user when session exists', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockSessionManager.getStoredSession.mockResolvedValue({
      type: 'user',
      data: { userData: mockUser }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createTestWrapper(),
    });

    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // The query should return the user data
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should clear demo user data when demo user is detected', async () => {
    const { clearDemoData } = require('../../../src/utils/clearDemoData');
    const mockDemoUser = { id: 'user123', email: 'demo@flow.app', displayName: 'Demo User' };
    
    mockSessionManager.getStoredSession.mockResolvedValue({
      type: 'user',
      data: { userData: mockDemoUser }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createTestWrapper(),
    });

    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // The demo user should be cleared and user should be null
    expect(clearDemoData).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('should handle session manager errors gracefully', async () => {
    mockSessionManager.getStoredSession.mockRejectedValue(new Error('Session error'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createTestWrapper(),
    });

    // Wait for the query to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});