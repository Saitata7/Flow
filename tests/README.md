# Tests

This directory contains all test suites for the Flow monorepo.

## Structure

- `mobile/` - Tests for the React Native mobile app
- `web/` - Tests for the web application (future)
- `api/` - Tests for backend services (future)

## Testing Strategy

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **API Tests**: Test backend endpoints and services

## Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific app
yarn workspace @flow/mobile test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

## Test Configuration

Each test directory should contain:

- Test configuration files (Jest, Cypress, etc.)
- Test utilities and helpers
- Mock data and fixtures
- Test documentation

## Best Practices

- Write tests for critical business logic
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies
- Maintain good test coverage (>80%)
