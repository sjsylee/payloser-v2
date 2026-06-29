# Payloser Context

This file exists so future agents and collaborators can recover the product and technical context after a context reset.

## Product Thesis

Payloser records friend-group games where costs or chores are assigned by local rules. The MVP should feel fast enough to use in a bowling alley and trustworthy enough to settle real money.

## Core Concepts

- Group: top-level unit for members, sessions, rules, and statistics.
- User: Kakao-authenticated account.
- Group member: participant in a group. Can be linked to a user or remain temporary.
- Session: one activity instance, such as a bowling night or screen baseball game.
- Expense item: a cost paid by one representative payer and allocated to members by rules.
- Burden amount: the rule-based amount a member must pay.
- General participation cost: equal personal cost, excluded from main loser ranking.
- Betting burden: rule-based cost caused by losing, included in main ranking.
- Public share token: read-only result link for group chat sharing.

## MVP Decisions

- Top-level domain is a friend group.
- Temporary members are allowed.
- Invite links create group join requests. Group owners approve by linking the requester to a temporary member or creating a new member.
- Group roles are `OWNER` and `MEMBER`.
- Sessions can be edited after saving. MVP stores `updatedAt` and `updatedBy`; detailed audit logs are later.
- Main ranking is cumulative burden amount, not net profit/loss.
- General participation costs are excluded from the main ranking but included in payer recovery calculations.
- Each expense item has exactly one representative payer in the MVP.
- Shared result pages are token-based read-only public links.
- KakaoTalk direct message API is deferred. MVP sharing uses KakaoTalk Share, text copy, and link sharing.

## Bowling Rules

Bowling uses a stack-based internal model.

- Unlimited mode: stack unit price is derived from `total cost / total stacks`.
- Per-game mode: stack unit price is known upfront, usually equal to per-person game cost.
- Normal team game stack total usually equals participating member count.
- Team score is `team average score * largest team size`.
- Ties are detected and resolved by manual rank confirmation.
- With 3 teams, first place pays 0 stack, second place pays 1 stack per member, last place pays each own 1 stack plus first-place team's stacks split among last-place members.
- With 2 teams, the losing team bears the whole stack total.
- Teams and participants can change each game.
- Draft bowling sessions should be locally autosaved.
- Custom stack games are supported for cases like final individual games.
- Local rule presets are group-level, selected during settlement, and recorded with before/after allocation rationale.

## Rock-Paper-Scissors MVP

RPS is a fun side feature, not a cost settlement domain in the MVP.

- Record context, participants, loser, loser hand, memo, and date.
- Do not require every participant's hand.
- Track loser counts and loser-hand distributions.

## Technical Direction

- Monorepo: pnpm workspace + Turborepo.
- Web: Next.js TypeScript, Zustand, Tailwind CSS, shadcn/ui, Radix UI, lucide-react.
- Motion: Framer Motion for UI transitions, Lottie for rare celebratory or punishment moments.
- API: NestJS TypeScript.
- DB: PostgreSQL via Prisma.
- Shared package: Zod schemas, shared request/response contracts, pure calculators.
- Auth: Kakao OAuth plus development-only mock login. Web sessions use HTTP-only signed cookie.

## Portfolio Harness

Portfolio-oriented rationale is tracked while the product is being built:

- `docs/portfolio/decision-rationale.md`: technical, product, domain, and UX decision rationale.
- `docs/portfolio/case-study-notes.md`: raw material for a future public case study.
- `docs/portfolio/optimization-and-security-backlog.md`: production-hardening, optimization, privacy, and security follow-ups.

## Next Implementation Slice

1. Install workspace dependencies.
2. Implement `packages/shared` bowling calculator with Vitest tests first.
3. Scaffold Prisma schema for groups, members, sessions, expense items, allocations, and RPS records.
4. Implement auth shell and group CRUD.
5. Build mobile-first group dashboard and bowling draft flow.
