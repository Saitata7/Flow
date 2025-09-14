### `/prompts/add-plan-screen.md`

```markdown
# Goal
Scaffold a new **Plans screen** inside `src/screens/plans/`.

## Context
- The Plans module lets users create, join, and track rituals/challenges.
- Screens live in `src/screens/plans/`.
- Services: `planService`, `statsService`.
- Use hooks: `usePlans` for data, `useAuth` for user info.
- Follow tokens in `styles/colors.js`, `styles/typography.js`.

## Constraints
- Must support offline-first (sync queue).
- Respect feature flags (`enablePlans`, `enableTrainerMode`).
- Use `SafeAreaView`, `ScrollView` for layout.
- Accessibility: labels on all touchables.

## Deliverables
- Screen file in `src/screens/plans/`.
- Add route to `PlansNavigator`.
- Unit test in `tests/unit`.
- Update `PLANS_MODULE.md` if introducing new behaviour.
```

---

### `/prompts/add-plan-service.md`

```markdown
# Goal
Create or update `planService.js` to support new CRUD or analytics endpoints.

## Context
- `planService` wraps Firestore/Redis for plans & rituals.
- Follows schemas in `DATA_MODELS.md` (Plan object).
- Sync rules: see `SYNC_RULES.md`.

## Constraints
- Use async/await with try/catch.
- Idempotent writes; include `idempotencyKey` where required.
- Must expose typed results (TS) or JSDoc.

## Deliverables
- Functions in `src/services/planService.js`.
- Add tests in `tests/unit/planService.test.js`.
- If endpoint is new, update `API_GUIDE.md` & `openapi/v1.yaml`.
```

---

### `/prompts/add-plan-component.md`

```markdown
# Goal
Build a reusable component for the Plans module.

## Context
- Components go under `src/components/plans/`.
- Example: `PlanCard`, `Leaderboard`, `ParticipantAvatar`.
- Styles from `styles/*`.

## Constraints
- Keep presentational (no network calls).
- Accept props, validate via propTypes or TS interfaces.
- Responsive (mobile/tablet).

## Deliverables
- Component file + styles.
- Snapshot test.
```

---

### `/prompts/add-plan-hook.md`

```markdown
# Goal
Create a hook to fetch or manage plan data.

## Context
- Use React Query for caching.
- Place in `src/hooks/usePlans.js` or `src/hooks/usePlanDetail.js`.

## Constraints
- Integrate with `planService`.
- Provide loading/error state.
- Support offline mode.

## Deliverables
- Hook file.
- Unit tests.
```

---

### `/prompts/debug-plan-sync.md`

```markdown
# Goal
Debug an issue with syncing Plans.

## Context
- Sync rules in `SYNC_RULES.md`.
- Offline edits queue → replay when online.
- Conflicts: server wins unless cheatMode enabled.

## Steps
1. Reproduce bug.
2. Inspect queue & retry logic.
3. Confirm schema & timestamp logic.
4. Write failing test.
5. Fix in `syncService` or `planService`.
```

---

### `/prompts/add-plan-flag.md`

```markdown
# Goal
Add a new feature flag for the Plans module.

## Context
- Flags live in `config/constants.js`.
- Document in `FEATURE_FLAGS.md`.
- Use `useFeatureFlag()` in components.

## Deliverables
- Add flag constant.
- Update docs.
- Conditional rendering in UI.
- Tests for flag on/off states.
```

---

### `/prompts/refactor-plans.md`

```markdown
# Goal
Refactor code in the Plans module to improve clarity or reuse.

## Context
- Follow `PLANS_MODULE.md` for architecture.
- Maintain test coverage.
- Avoid random files — only in `src/screens/plans/`, `src/components/plans/`, `services/`.

## Deliverables
- Updated files.
- Migration notes if API changed.
```

---
