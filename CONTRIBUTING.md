
# CONTRIBUTING.md

## 👩‍💻 Contributing Guidelines

We welcome contributions! This project is structured for long-term maintainability and scale.

### Branching Strategy

* `main`: Production-ready code.
* `develop`: Ongoing development.
* Feature branches: `feature/<name>`
* Hotfix branches: `hotfix/<name>`

### Code Standards

* Follow ESLint & Prettier rules.
* Type safety encouraged (gradual TypeScript adoption).
* Business logic must live in `services/`, **not** in Context or UI.

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

* `feat:` – new feature
* `fix:` – bug fix
* `docs:` – documentation
* `refactor:` – restructuring without changing behavior
* `test:` – test related changes

### Testing Requirements

* Unit tests required for all services.
* Integration tests for sync & offline flows.
* Add new schemas under `types/` if new models are introduced.

### PR Checklist

* [ ] Code follows style guide
* [ ] Tests added/updated
* [ ] Docs updated (README/ARCHITECTURE)
* [ ] All CI checks pass

---



👩‍💻 Contributing Guidelines – Flow App

Thanks for helping build Flow, a platform for emotional well-being.

Branching & Releases

main – production

develop – integration branch

feature/<name> – new features

hotfix/<name> – urgent fixes

Code Standards

Follow ESLint & Prettier (configured).

Use functional React + hooks.

Keep business logic in services/, not UI.

New domain models must be added to /types and DATA_MODELS.md.

Commits & PRs

Conventional Commits style.

Include tests for logic & services.

Update documentation (README, ARCHITECTURE) if you change design.

All PRs must pass CI (lint, typecheck, tests).

Testing Strategy

Unit tests for services and hooks.

Integration tests for offline queue & cheat mode.

Snapshot tests for key UI components.

Contribution Values

Respect privacy & data sensitivity.

Uphold positive UX: language, colors, and notifications must be mindful.

Discuss large architectural shifts before PR.