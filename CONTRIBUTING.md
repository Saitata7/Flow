
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
