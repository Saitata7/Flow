# 📱 Mobile App Testing Guide

This directory contains comprehensive tests for the Flow mobile application, covering unit tests, integration tests, and end-to-end tests.

## 📁 Test Structure

```
tests/
├── README.md                    # This file
├── setup.js                     # Jest setup and mocks
├── utils/
│   └── testUtils.js             # Test utilities and helpers
├── unit/
│   ├── components/              # Component unit tests
│   │   └── Button.test.js
│   ├── hooks/                   # Custom hook tests
│   │   └── useAuth.test.js
│   ├── services/                # Service layer tests
│   │   └── firebaseAuth.test.js
│   └── utils/                   # Utility function tests
│       └── dateUtils.test.js
├── integration/
│   ├── api/                     # API integration tests
│   │   └── apiClient.test.js
│   ├── navigation/              # Navigation tests
│   │   └── navigation.test.js
│   └── auth/                    # Authentication tests
├── e2e/
│   ├── flows/                   # Flow management E2E tests
│   │   └── flowManagement.test.js
│   ├── plans/                   # Plan management E2E tests
│   └── profile/                 # Profile management E2E tests
```

## 🚀 Running Tests

### All Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### CI/CD
```bash
# Run tests for CI/CD pipeline
npm run test:ci
```

## 🧪 Test Categories

### Unit Tests (`tests/unit/`)
Test individual components, hooks, services, and utilities in isolation.

**Components**
- Button component with different variants and states
- Form components with validation
- Display components with data rendering

**Hooks**
- useAuth hook for authentication state
- useFlows hook for flow management
- usePlans hook for plan management
- Custom hooks for data fetching and state management

**Services**
- Firebase authentication service
- API client service
- Local storage service
- Notification service

**Utils**
- Date utility functions
- Validation utilities
- Formatting utilities
- Helper functions

### Integration Tests (`tests/integration/`)
Test how different parts of the application work together.

**API Integration**
- HTTP client with different request types
- Authentication token handling
- Request/response interceptors
- Error handling

**Navigation Integration**
- Screen navigation flow
- Tab navigation
- Stack navigation
- Deep linking

**Authentication Integration**
- Login/logout flow
- Token management
- Protected route access
- Session persistence

### End-to-End Tests (`tests/e2e/`)
Test complete user workflows from start to finish.

**Flow Management**
- Create new flow
- Edit existing flow
- Delete flow
- Add/edit/delete flow entries
- View flow statistics

**Plan Management**
- Create new plan
- Join/leave plan
- Manage plan participants
- View plan progress

**Profile Management**
- Update user profile
- Change settings
- Manage preferences
- View statistics

## 🛠️ Test Utilities

### Test Utils (`tests/utils/testUtils.js`)
Provides common utilities for testing:

```javascript
import {
  renderWithProviders,
  createMockUser,
  createMockFlow,
  createMockFlowEntry,
  createMockPlan,
  createMockNavigation,
  createMockRoute,
  createMockApiResponse,
  createMockApiError,
  waitForAsync,
  cleanupMocks,
} from './utils/testUtils';
```

### Mock Data Generators
- `createMockUser()` - Generate mock user data
- `createMockFlow()` - Generate mock flow data
- `createMockFlowEntry()` - Generate mock flow entry data
- `createMockPlan()` - Generate mock plan data

### Test Wrappers
- `renderWithProviders()` - Render components with all context providers
- `createMockNavigation()` - Create mock navigation object
- `createMockRoute()` - Create mock route object

### API Mocks
- `createMockApiResponse()` - Generate successful API response
- `createMockApiError()` - Generate error API response

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/', '<rootDir>/dist/'],
  transformIgnorePatterns: [...],
  moduleNameMapping: {...},
  collectCoverageFrom: [...],
  coverageThreshold: {...},
  testEnvironment: 'jsdom',
};
```

### Test Setup (`tests/setup.js`)
- Mock AsyncStorage
- Mock Firebase modules
- Mock React Navigation
- Mock Expo modules
- Global test utilities

## 📊 Coverage Requirements

The test suite maintains the following coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🎯 Testing Best Practices

### 1. Test Structure
```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Test implementation
  });
});
```

### 2. Mocking
- Mock external dependencies
- Use realistic mock data
- Clean up mocks between tests
- Mock at the right level

### 3. Assertions
- Use specific assertions
- Test both success and error cases
- Verify side effects
- Test edge cases

### 4. Async Testing
```javascript
it('should handle async operations', async () => {
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

## 🐛 Debugging Tests

### Running Specific Tests
```bash
# Run specific test file
npm test Button.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Run tests in specific directory
npm test tests/unit/components/
```

### Debug Mode
```bash
# Run tests in debug mode
npm test -- --verbose --no-cache
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

## 📚 Test Examples

### Component Test
```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../src/components/common/Button';

describe('Button Component', () => {
  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Hook Test
```javascript
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../../../src/hooks/useAuth';

describe('useAuth Hook', () => {
  it('should handle sign in', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeTruthy();
  });
});
```

### Integration Test
```javascript
import { renderWithProviders } from '../utils/testUtils';
import { AddFlow } from '../../../src/screens/flow/AddFlow';

describe('Add Flow Integration', () => {
  it('should create flow successfully', async () => {
    const { getByTestId } = renderWithProviders(<AddFlow />);
    
    fireEvent.changeText(getByTestId('title-input'), 'New Flow');
    fireEvent.press(getByTestId('create-button'));
    
    await waitFor(() => {
      expect(mockCreateFlow).toHaveBeenCalled();
    });
  });
});
```

## 🚨 Common Issues

### 1. Mock Issues
- Ensure mocks are properly configured
- Check mock return values
- Verify mock function calls

### 2. Async Issues
- Use `waitFor` for async operations
- Handle promises correctly
- Mock async functions properly

### 3. Navigation Issues
- Mock navigation props
- Use test navigation container
- Handle navigation state

### 4. Context Issues
- Wrap components with providers
- Mock context values
- Test context updates

## 📈 Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    npm install
    npm run test:ci
```

## 🔄 Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `ComponentName.test.js`
3. Import necessary testing utilities
4. Write comprehensive test cases
5. Update coverage thresholds if needed

### Updating Tests
1. Update tests when components change
2. Maintain test coverage
3. Update mock data as needed
4. Refactor tests for better maintainability

---

**Remember**: Good tests are fast, reliable, and maintainable. Focus on testing behavior, not implementation details.
