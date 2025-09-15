/**
 * Jest Configuration for Mobile App
 * Extends base configuration with React Native specific settings
 */

const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  
  // React Native specific preset
  preset: 'react-native',
  
  // Mobile-specific test environment
  testEnvironment: 'jsdom',
  
  // Mobile-specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/mobile-setup.js',
  ],
  
  // Mobile-specific coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/App.js',
    '!src/navigation/**',
  ],
  
  // Mobile-specific module mapping
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@mobile/(.*)$': '<rootDir>/src/$1',
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
  
  // Mobile-specific transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@expo|expo|@react-navigation|@react-native-firebase|@react-native-google-signin|@react-native-async-storage|@react-native-clipboard|@react-native-community|@react-native-picker|@react-native-permissions|@react-native-push-notification|@react-native-vector-icons|@react-native-svg|@react-native-uuid|@react-native-iphone-x-helper|@react-native-modal|@react-native-pager-view|@react-native-pie-chart|@react-native-super-ellipse-mask|@react-native-worklets|@react-native-fingerprint-scanner|@react-native-figma-squircle|@squircle-js|react-native-calendars|react-native-chart-kit|react-native-gifted-charts|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-uuid|victory-native|lucide-react-native|validator|moment|date-fns|react-day-picker)/)',
  ],
  
  // Mobile-specific test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Mobile-specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Mobile-specific timeout
  testTimeout: 10000,
  
  // Mobile-specific test path ignore patterns
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns,
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/.expo/',
  ],
};