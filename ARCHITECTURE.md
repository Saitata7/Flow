
# ARCHITECTURE.md

## 🏛️ High-Level Architecture

The app follows an **offline-first, service-oriented architecture** with clear separation of concerns:

### Layers

1. **UI Layer** – `components/` + `screens/`

   * Stateless UI, consumes data via hooks & contexts.

2. **State & Hooks** – `hooks/` + `context/`

   * Handles local state, caching, subscriptions.
   * UI-only concerns, minimal business logic.

3. **Business Logic Services** – `services/`

   * Implements domain logic (habit scoring, cheat mode rules, sync queue).
   * Handles communication with Firebase/Redis.

4. **Backend Enforcement** – `backend/cloudFunctions/`

   * Enforces cheat mode, ownership, audit logs, and stats materialization.

---

## 📊 Data Models

### Habit

```json
{
  "id": "uuid",
  "title": "Drink Water",
  "description": "Stay hydrated",
  "trackingType": "Quantitative", // Binary | Quantitative | Time-based
  "frequency": "Daily",
  "everyDay": true,
  "daysOfWeek": ["Mon","Wed","Fri"],
  "reminderTime": "2025-07-16T08:00:00Z",
  "reminderLevel": "1",
  "cheatMode": false,
  "createdAt": "ISO",
  "updatedAt": "ISO",
  "ownerId": "user123",
  "schemaVersion": 2
}
```

### Habit Entry (per day)

```json
{
  "date": "2025-07-16",
  "symbol": "+", // ✓ | ✗ | +
  "emotion": "happy",
  "note": "Finished a chapter",
  "quantitative": { "unitText": "glasses", "count": 3 },
  "timebased": { "totalDuration": 1800 },
  "edited": true,
  "editedBy": "user123",
  "editedAt": "ISO",
  "createdAt": "ISO",
  "timestamp": "ISO"
}
```

### Plan

```json
{
  "id": "plan123",
  "title": "100 Pushups Challenge",
  "type": "Public", // Public | Private | Group
  "category": "Fitness",
  "ownerId": "user123",
  "participants": ["user123", "user456"],
  "visibility": "public",
  "schemaVersion": 2
}
```

---

## 🔒 Cheat Mode Rules

* **OFF**: Cannot edit past days (server enforces, rejects writes).
* **ON**: Can edit past days, but entries are flagged as `edited=true`.
* **Scoring**: Two leaderboards – strict (ignores edited), flexible (includes edited).
* **Audit Log**: Every edit creates an audit record.

---

## 🔁 Offline & Sync Rules

* Local writes are queued with `idempotencyKey`.
* Background service replays queue when online.
* Firestore is source of truth, Redis caches leaderboards.
* TTLs: 24–48h for caches.
* Conflict resolution: Server wins, client shows diff.

---

## 📈 Stats Materialization

* Cloud Functions update `/habitStats/{habitId}` on entry writes.
* Redis caches leaderboards for group plans.
* Separate `strict` vs `flexible` stats.

---

## 🔐 Security

* Firestore rules enforce ownership.
* Cheat mode lock enforced server-side.
* Audit logs are immutable.
* JWT + Idempotency keys for API calls.

---

## 📦 Deployment & CI/CD

* GitHub Actions CI: lint + test + typecheck.
* Staging & production Firebase projects.
* Feature flags for gradual rollout.

---

## 📅 Version Roadmap

* **v1**: Core habit tracker (done)
* **v2**: Plans (personal, public, group), profile share page, export.
* **v3**: Leaderboards, trainer dashboards, redis cache.
* **v4**: Social feed + motivational snaps.
* **v5**: AI-assisted habit recommendations.
* **v6**: Enterprise APIs (healthcare, HR wellness).
* **v7+**: Advanced gamification, marketplace for trainers, monetization.
