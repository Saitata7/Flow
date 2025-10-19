/**
 * Jest Configuration for Mobile App
 * Simplified configuration for React Native testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/mobile-setup.js',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/index.js',
    '!src/App.js',
  ],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@styles/(.*)$': '<rootDir>/styles/$1',
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@expo|expo|@react-navigation|@react-native-firebase|@react-native-google-signin|@react-native-async-storage|@react-native-clipboard|@react-native-community|@react-native-picker|@react-native-permissions|@react-native-push-notification|@react-native-vector-icons|@react-native-svg|@react-native-uuid|@react-native-iphone-x-helper|@react-native-modal|@react-native-pager-view|@react-native-pie-chart|@react-native-super-ellipse-mask|@react-native-worklets|@react-native-fingerprint-scanner|@react-native-figma-squircle|@squircle-js|react-native-calendars|react-native-chart-kit|react-native-gifted-charts|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-uuid|victory-native|lucide-react-native|validator|moment|date-fns|react-day-picker)/)',
  ],

  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.spec.{js,jsx}',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  // Test timeout
  testTimeout: 10000,

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Global variables
  globals: {
    __DEV__: true,
  },
};