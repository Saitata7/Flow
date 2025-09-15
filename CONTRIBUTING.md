# Contributing to Flow

Thank you for your interest in contributing to Flow! This document outlines our testing strategy, coding standards, and contribution guidelines.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Code Quality Standards](#code-quality-standards)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [CI/CD Pipeline](#cicd-pipeline)
- [Performance Standards](#performance-standards)
- [Security Guidelines](#security-guidelines)

## Testing Strategy

### Overview

Flow uses a comprehensive testing strategy designed for scalability and long-term maintainability across 5+ versions. Our testing pyramid includes:

- **Unit Tests** (70%): Fast, isolated tests for individual components/functions
- **Integration Tests** (20%): Tests for component interactions and API endpoints
- **E2E Tests** (10%): Full user journey tests across platforms

### Testing Tools

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit & Integration | Jest | Fast, mocks external dependencies |
| Mobile E2E | Detox | React Native end-to-end testing |
| Web/Admin E2E | Playwright | Browser automation |
| API E2E | Supertest + Jest | Endpoint and database testing |
| Contract/Schema | AJV | JSON Schema validation |
| Load & Performance | k6/Artillery | Stress and scale testing |
| Security | OWASP ZAP, npm audit | Security vulnerability scanning |

### Coverage Requirements

Minimum coverage thresholds enforced across all workspaces:

- **Statements**: 80%
- **Branches**: 75%
- **Lines**: 80%
- **Functions**: 80%

Higher thresholds for critical packages:
- **Data Models**: 95% (validation logic)
- **API SDK**: 90% (client reliability)
- **API Controllers**: 85% (business logic)

## Code Quality Standards

### File Naming Conventions

- Test files: `featureName.test.js` or `*.spec.js`
- Co-locate tests with source files for small modules
- Place tests under `/tests` for larger modules
- Use `__fixtures__/` for mock data and snapshots

### Code Organization

```
flow/
├── apps/
│   ├── mobile/tests/
│   │   ├── unit/                 # Components, hooks, utils
│   │   ├── integration/          # Navigation, context, API calls
│   │   └── e2e/                  # Detox flows
│   ├── web/tests/
│   │   ├── unit/
│   │   ├── integration/          # React Testing Library
│   │   └── e2e/                  # Playwright browser tests
│   └── admin/tests/
├── services/
│   ├── api/tests/
│   │   ├── unit/                 # Controllers, utils
│   │   ├── integration/          # DB, Redis, external API
│   │   └── e2e/                  # Supertest for endpoints
├── packages/
│   ├── api-sdk/tests/
│   ├── data-models/tests/        # Validate JSON schemas
│   ├── feature-flags/tests/
│   └── ui-kit/tests/             # Snapshot + interaction
└── tests/                        # Global smoke, perf, security
    ├── e2e/                      # Cross-app scenarios
    ├── perf/                     # k6 / Artillery
    └── security/                 # OWASP ZAP, audit scripts
```

### Testing Rules

1. **Unit Tests**: No network/DB calls (mock them)
2. **Integration Tests**: Real DB (seed with factories)
3. **E2E Tests**: Run on staging DB with disposable data
4. **Snapshots**: Only for stable UI components
5. **Mocks**: Use consistent mock data from `__fixtures__/`

## Development Workflow

### Prerequisites

- Node.js 20+
- Yarn 1.22+
- Docker (for local services)
- iOS Simulator (for mobile testing)
- Android Emulator (for mobile testing)

### Setup

```bash
# Clone and install dependencies
git clone <repository>
cd flow
yarn install

# Start development services
yarn dev

# Run tests
yarn test
```

### Workspace Commands

```bash
# Run tests for specific workspace
yarn workspace @flow/api test
yarn workspace @flow/mobile test
yarn workspace @flow/web test

# Run specific test types
yarn test:unit
yarn test:integration
yarn test:e2e
yarn test:coverage

# Run tests in CI mode
yarn test:ci
```

## Testing Guidelines

### Writing Tests

#### Unit Tests

```javascript
// Good: Isolated, fast, focused
describe('FlowCard Component', () => {
  it('should render flow title', () => {
    const flow = { title: 'Test Flow' };
    render(<FlowCard flow={flow} />);
    expect(screen.getByText('Test Flow')).toBeInTheDocument();
  });
});
```

#### Integration Tests

```javascript
// Good: Tests component interactions
describe('Flow Management', () => {
  it('should create and display new flow', async () => {
    const { getByText, getByPlaceholderText } = render(<FlowDashboard />);
    
    fireEvent.click(getByText('Create Flow'));
    fireEvent.change(getByPlaceholderText('Flow title'), { 
      target: { value: 'New Flow' } 
    });
    fireEvent.click(getByText('Save'));
    
    await waitFor(() => {
      expect(getByText('New Flow')).toBeInTheDocument();
    });
  });
});
```

#### E2E Tests

```javascript
// Good: Full user journey
describe('User Onboarding', () => {
  it('should complete onboarding flow', async () => {
    await device.launchApp();
    await element(by.id('sign-up-button')).tap();
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('submit-button')).tap();
    
    await expect(element(by.id('dashboard'))).toBeVisible();
  });
});
```

### Test Data Management

#### Fixtures

```javascript
// tests/__fixtures__/flows.js
export const mockFlows = [
  {
    id: '1',
    title: 'Test Flow',
    tracking_type: 'binary',
    visibility: 'private',
  },
  // ... more test data
];
```

#### Factories

```javascript
// tests/__factories__/flowFactory.js
export const createFlow = (overrides = {}) => ({
  id: '123',
  title: 'Test Flow',
  tracking_type: 'binary',
  visibility: 'private',
  owner_id: '456',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});
```

### Mocking Guidelines

#### API Calls

```javascript
// Mock external API calls
jest.mock('../src/services/apiClient', () => ({
  getFlows: jest.fn().mockResolvedValue(mockFlows),
  createFlow: jest.fn().mockResolvedValue(mockFlow),
}));
```

#### Navigation

```javascript
// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
```

#### Database

```javascript
// Mock database operations
jest.mock('../src/db/models', () => ({
  FlowModel: {
    findById: jest.fn().mockResolvedValue(mockFlow),
    create: jest.fn().mockResolvedValue(mockFlow),
  },
}));
```

## CI/CD Pipeline

### Automated Testing

Our CI/CD pipeline runs the following tests automatically:

1. **Lint & Format Check**: ESLint, Prettier, TypeScript
2. **Unit Tests**: All workspaces in parallel
3. **Integration Tests**: Database and API tests
4. **E2E Tests**: Cross-platform end-to-end tests
5. **Performance Tests**: Load and stress testing
6. **Security Tests**: Vulnerability scanning
7. **Coverage Report**: Upload to Codecov

### Branch Protection

- All tests must pass before merging
- Coverage must meet minimum thresholds
- No linting errors allowed
- Security vulnerabilities must be resolved

### Test Environments

- **Development**: Local testing with mock services
- **Staging**: Integration testing with real services
- **Production**: Smoke tests and monitoring

## Performance Standards

### Response Time Requirements

- **API Endpoints**: < 200ms (95th percentile)
- **Database Queries**: < 100ms (95th percentile)
- **Page Load**: < 2s (95th percentile)
- **Mobile App Launch**: < 3s (95th percentile)

### Load Testing

- **Concurrent Users**: 10,000+
- **API Requests**: 100,000+ per minute
- **Database Connections**: 500+ concurrent
- **Memory Usage**: < 512MB per service

### Performance Testing Tools

- **k6**: Load testing scripts
- **Artillery**: Performance testing
- **Lighthouse**: Web performance audits
- **Flipper**: Mobile performance profiling

## Security Guidelines

### Security Testing

- **OWASP ZAP**: Automated security scanning
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring
- **CodeQL**: Static analysis security testing

### Security Requirements

- All dependencies must be vulnerability-free
- API endpoints must be properly authenticated
- Sensitive data must be encrypted
- Input validation must be implemented
- CORS must be properly configured

### Security Best Practices

- Use environment variables for secrets
- Implement rate limiting
- Use HTTPS in production
- Regular security audits
- Keep dependencies updated

## Getting Help

### Resources

- [Testing Documentation](./docs/TESTING.md)
- [API Documentation](./docs/API_USAGE.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Coding Guidelines](./prompt/CODING_GUIDELINES.md)

### Support

- Create an issue for bugs or feature requests
- Join our Discord for real-time help
- Check existing issues before creating new ones
- Provide detailed reproduction steps

## Code Review Process

### Review Checklist

- [ ] Tests pass locally
- [ ] Coverage meets requirements
- [ ] Code follows style guidelines
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Breaking changes documented

### Review Guidelines

- Be constructive and respectful
- Focus on code quality and functionality
- Test changes thoroughly
- Provide clear feedback
- Approve only when confident

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Coverage meets requirements
- [ ] Security scan passes
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared

---

**Remember**: Every new feature must ship with tests (unit + integration). CI should block merges without coverage or lint compliance.

Happy testing! 🧪