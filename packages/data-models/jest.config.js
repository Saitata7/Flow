/**
 * Jest Configuration for Data Models Package
 * Extends base configuration with package-specific settings
 */

const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  
  // Package-specific test environment
  testEnvironment: 'node',
  
  // Package-specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // Package-specific coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/index.js',
  ],
  
  // Package-specific module mapping
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@data-models/(.*)$': '<rootDir>/src/$1',
    '^@schemas/(.*)$': '<rootDir>/src/schemas/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@validation/(.*)$': '<rootDir>/src/validation/$1',
  },
  
  // Package-specific test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Package-specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Package-specific timeout
  testTimeout: 5000,
};
