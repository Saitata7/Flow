/**
 * Jest Configuration for API SDK Package
 * Extends base configuration with SDK-specific settings
 */

const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  
  // SDK-specific test environment
  testEnvironment: 'node',
  
  // SDK-specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
  
  // SDK-specific coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/index.js',
  ],
  
  // SDK-specific module mapping
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@api-sdk/(.*)$': '<rootDir>/src/$1',
    '^@client/(.*)$': '<rootDir>/src/client/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // SDK-specific test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // SDK-specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // SDK-specific timeout
  testTimeout: 10000,
};
