# Testing Strategy

## Principle

Money-related calculation logic must be tested before UI polish. The calculator is the trust center of the app.

## Test Layers

### Shared Package

Use Vitest for pure calculator tests.

Required bowling cases:

- Three-team 3/3/2 stack allocation.
- Two-team loser bears all stacks.
- Custom stack game.
- Team score normalization by average times largest team size.
- Tie detection and manual ranking requirement.
- Local rule solo burden override.
- Unlimited stack unit price calculation.
- Per-game stack unit price calculation.
- 10 KRW rounding and total recovery adjustment.

### API

Use NestJS default Jest tooling for API tests.

MVP integration targets:

- Kakao/mock auth session.
- Group creation.
- Temporary member creation.
- Invite-link member matching.
- Bowling session create/update/read.
- Public share token read-only result access.

### Web

Use Vitest + Testing Library for focused component behavior.

Use Playwright for one or two high-value flows:

- Group dashboard loads and starts bowling session.
- Bowling draft creation -> score input -> result preview.

## CI Later

CI is deferred until the first stable skeleton, but scripts should be CI-friendly from the beginning:

```bash
pnpm test
pnpm test:shared
pnpm test:api
pnpm test:web
pnpm e2e
```

