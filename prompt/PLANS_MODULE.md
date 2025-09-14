### `docs/PLANS_MODULE.md`

```markdown
# 🌊 Flow – Plans Module

> **Purpose**  
> The **Plans** module lets users design, join, and track *rituals* or *challenges* that improve their flow.  
> Supports personal rituals, group programs, public links, favourites, and trainer dashboards.

---

## 1️⃣ High-Level Concept

| Feature | Description |
|---------|-------------|
| **Dashboard** | Entry point showing: personal rituals, joined challenges, favourite plans, trainer invites. |
| **Personal** | User’s own rituals: <br>• **Private** – visible only to user. <br>• **Public** – shareable URL, others can view/join. |
| **Everyone** | Global explore feed of public rituals/challenges (search + filters). |
| **Favourites** | User-saved plans for quick access. |
| **Group / Trainer Programs** | Owner manages multiple participants, can customise steps, view progress matrix. |
| **Permissions** | `owner`, `participant`, `viewer`, `trainer`. |
| **Analytics** | Strict vs flexible score, streaks, leaderboard, engagement rate. |
| **Sharing** | Short public URL + QR code. |

> **Future options**: categories (fitness, mindfulness, study), tags, ratings, comments, AI suggestions.

---

## 2️⃣ Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| UI | React Native + React Navigation (Tabs + Stack) | PlansTab → nested stacks |
| State | React Query for data fetch + cache <br>Context (light) for selectedPlan | |
| Business Logic | `planService` (Firestore CRUD, join/leave, analytics) | |
| Backend | Firestore + Cloud Functions for heavy ops (leaderboards, audit, permissions) | |
| Cache | Redis (optional) for leaderboards/explore feed | |
| AuthZ | Firebase Auth roles (`owner`, `trainer`) | |
| Tests | Jest (unit), react-native-testing-library (UI), integration for sync & leaderboards | |

---

## 3️⃣ File & Folder Structure

```

src/
└── screens/
└── plans/
├── PlansDashboard.js        # Main entry, tabs: Personal | Everyone | Favourites
├── PersonalPlans.js         # List & manage user's plans
├── EveryonePlans.js         # Explore public plans
├── FavouritePlans.js        # Saved plans
├── PlanDetail.js            # View steps, participants, analytics
├── PlanCreate.js            # Wizard to create ritual/challenge
├── PlanEdit.js              # Edit metadata/steps
├── GroupPlanMatrix.js       # Trainer view: participants progress
└── PlanShareModal.js        # Generate link/QR, set visibility

```

**Support files**

```

src/
├── services/
│   └── planService.js        # CRUD, join/leave, stats, share link
├── hooks/
│   └── usePlans.js           # wraps planService with react-query
├── context/
│   └── PlanContext.js        # selectedPlanId, UI-only
├── components/plans/
│   ├── PlanCard.js           # summary card
│   ├── PlanList.js           # list renderer
│   ├── PlanProgress.js       # progress bar, streaks
│   ├── Leaderboard.js        # strict/flexible boards
│   └── ParticipantAvatar.js  # small avatars

```

Docs:

```

docs/
└── PLANS\_MODULE.md           # (this file)

```

Tests:

```

tests/
├── unit/planService.test.js
└── integration/plansFlow\.test.js

````

---

## 4️⃣ UX Flow

1. **Open Plans menu** → `PlansDashboard` loads.
2. Tabs:
   - **Personal** → shows user’s rituals (public/private).
   - **Everyone** → fetch public plans (paginate/search).
   - **Favourites** → pinned items.
3. Tap a plan → `PlanDetail`.
4. Owner actions: edit, share, view analytics, manage participants.
5. Participant actions: join/leave, mark progress, view leaderboard.
6. Trainer mode: `GroupPlanMatrix` (view/edit participant progress).

---

---

## 6️⃣ Sync & Caching

* List & detail cached via React Query (`staleTime=5m`, `cacheTime=1d`).
* Mutations queued with `syncService` → replay offline changes (create, edit, join).
* Leaderboards cached in Redis (TTL 1–6h).

---

## 7️⃣ Validation & Bug-proofing

* Validate: title (1–80 chars), description, category, steps array (not empty).
* Permission checks: only owner/trainer may edit or invite.
* Use optimistic updates only if safe (create, join).
* Add Sentry logging for failed joins or sync errors.

---

## 8️⃣ Responsive & Accessibility

* Use Flexbox + `%` width; test on: iPhone SE, 14 Pro Max, iPad, Pixel 5, Galaxy Tab.
* Dynamic font scaling supported.
* Buttons/touchables min size 44x44.
* Provide alt text for avatars.

---

## 9️⃣ Feature Flags

| Flag                   | Purpose                 |
| ---------------------- | ----------------------- |
| `enablePlans`          | Global toggle           |
| `enablePlanSharing`    | Allow public links & QR |
| `enableTrainerMode`    | Enable group dashboard  |
| `enableLeaderboards`   | Show ranking            |
| `enablePlanFavourites` | Save/pin plans          |

---

## 🔟 Testing Matrix

| Area             | Tests                               |
| ---------------- | ----------------------------------- |
| Service          | CRUD, join/leave, share link, stats |
| Screens          | Dashboard nav, create/edit flows    |
| Sync             | offline create/join, retry          |
| Leaderboards     | strict vs flexible                  |
| Permissions      | public/private, trainer lock        |
| Responsive       | snapshots across devices            |
| Input validation | boundary & error cases              |

---
