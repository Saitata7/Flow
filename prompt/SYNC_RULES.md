# SYNC\_RULES.md

## 🔄 Purpose

This document defines how **Flow** handles offline storage, caching, background sync, and conflict resolution. It ensures consistent behavior across services, UI, and AI-generated code.

---

## 1️⃣ Offline-First Principles

* All write operations go through `syncService`.
* Data is persisted locally (AsyncStorage or SQLite) when offline.
* Queue retries automatically when network returns.
* Firestore remains source of truth; Redis optimizes reads for leaderboards and stats.

---

## 2️⃣ Write Queue Contract

| Field            | Description                         |
| ---------------- | ----------------------------------- |
| `idempotencyKey` | UUID v4, unique per queued write.   |
| `op`             | HTTP verb (POST, PUT, DELETE).      |
| `path`           | REST path (e.g., `/v1/flows/{id}`). |
| `payload`        | JSON body for the operation.        |
| `status`         | pending / syncing / done / failed.  |
| `createdAt`      | ISO timestamp.                      |
| `attempts`       | Retry count.                        |

> Queue items stored in AsyncStorage under key `flow:syncQueue`.

---

## 3️⃣ Caching & TTLs

* React Query caches fetched data with `staleTime` + `cacheTime`.
* Default TTLs:

  * Today’s flows: `staleTime=5min`, `cacheTime=24h`.
  * Historical flows: `staleTime=24h`, `cacheTime=48h`.
  * Leaderboards: `staleTime=10min`, `cacheTime=6h`.
* Cached data persists between sessions.

---

## 4️⃣ Conflict Resolution

* Server is authoritative.
* On 409 Conflict:

  * Client shows diff (local vs server).
  * User chooses merge or discard (if cheat mode allows).
* Automatic merge allowed for quantitative fields (take max or sum depending on metric).
* Binary/time-based flows: server state wins unless cheat mode enabled.

---

## 5️⃣ Cheat Mode & Sync

* When `cheatMode=false`, queued writes older than 24h should be dropped client-side.
* Server rejects backdated edits beyond lock window (403).
* All edits flagged `edited=true` in Firestore; audit log created.

---

## 6️⃣ Background Sync

* `syncService` runs on app launch, foreground resume, and periodic timer (15–30min).
* Displays small indicator (e.g., in SyncContext) for pending writes.
* Retries with exponential backoff (max 5 attempts).
* Hard failures logged to Sentry.

---

## 7️⃣ Testing & Observability

* Unit tests: queue enqueue/dequeue, retry logic.
* Integration: simulate offline, back online, ensure eventual consistency.
* Metrics: queue length, failed items, replay latency.

---

# STYLE\_RULES.md

## 🎨 Purpose

Style conventions for the **Flow** app ensure visual consistency and maintainable UI code. This document defines rules for colors, typography, spacing, and shared components.

---

## 1️⃣ Global Design Tokens

| Token      | Location               | Notes                                                                                  |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------- |
| Colors     | `styles/colors.js`     | Define primary, secondary, background, success, warning, error, grayscale shades.      |
| Typography | `styles/typography.js` | Export heading, subtitle, body, caption styles (fontFamily, weight, size, lineHeight). |
| Layout     | `styles/layout.js`     | Export spacing, borderRadius, shadows, device breakpoints.                             |
| Index      | `styles/index.js`      | Barrel file exporting tokens.                                                          |

> Never hardcode values in components; always import tokens.

---

## 2️⃣ Common Components

| Component     | File                               | Purpose                                                             |
| ------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `Button`      | `components/common/Button.js`      | Reusable primary/secondary buttons (props: variant, size, loading). |
| `Icon`        | `components/common/Icon.js`        | Central icon registry using vector-icons.                           |
| `Toast`       | `components/common/Toast.js`       | Lightweight notifications.                                          |
| `Card`        | `components/common/Card.js`        | Generic card wrapper with padding, border, elevation.               |
| `Modal`       | `components/common/Modal.js`       | Consistent modal styling.                                           |
| `ColorPicker` | `components/common/ColorPicker.js` | Mood color selector.                                                |

All common components:

* Support **theme** (light/dark).
* Accept `style` prop to extend base style.
* Have unit tests for rendering & props.

---

## 3️⃣ Screens & Layout

* Screens live in `src/screens/` grouped by domain.
* Use `SafeAreaView` and `ScrollView` when appropriate.
* Keep layout minimal; delegate heavy logic to services/hooks.
* Use reusable `Header`, `Footer`, `Divider` components where possible.

---

## 4️⃣ Naming Conventions

* Components: `PascalCase` (e.g., `FlowCard`).
* Style objects: `camelCase` (e.g., `buttonPrimary`).
* Export a single StyleSheet per component.
* For large style blocks, extract to `ComponentName.styles.js`.

---

## 5️⃣ Accessibility

* All touchables must have `accessibilityLabel`.
* Use semantic roles where available.
* Ensure sufficient color contrast.

---

## 6️⃣ Testing Styles

* Snapshot test major components (Button, Card).
* Test dark mode toggling.

> Following these style rules keeps Flow visually cohesive and makes new UI work predictable for AI tools and teammates.

---

# PROMPT\_GUIDE.md

## 🤖 Purpose

Prompts help developers and AI assistants (Cursor, Copilot) generate code that respects Flow’s architecture and style.

---

## 1️⃣ Prompt Files

| File                       | Use Case                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| `prompts/add-screen.md`    | Template for adding a new screen (UI + navigation).                    |
| `prompts/add-service.md`   | Guide for scaffolding a service (API + logic + tests).                 |
| `prompts/add-component.md` | How to create a reusable component with styles & tests.                |
| `prompts/add-hook.md`      | Steps for writing custom React hooks.                                  |
| `prompts/refactor.md`      | For large restructuring (e.g., moving state from Context to services). |
| `prompts/add-endpoint.md`  | Describe new API endpoint, update OpenAPI & service.                   |
| `prompts/add-flag.md`      | How to introduce a new feature flag safely.                            |
| `prompts/add-style.md`     | Add or modify shared styles/tokens.                                    |
| `prompts/sync-debug.md`    | Debug offline sync and cache policies.                                 |

> Store prompts in `/prompts` folder; keep short, focused, with examples.

---

## 2️⃣ Prompt Content Rules

* Start with **Context**: what the feature is, which files it touches.
* List **Constraints**: which services/hooks to use, style rules, sync rules.
* End with **Deliverables**: files to create or modify, tests, docs.

Example for `add-screen.md`:

```
# Goal
Create a new screen to display a list of Flow entries.

# Constraints
- Place in `src/screens/flows/FlowList.js`.
- Use `flowService.getFlows()` for data.
- Apply tokens from `styles/colors.js`.

# Deliverables
- Screen file.
- Unit test.
- Navigation entry in TabNavigator.
- Docs update in ARCHITECTURE.md.
```

---

## 3️⃣ Usage Best Practices

* Reference a prompt when instructing AI: “Follow `prompts/add-screen.md` to create a new ‘Mood Trends’ screen.”
* Keep prompts up to date when architecture evolves.
* Link prompts in `CONTRIBUTING.md` so new devs discover them.

> Well-maintained prompts reduce random file creation and keep Cursor’s output aligned with Flow’s structure and tone.
