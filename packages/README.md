# Packages

This directory contains shared packages and libraries used across the Flow monorepo.

## 📂 Structure

```
packages/
├── api-sdk/          # Shared API client library
└── data-models/      # JSON schemas and data validation
```

## 🎯 Overview

These packages enable code reuse and consistency across different applications:

- **Consistency** - Shared components ensure uniform UI/UX
- **Efficiency** - Avoid duplicating code across apps
- **Maintainability** - Single source of truth for shared logic
- **Type Safety** - Shared types ensure consistency

## 📦 Available Packages

### API SDK (`api-sdk/`)

Shared client for making API calls to the Flow backend.

**Features:**
- Type-safe API calls
- Automatic error handling
- Request/response interceptors
- Token management
- Retry logic

**Usage:**
```javascript
import { FlowAPI } from '@flow/api-sdk';

const api = new FlowAPI({
  baseURL: 'https://api.flow.app',
  token: 'your-jwt-token'
});

const flows = await api.getFlows();
```

**Documentation:** See `api-sdk/README.md` (if exists)

### Data Models (`data-models/`)

JSON schemas and validation for Flow data structures.

**Features:**
- JSON Schema definitions
- Data validation utilities
- Type definitions (TypeScript if implemented)
- Schema versioning

**Usage:**
```javascript
import { validateFlow, validateFlowEntry } from '@flow/data-models';

const isValid = validateFlow(flowData);
if (!isValid) {
  console.error('Invalid flow data');
}
```

**Schemas:**
- `flow.schema.json` - Flow/habit definitions
- `flowEntry.schema.json` - Daily entry records
- `plan.schema.json` - Plan/ritual structures
- `settings.schema.json` - User settings

**Documentation:** See `data-models/README.md` (if exists)

## 🚀 Development

### Install Dependencies

```bash
# Install all package dependencies
yarn install

# Install specific package
cd api-sdk
npm install
```

### Build Packages

```bash
# Build all packages
yarn build

# Build specific package
cd api-sdk
npm run build
```

### Use in Apps/Services

```bash
# From mobile app
yarn workspace @flow/mobile add @flow/api-sdk

# From API service
yarn workspace @flow/api add @flow/data-models
```

## 🧪 Testing

```bash
# Test all packages
yarn test

# Test specific package
cd api-sdk
npm test
```

## 📝 Adding New Packages

### 1. Create Package Directory
```bash
mkdir packages/my-package
cd packages/my-package
```

### 2. Initialize Package
```bash
npm init -y
```

### 3. Configure package.json
```json
{
  "name": "@flow/my-package",
  "version": "1.0.0",
  "main": "src/index.js",
  "private": true,
  "scripts": {
    "build": "tsc || echo 'No build step'",
    "test": "jest"
  }
}
```

### 4. Update Root Workspaces
Add to root `package.json`:
```json
{
  "workspaces": [
    "packages/my-package"
  ]
}
```

### 5. Implement Package
- Add source code in `src/`
- Add tests in `tests/`
- Add README.md

### 6. Install Dependencies
```bash
# From root
yarn install
```

## 📚 Package Guidelines

### Naming Convention
- Package names: `@flow/package-name`
- Use kebab-case for package names
- Keep names descriptive and concise

### Structure
```
packages/my-package/
├── src/              # Source code
├── tests/            # Test files
├── README.md         # Package documentation
├── package.json      # Package configuration
└── tsconfig.json     # TypeScript config (if applicable)
```

### Versioning
- Follow semantic versioning (semver)
- Update version in `package.json` when making changes
- Use `private: true` for internal packages

### Documentation
Each package should include:
- README.md with usage examples
- JSDoc comments for public APIs
- Type definitions (TypeScript or JSDoc)

## 🔗 Package Dependencies

### Internal Dependencies
```javascript
// In package.json
{
  "dependencies": {
    "@flow/data-models": "workspace:*"
  }
}
```

### External Dependencies
```javascript
// In package.json
{
  "dependencies": {
    "axios": "^1.0.0"
  }
}
```

## 🚀 Publishing (Future)

If packages need to be published to npm:

```bash
# Build package
cd api-sdk
npm run build

# Publish to npm
npm publish --access public
```

Currently, all packages are marked `private: true` and used internally.

## 📚 Documentation

- **API SDK**: See `api-sdk/` directory
- **Data Models**: See `data-models/` directory
- **Monorepo Guide**: [../README.md](../README.md)

## 🤝 Contributing

When modifying packages:

1. Update version in `package.json`
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility
5. Test in consuming apps

## 📄 License

Part of the Flow ecosystem. See main project README for license information.
