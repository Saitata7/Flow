# Flow – Data Models

> Central source for all JSON Schemas & TypeScript types (stored in `packages/data-models`)

---

## 1️⃣ Overview
| Entity | Purpose |
|--------|---------|
| `Flow` | Defines a single trackable activity (habit, mood, workout, etc.). |
| `FlowEntry` | Daily record or event for a Flow. |
| `Plan` | Collection of flows or challenges (public/private/group). |
| `UserProfile` | Public-facing user info + social links. |
| `UserSettings` | Preferences, notifications, privacy, integrations. |

All documents include:
- `id`
- `createdAt`
- `updatedAt`
- `schemaVersion`

Optional fields:
- `deletedAt` (soft delete)
- `archived` (hide but keep history)
- `tags` (array of strings)

---

## 2️⃣ Flow
- `id`, `title`, `description`
- `trackingType`: `Binary` | `Quantitative` | `Time-based`
- `goal` (optional for quant/time)
- `frequency`: `Daily` | `Weekly` | `Monthly`
- `everyDay`, `daysOfWeek`
- `reminderTime`, `reminderLevel`
- `cheatMode`: boolean
- `planId`: optional
- `tags`: string[]
- `archived`: boolean

---

## 3️⃣ FlowEntry
- `date`, `symbol` (✓, ✗, +)
- `emotion`, `note`
- `quantitative`: { unitText, count }
- `timebased`: { totalDuration, segments? }
- `streakCount`
- `device`, `geo`
- `edited`, `editedBy`, `editedAt`
- `moodScore`: number (1–5)

---

## 4️⃣ Plan
- `id`, `title`, `category`
- `planKind`: `Challenge` | `Template` | `CoachPlan`
- `type`: `Public` | `Private` | `Group`
- `visibility`: `public` | `private` | `group`
- `participants`: string[]
- `startDate`, `endDate`
- `status`: `draft` | `active` | `archived`
- `rules`: { frequency, scoring, cheatModePolicy }
- `tags`: string[]

---

## 5️⃣ UserProfile
- `id`, `username`, `displayName`, `avatarUrl`
- `bio`, `stats`, `achievements`, `badges`
- `links`: [{ platform, url }]
- `profileTheme`: { color, banner }
- `visibility`: { bio, stats, plans }

---

## 6️⃣ UserSettings
- `uiPreferences`: theme, accentColor, textSize, highContrast
- `habitDefaults`: type, goalFrequency, repeatTimesPerWeek
- `reminders`: dailyReminders, quietHours, etc.
- `privacy`: profileVisibility, allowFriendRequests
- `integrations`: wearables, externalApps
- `backupFrequency`, `dataRetention`, `exportFormat`
- `cheatMode`: boolean (global flag)

---

## 7️⃣ Versioning
- Each schema has `schemaVersion`.
- Breaking changes require migration steps in `MIGRATIONS.md`.

---

## 8️⃣ Relationships
| From | To | Relation |
|------|----|----------|
| `Plan` → `Flow` | one-to-many |
| `Flow` → `FlowEntry` | one-to-many |
| `UserProfile` → `Plan` | owner/participant |
| `UserSettings` → `UserProfile` | 1:1 |

---

## 9️⃣ Validation
- All incoming/outgoing payloads validated with AJV.
- Shared types generated via `ts-json-schema-generator`.

---

> Keep schemas **small & composable**; avoid optional fields explosion by nesting configs (`rules`, `settings`).
