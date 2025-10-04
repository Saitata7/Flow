/**
 * Global Test Setup for Flow Monorepo
 * Shared setup across all workspaces
 */

// Extend Jest matchers
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock process.env for consistent testing
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

// Global test utilities
global.testUtils = {
  // Mock data generators
  createMockUser: (overrides = {}) => ({
    id: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }),
  
  createMockFlow: (overrides = {}) => ({
    id: '1',
    title: 'Test Flow',
    description: 'Test flow description',
    tracking_type: 'binary',
    visibility: 'private',
    owner_id: '123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }),
  
  createMockFlowEntry: (overrides = {}) => ({
    id: '1',
    flow_id: '1',
    content: 'Test entry',
    symbol: '+',
    date: '2024-01-15',
    mood_score: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }),
  
  createMockPlan: (overrides = {}) => ({
    id: '1',
    title: 'Test Plan',
    description: 'Test plan description',
    visibility: 'public',
    owner_id: '123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }),
  
  // Wait utilities
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Mock cleanup
  cleanupMocks: () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  },
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock crypto for Node.js environments
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
  };
}

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  global.fetch.mockClear();
  
  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
