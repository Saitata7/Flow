# Packages

This directory contains shared packages and libraries used across the Flow monorepo.

## Structure

- `api-sdk/` - Shared client for APIs (future)
- `data-models/` - JSON schemas and TypeScript types (future)
- `feature-flags/` - Feature toggle registry (future)
- `ui-kit/` - Shared React Native components (future)

## Purpose

These packages enable code reuse across different applications in the monorepo:

- **Consistency**: Shared components ensure consistent UI/UX
- **Efficiency**: Avoid duplicating code across apps
- **Maintainability**: Single source of truth for shared logic
- **Type Safety**: Shared types ensure consistency across apps

## Development

Each package should have its own `package.json` and can be published to npm or used internally:

```bash
# Install dependencies for all packages
yarn install

# Build all packages
yarn build

# Test all packages
yarn test
```

## Adding New Packages

1. Create a new directory under `packages/`
2. Add a `package.json` with appropriate name (`@flow/package-name`)
3. Implement the package functionality
4. Update root `package.json` workspaces if needed
5. Add documentation in the package directory
