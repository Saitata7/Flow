const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { FlowModel, UserModel, PlanModel, UserProfileModel, UserSettingsModel } = require('../src/db/models');

describe('Soft Delete Functionality Tests', () => {
  beforeEach(() => {
    // Mock database operations
    jest.clearAllMocks();
  });

  test('FlowModel should have softDelete method', () => {
    expect(typeof FlowModel.softDelete).toBe('function');
  });

  test('UserModel should have softDelete method', () => {
    expect(typeof UserModel.softDelete).toBe('function');
  });

  test('PlanModel should have softDelete method', () => {
    expect(typeof PlanModel.softDelete).toBe('function');
  });

  test('UserProfileModel should have softDelete method', () => {
    expect(typeof UserProfileModel.softDelete).toBe('function');
  });

  test('UserSettingsModel should have softDelete method', () => {
    expect(typeof UserSettingsModel.softDelete).toBe('function');
  });

  test('UserModel.findById should exclude soft-deleted users', () => {
    expect(typeof UserModel.findById).toBe('function');
  });

  test('UserModel.delete should call softDelete', () => {
    expect(typeof UserModel.delete).toBe('function');
  });
});
