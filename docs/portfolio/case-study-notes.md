# Payloser Case Study Notes

## One-line Summary

Payloser is a mobile-first settlement app for friend-group games where messy local rules, temporary members, and Kakao sharing are handled as first-class product constraints.

## Problem Frame

Friend groups often settle costs through chat after bowling or similar activities. The hard part is not just recording a receipt. The hard part is:

- teams change every game
- local rules are negotiated offline
- one person usually pays first
- some friends have not joined the app yet
- results must be easy to share in KakaoTalk
- everyone must trust why they owe that amount

## Product Differentiator

The app treats "local rule settlement" as the core product, not an afterthought. The bowling stack model, temporary member claiming, and chat-first sharing all come from the real behavior of the group.

## Technical Differentiator

- Monorepo with shared TypeScript contracts keeps web previews and API persistence aligned.
- Pure calculators isolate domain complexity from UI state.
- Kakao OAuth is used for identity, while KakaoTalk Share is used for actual social distribution.
- PostgreSQL/Prisma persistence supports long-term cumulative statistics and historical records.
- Mobile-first UI favors step-by-step entry over a single dense form.

## Strong Portfolio Angles

### Domain Modeling

Payloser models stack allocation before money allocation. This mirrors the group's language and keeps calculations explainable.

### Identity Linking

Temporary members allow settlements before everyone signs up. Kakao users later claim those temporary records without losing history.

### Product/API Boundary

The product avoids relying on Kakao Friends API for MVP because it does not match the actual "post to group chat" behavior and carries permission friction.

### UX Iteration

The UI moved from a single-page form to a step-based mobile app flow because real entry during a bowling session needs fast repeated game input, participant selection, and review.

### Trust

The app prioritizes calculation previews, result sharing, and future public explanation links because money settlement requires more than a final number.

## Metrics To Capture Later

- Time to enter a full bowling session.
- Number of taps to add a game and assign teams.
- Error rate for member claiming.
- Percentage of shared links opened by non-logged-in users.
- Percentage of temporary members later claimed.
- Calculator test coverage and edge-case count.

## Screenshots To Capture Later

- Login/onboarding screen.
- Lobby and group selection.
- Group management with invite and member states.
- Bowling setup flow.
- Game/team assignment flow.
- Result page sorted by payer burden.
- Public result link.
- Invite claim page.

## Story Spine For Future Write-up

1. Real problem: friend groups use local rules that spreadsheets and generic split apps do not model well.
2. Domain insight: stacks are the unit of fairness, money is only the final projection.
3. Product constraint: friends may not all be users yet, so identity must be linkable later.
4. Platform constraint: Kakao is the sharing surface, but not a free social graph database.
5. Engineering response: shared calculators, token links, temporary member claiming, and mobile-first entry.
6. Result: a service-shaped MVP that can evolve into long-term group statistics.
