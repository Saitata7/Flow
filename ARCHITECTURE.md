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

## 🧭 Navigation Architecture

Flow uses **React Navigation v7** with a bottom tab navigator as the primary navigation pattern.

### Navigation Structure

```
TabNavigator (Bottom Tabs)
├── Home Tab
│   ├── HomePage (main dashboard)
│   ├── AddFlow (modal/stack)
│   ├── FlowDetails (stack)
│   └── EditFlow (stack)
├── Stats Tab
│   ├── StatsScreen (analytics dashboard)
│   └── FlowStatsDetail (stack)
├── Plans Tab
│   ├── PlansDashboard (plans overview)
│   ├── AddPlanFlow (stack)
│   ├── PlanDetail (stack)
│   └── PlanInstanceDetail (stack)
└── Settings Tab
    └── SettingsScreen (app preferences)
```

### Key Features

- **Theme Support**: Dynamic light/dark mode with `ThemeContext`
- **Accessibility**: Screen reader labels, 44pt minimum touch targets
- **Responsive**: Adapts to tablet/phone screen sizes
- **Haptic Feedback**: Light impact on tab press
- **Badge Support**: Notification badges on Plans tab
- **Safe Areas**: Proper handling of notches and home indicators

### Navigation Flow

1. **App Entry**: After authentication → `TabNavigator`
2. **Tab Persistence**: Last selected tab maintained on app restart
3. **Stack Navigation**: Each tab can have its own stack for detail screens
4. **Modal Presentation**: Add flows/plans presented as modals
5. **Deep Linking**: Support for direct navigation to specific screens

### Implementation Details

- **Tab Bar**: Custom styled with theme colors, shadows, and responsive sizing
- **Icons**: Vector-based Ionicons with focused/unfocused states
- **Labels**: Typography system integration with proper font scaling
- **Keyboard Handling**: Tab bar hides when keyboard is visible
- **Performance**: Lazy loading of screens, optimized re-renders

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

