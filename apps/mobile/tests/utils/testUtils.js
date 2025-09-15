import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../src/context/AuthContext';
import { FlowProvider } from '../../src/context/FlowContext';
import { PlanProvider } from '../../src/context/PlanContext';
import { ThemeProvider } from '../../src/context/ThemeContext';

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  uid: '123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  ...overrides,
});

export const createMockFlow = (overrides = {}) => ({
  id: '1',
  title: 'Test Flow',
  description: 'Test flow description',
  tracking_type: 'binary',
  visibility: 'private',
  owner_id: '123',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

export const createMockFlowEntry = (overrides = {}) => ({
  id: '1',
  flow_id: '1',
  content: 'Test entry',
  symbol: '✓',
  date: '2024-01-15',
  mood_score: 5,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

export const createMockPlan = (overrides = {}) => ({
  id: '1',
  title: 'Test Plan',
  description: 'Test plan description',
  visibility: 'public',
  owner_id: '123',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

// Test wrapper with all providers
export const renderWithProviders = (
  ui,
  {
    initialAuthState = { user: null, loading: false, error: null },
    initialFlowState = { flows: [], loading: false, error: null },
    initialPlanState = { plans: [], loading: false, error: null },
    initialThemeState = { theme: 'light', colors: {} },
    ...renderOptions
  } = {}
) => {
  const AllProviders = ({ children }) => (
    <NavigationContainer>
      <AuthProvider value={initialAuthState}>
        <FlowProvider value={initialFlowState}>
          <PlanProvider value={initialPlanState}>
            <ThemeProvider value={initialThemeState}>
              {children}
            </ThemeProvider>
          </PlanProvider>
        </FlowProvider>
      </AuthProvider>
    </NavigationContainer>
  );

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Mock navigation
export const createMockNavigation = (overrides = {}) => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  ...overrides,
});

export const createMockRoute = (overrides = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params: {},
  ...overrides,
});

// Mock API responses
export const createMockApiResponse = (data, overrides = {}) => ({
  success: true,
  data,
  meta: {
    timestamp: '2024-01-15T10:00:00Z',
    ...overrides.meta,
  },
  ...overrides,
});

export const createMockApiError = (message, status = 400) => ({
  success: false,
  error: {
    message,
    status,
    code: 'ERROR_CODE',
  },
});

// Test helpers
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Mock Firebase
export const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: null,
};

// Mock Google Sign-In
export const mockGoogleSignIn = {
  configure: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  isSignedIn: jest.fn(),
  getCurrentUser: jest.fn(),
};

// Test data sets
export const mockFlows = [
  createMockFlow({ id: '1', title: 'Morning Routine' }),
  createMockFlow({ id: '2', title: 'Exercise', visibility: 'public' }),
  createMockFlow({ id: '3', title: 'Reading', tracking_type: 'quantitative' }),
];

export const mockFlowEntries = [
  createMockFlowEntry({ id: '1', flow_id: '1', content: 'Completed morning routine' }),
  createMockFlowEntry({ id: '2', flow_id: '1', content: 'Skipped morning routine', symbol: '✗' }),
  createMockFlowEntry({ id: '3', flow_id: '2', content: 'Ran 5km', symbol: '✓' }),
];

export const mockPlans = [
  createMockPlan({ id: '1', title: '30-Day Challenge' }),
  createMockPlan({ id: '2', title: 'Weekly Goals', visibility: 'private' }),
  createMockPlan({ id: '3', title: 'Monthly Targets' }),
];

// Test assertions
export const expectToBeVisible = (element) => {
  expect(element).toBeTruthy();
};

export const expectToHaveText = (element, text) => {
  expect(element).toHaveTextContent(text);
};

export const expectToHaveStyle = (element, style) => {
  expect(element).toHaveStyle(style);
};

// Test cleanup
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

// Test setup helpers
export const setupTestEnvironment = () => {
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
  };

  // Mock timers
  jest.useFakeTimers();
};

export const teardownTestEnvironment = () => {
  jest.useRealTimers();
  cleanupMocks();
};
