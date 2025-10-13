# Git Workflow

> Branching strategy, commit conventions, and release flow.

## Table of Contents
- [Branching Model](#branching-model)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Release Process](#release-process)
- [References](#references)

## Branching Model
- Trunk-based with short-lived feature branches: `feat/*`, `fix/*`, `chore/*`.
- Keep branches small and focused; rebase on main frequently.

## Commit Messages
- Use Conventional Commits:
  - `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
  - Optional scope: `feat(tickets): add SLA badge`

### Example
```bash
feat(tickets): add SLA breach badge
```

## Pull Requests
- Require at least one review.
- Include context, screenshots for UI changes, and test coverage where relevant.
- Ensure CI passes before merge.

## Release Process
- Tag releases from `main` (`vX.Y.Z`).
- Auto-generate changelog from Conventional Commits.
- Post-release: monitor metrics and error logs; prepare rollback if needed.

## References
- See also: [Coding Standards](./coding-standards.md)
- See also: [Deployment](./deployment.md)
