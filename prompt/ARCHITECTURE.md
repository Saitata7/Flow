## 🏛️ Flow Architecture Overview

Flow is designed as a **mobile-first, offline-first SaaS** for emotional tracking and community sharing.

### Layers

1. **UI Layer** – `components/`, `screens/`

   * Pure presentation; data via hooks.
2. **Hooks/State** – `hooks/`, `context/`

   * Local state, cache, subscriptions.
3. **Business Logic** – `services/`

   * Mood scoring, cheat mode, sync, analytics.
4. **Backend Enforcement** – `backend/cloudFunctions/`

   * Cheat mode validation, audit logs, leaderboard computation.

---

## 📊 Data Models (simplified)

### Flow Entry

```json
{
  "id": "uuid",
  "date": "2025-09-12",
  "mood": "calm",
  "energy": 7,
  "notes": "Morning walk helped",
  "tags": ["gratitude", "nature"],
  "edited": false,
  "createdAt": "ISO",
  "updatedAt": "ISO",
  "schemaVersion": 2
}
```

### Plan / Ritual

```json
{
  "id": "plan123",
  "title": "Morning Mindfulness",
  "type": "Public", // Public | Private | Group
  "ownerId": "user123",
  "participants": ["user123"],
  "visibility": "public",
  "category": "Mindfulness",
  "schemaVersion": 2
}
```

---

## 🔒 Cheat Mode & Scoring

* **CheatMode OFF**: entries locked after 24h.
* **CheatMode ON**: user can adjust past entries, flagged as `edited`.
* **Scores**: two sets – strict (for leaderboards), flexible (personal).
* Server validates cheat mode on write; audit logs track edits.

---

## 🔁 Offline & Sync Strategy

* React Query + AsyncStorage for cached reads.
* `syncService` handles queued writes with idempotency keys.
* TTL: 24h for flows, 48h for historical reads.
* Conflict resolution: server authoritative; client merges or prompts.

---

## 📈 Analytics & Stats

* Materialized stats in `/flowStats` (strict & flexible).
* Redis caches leaderboards.
* Cloud Functions recompute aggregates on entry write.

---

## 🔐 Security & Privacy

* Firestore rules enforce ownership.
* Only backend can flip `edited` false → true.
* Data flagged with schema version.
* Optional HIPAA/SOC2 if scaling to healthcare.

---

## 🚀 Deployment & CI/CD

* GitHub Actions: lint, test, build.
* Feature flags for new screens (Snaps, AI coach).
* Release tags (`v2.0.0`) follow semver.

---

