# Flow – Coding Guidelines

> Applies to all workspaces: `apps/*`, `services/*`, `packages/*`

---

## 1️⃣ General Principles
- Keep **runtime code** separate from docs/tests.
- Never mix mobile/web code with backend logic.
- Keep commits small & meaningful (one feature/fix per commit).
- Use TypeScript everywhere (mobile, web, services, packages).

---

## 2️⃣ Monorepo Rules
- All workspaces must have their own `package.json`.
- Shared code lives in `packages/`.
- Only `apps/` can import from `services/` via `packages/api-sdk` (never direct).
- `docs/` and `tests/` are excluded from production bundles.

---

## 3️⃣ File & Folder Conventions
| Item | Rule |
|------|------|
| Components | `PascalCase` files under `src/components/` |
| Screens | `PascalCase` under `src/screens/<feature>` |
| Services / Hooks | `camelCase` filenames |
| API Controllers | `<domain>.controller.ts` |
| Routes | `<domain>.routes.ts` |
| Redis Utils | `<purpose>.cache.ts` |
| Tests | Mirror source path, suffix with `.test.ts` |
| Config | `*.config.ts` or `.json` |

---

## 4️⃣ Code Style
- Use **Prettier** for formatting.
- Use **ESLint (Airbnb + Prettier)** for linting.
- Max line length: 100 chars.
- Prefer `async/await` over raw Promises.
- Destructure props & params.
- Never suppress TypeScript errors with `any` unless unavoidable.

---

## 5️⃣ Error Handling
- Use central error middleware in `services/api`.
- Throw domain-specific errors (`FlowNotFoundError`, etc.).
- Log errors (with userId & requestId) but never leak PII.

---

## 6️⃣ Testing
- Unit tests for utils, services, SDK.
- Integration tests for API endpoints.
- Snapshot tests for shared UI.
- All new code requires tests before merge.

---

## 7️⃣ Security
- Validate all inputs against JSON schemas (`packages/data-models`).
- Sanitize user-generated content (bio, notes).
- Never log secrets or access tokens.

---

## 8️⃣ Git & Branching
- `main`: production.
- `develop`: staging.
- Feature branches: `feat/<topic>`.
- Hotfix branches: `hotfix/<topic>`.

---

> **Golden Rule:** If a module grows >500 lines or has >3 responsibilities, refactor into smaller files.
