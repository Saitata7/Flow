/**
 * Detox Configuration for Mobile E2E Testing
 * Configures Detox for React Native end-to-end testing
 */

const { DetoxCircusEnvironment, SpecReporter, WorkerAssignReporter } = require('detox/runners/jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Can be safely removed, if you are content with the default behavior (= the new behavior).
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

module.exports = {
  testEnvironment: 'detox',
  testEnvironmentOptions: {
    DetoxCircusEnvironment: CustomDetoxEnvironment,
  },
  testRunner: 'detox/runners/jest',
  testMatch: ['<rootDir>/tests/e2e/**/*.test.{js,jsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
  reporters: ['detox/runners/jest/reporter'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  verbose: true,
};
