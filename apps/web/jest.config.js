/**
 * Jest Configuration for Web App
 * Extends base configuration with Next.js/React specific settings
 */

const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  
  // Web-specific test environment
  testEnvironment: 'jsdom',
  
  // Web-specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/web-setup.js',
  ],
  
  // Web-specific coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!pages/_app.js',
    '!pages/_document.js',
    '!next.config.js',
  ],
  
  // Web-specific module mapping
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@web/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/styles/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
  },
  
  // Web-specific transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.(mjs|js|jsx|ts|tsx)$))',
  ],
  
  // Web-specific test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/pages/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Web-specific coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Web-specific timeout
  testTimeout: 10000,
  
  // Web-specific test path ignore patterns
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns,
    '<rootDir>/.next/',
    '<rootDir>/out/',
  ],
};
