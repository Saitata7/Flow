Purpose

Coding standards for the Flow app so all contributors (and AI tools like Cursor) generate predictable, maintainable code.

File & Folder Naming

Use camelCase for JS/TS files (e.g., habitService.js).

React components: PascalCase (e.g., FlowCard.js).

Tests mirror source folder with .test.js suffix.

Place domain logic in services/, not inside Context or UI.

Components

Keep components stateless; connect via hooks.

Break complex screens into small composable pieces.

Use propTypes or TypeScript interfaces.

Services

One service per domain: flowService, planService, statsService.

Always handle errors & return typed results.

Keep network calls here; no fetch in UI components.

Context & Hooks

Context: for light UI state (theme, auth, sync status).

Hooks: for data fetching, caching, domain logic composition.

Testing

Unit test services & hooks.

Integration tests for sync queue, offline edits, cheat mode.

Code Quality

Use ESLint & Prettier.

Avoid long functions (>40 lines).

Comment tricky logic (e.g., conflict resolution).

Write docstrings for services and hooks.