# Commit Convention

This repository follows Conventional Commits, the common format used by many
open-source projects and release automation tools.

## Format

```text
<type>[optional scope][optional !]: <description>
```

Examples:

```text
feat: add settlement history
fix(api): validate join request owner
docs: document deploy checklist
chore!: remove legacy local storage migration
```

## Types

- `feat`: user-facing feature
- `fix`: bug fix
- `docs`: documentation only
- `style`: formatting or visual-only code style
- `refactor`: code change that is not a fix or feature
- `perf`: performance improvement
- `test`: tests only
- `build`: build system or dependency changes
- `ci`: CI configuration
- `chore`: maintenance
- `revert`: revert a previous change

## Pull Requests

Use the PR template and keep each PR focused on one logical change. Include a
short summary, verification steps, screenshots for UI changes, and deployment
notes when the change affects runtime configuration.

## Local Enforcement

Enable the versioned git hook once per clone:

```bash
git config core.hooksPath .githooks
```

The hook validates the first line of each commit message.
