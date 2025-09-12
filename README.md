# README.md

## 📱 Habit Tracker + Social Plans App

This project is a scalable **habit tracker** combined with **social plan sharing** features. Users can track personal habits, join group challenges, and follow trainer-defined plans. The system supports offline-first usage, gamification (via cheat mode & leaderboards), and long-term enterprise API integration (healthcare, corporate wellness, education).

### ✨ Core Features

* **Habit Tracking**: Binary, Quantitative, and Time-based tracking modes.
* **Plans**: Personal, public, and trainer-led group plans.
* **Gamification**: Cheat mode toggle, strict vs flexible scoring, leaderboards.
* **Profile Sharing**: Public pages for showcasing progress & activity.
* **Offline Support**: Local queue, cache, and background sync.
* **Export & Integration**: Export plans, sync with enterprise systems.

### 🚀 Tech Stack

* **Frontend**: React Native + React Navigation + React Query.
* **Backend**: Firebase (Auth, Firestore, Cloud Functions), Redis (leaderboards/cache).
* **Infra**: Terraform / IaC for cloud infra, GitHub Actions for CI/CD.
* **Testing**: Jest + React Testing Library.
* **Observability**: Sentry (error tracking), custom metrics (sync queue health).

### 📂 Project Structure (v2)

See `ARCHITECTURE.md` for details.

### 📖 Documentation

* `CONTRIBUTING.md`: How to contribute.
* `ARCHITECTURE.md`: High-level design, rules, and API contracts.
* `docs/`: API usage, schema definitions, migrations.
* `openapi/`: Swagger/OpenAPI definitions for APIs.

---
