# Apps

This directory contains all applications in the Flow monorepo.

## Structure

- `mobile/` - React Native mobile application (main product)
- `web/` - Web application for profiles and public pages (future)
- `admin/` - Admin dashboard (future)

## Development

Each app has its own package.json and can be run independently:

```bash
# Run mobile app
yarn workspace @flow/mobile start

# Run web app (when implemented)
yarn workspace @flow/web dev

# Run admin app (when implemented)
yarn workspace @flow/admin dev
```

## Shared Resources

Apps can share code through the `packages/` directory, which contains reusable libraries and components.
