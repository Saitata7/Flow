/**
 * Jest Configuration for API Service
 * Extends base configuration with API-specific settings
 */

const baseConfig = require('../../jest.config.base.js');

module.exports = {
  // API-specific test environment
  testEnvironment: 'node',
  
  // API-specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/api-setup.js',
  ],
  
  // API-specific coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/migrations/**',
    '!src/seeds/**',
  ],
  
  // API-specific module mapping
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@api/(.*)$': '<rootDir>/src/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@redis/(.*)$': '<rootDir>/src/redis/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
  },
  
  // API-specific test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // API-specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // API-specific timeout
  testTimeout: 15000,
  
  // API-specific transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.(mjs|js|jsx|ts|tsx)$))',
  ],
};
