
🌊 Flow – Mood & Positive Energy Tracker

Flow is a next-generation mobile app designed to help people track moods, emotions, and daily actions that build a positive “flow state.” Unlike a simple habit tracker, Flow focuses on emotional well-being, mindfulness, and energy balance. Users can record feelings, share uplifting flows, join supportive plans, and see analytics that guide them toward sustained happiness.

✨ Core Features

Flow Entries: Track mood, energy, gratitude, focus, or custom signals.

Plans & Challenges: Create personal rituals or public/group challenges to cultivate better flow.

Gamification: Cheat mode (strict vs flexible scoring), badges, streaks, gentle reminders.

Community: Share flows, motivate peers, follow trainers/coaches.

Offline First: Local queue, caching, background sync.

Export & Integrations: Export data or integrate with wellness/health apps.

🚀 Tech Stack

Frontend: React Native, React Navigation, React Query, TypeScript.

Backend: Firebase (Auth, Firestore, Cloud Functions), Redis (leaderboards/cache).

Infra: GitHub Actions CI/CD, Terraform (optional).

Testing: Jest, React Testing Library.

Observability: Sentry, custom metrics.

📂 Project Structure (Monorepo)

This is a **monorepo** containing the Flow application ecosystem:

```
flow/
├── apps/
│   ├── mobile/                 # React Native app (main product)
│   ├── web/                    # Web app for profiles/public pages
│   └── admin/                  # Admin dashboard
├── packages/
│   ├── api-sdk/                # Shared API client
│   ├── data-models/            # JSON schemas & TypeScript types
│   ├── feature-flags/          # Feature toggle registry
│   └── ui-kit/                 # Shared React Native components
├── services/
│   ├── api/                    # REST/GraphQL endpoints
│   ├── cache/                  # Redis helpers
│   ├── jobs/                   # Background workers
│   └── openapi/                # API specifications
├── infra/                      # Infrastructure as Code
├── docs/                       # Documentation
└── turbo.json                  # Turborepo configuration
```

See ARCHITECTURE.md for detailed architecture information.

🚀 Getting Started

### Prerequisites
- Node.js (v20.5.0 or later)
- Yarn package manager
- React Native development environment

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd Flow
yarn install

# Start the mobile app
yarn start
# or
yarn workspace @flow/mobile start
```

### Monorepo Commands
```bash
# Development
yarn dev          # Run all apps in dev mode
yarn build         # Build all packages and apps
yarn test          # Run tests across all packages
yarn lint          # Lint all packages
yarn clean         # Clean all build artifacts
```

📖 Documentation

CONTRIBUTING.md: Contributing rules.

ARCHITECTURE.md: Deep architecture & data rules.

docs/: API schemas, migrations, feature flags.

