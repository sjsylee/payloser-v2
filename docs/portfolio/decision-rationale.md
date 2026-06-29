# Decision Rationale Log

## Use Group Members Instead Of App-wide Friends For MVP

Date: 2026-06-29
Status: Accepted

### Problem

Payloser needs real users, but the product's real relationship model is not "all Kakao friends." It is "people who settle costs inside the same friend group." Pulling Kakao friends early would add permission friction and still would not expose arbitrary Kakao group chat membership.

### Decision

Use `GroupMember` as the MVP relationship model. A member can be temporary or linked to a Kakao-authenticated `User`.

### Rationale

Friend groups often have legacy names and members who have not joined the app yet. Temporary members let a group record settlements immediately, while account linking lets those members later claim their history without data migration.

### Trade-offs

- There is no global Payloser friend list in the MVP.
- A user may appear in multiple groups through separate `GroupMember` records.
- Duplicate identity resolution across groups is deferred.

### Portfolio Signal

This demonstrates a domain-first identity model: the app avoids copying a social-network abstraction and instead models the relationship that actually matters for settlement.

### Follow-up

- Add owner-only unlink and inactive-member management.
- Later consider a `Contact` or cross-group identity layer after repeated real usage proves the need.

## Invite Flow Uses Temporary Member Claiming

Date: 2026-06-29
Status: Superseded by owner-approved join requests

### Problem

Friends may be recorded in settlements before they create accounts. If signup creates brand-new members, old records and future profiles split apart.

### Decision

Group owners can create temporary members. Invitees enter through an invite link, log in with Kakao, and select their existing temporary member card to claim it.

### Rationale

This preserves legacy records, avoids blocking settlement entry, and handles Kakao nickname differences. The app becomes useful before every friend has installed or joined.

### Trade-offs

- A user can select the wrong member.
- MVP does not require owner approval for every claim.

### Portfolio Signal

This is a practical identity-linking design for messy offline social data. It favors low-friction adoption while keeping a recovery path.

### Follow-up

- Add owner unlink.
- Add inactive member state instead of destructive deletion.
- Consider optional owner approval if public invite abuse becomes a real risk.

## Invite Flow Uses Owner-approved Join Requests

Date: 2026-06-29
Status: Accepted

### Problem

Letting invitees directly choose a temporary member creates an easy mistake or prank path: a user can accidentally or intentionally claim someone else's name.

### Decision

Make invite links group-level. Invitees create a `GroupJoinRequest`; the group owner approves by either linking the requester to an active unlinked temporary member or creating a new member.

### Rationale

This keeps the invite URL simple and consistent for both group chat and one-to-one sharing, while moving identity matching to the person with group context. It protects legacy records and avoids exposing member lists to unapproved users.

### Trade-offs

- Signup now has one more step because the owner must approve.
- The owner needs a clear request management UI.
- Pending users only see a waiting state until approval.

### Portfolio Signal

This demonstrates product security judgment: the flow was changed after identifying a realistic abuse/mistake case, while preserving the low-friction Kakao share entry point.

### Follow-up

- Add request cancellation and rejected-state messaging.
- Add owner notifications for pending requests.
- Add member unlink/deactivate flows for recovery.

## Defer Kakao Friends API And Direct Messages

Date: 2026-06-29
Status: Accepted

### Problem

The desired UX sounds like "pick friends from Kakao," but Kakao APIs do not provide arbitrary group chat member lists to a normal web app. Friends list and direct message APIs require additional permissions, user consent, review, and quota handling.

### Decision

MVP uses Kakao Login for identity and KakaoTalk Share for invite/result sharing. Friends API and direct message sending are deferred.

### Rationale

KakaoTalk Share matches the real behavior: users mostly post links into group chats. It also avoids building a fragile contact picker that may not show the people users expect.

### Trade-offs

- The app cannot directly send one-to-one messages to selected Kakao friends in MVP.
- The invite path depends on users sharing links into the right chat.

### Portfolio Signal

This shows API-boundary judgment: the product uses the platform capability that maps cleanly to the user behavior and avoids overpromising on restricted social graph access.

### Follow-up

- Revisit Friends API only after invite-link adoption friction is observed.
- Document permission and quota implications before requesting Kakao review.

## Public Read-only Result Links

Date: 2026-06-29
Status: Accepted

### Problem

Settlement results are shared in chat. If every viewer must log in before seeing any result, the share experience becomes slow and annoying.

### Decision

Use token-based public read-only result links. Non-logged-in users can see summary/payment information. Login is required for member claiming, group participation, cumulative stats, editing, and management.

### Rationale

The payment list is already intended for group chat sharing, so the first view should be lightweight. Sensitive actions remain authenticated.

### Trade-offs

- Anyone with the token can view the read-only result.
- Revocation and expiry need to be implemented before a broader public release.

### Portfolio Signal

This balances usability and privacy by separating read-only verification from authenticated ownership and management.

### Follow-up

- Add share link revocation.
- Add noindex metadata.
- Consider expiry controls for public links.

## Stack-based Bowling Calculator

Date: 2026-06-29
Status: Accepted

### Problem

The bowling payment rule is not a simple split. Unlimited bowling derives a stack unit price from total cost and total generated stacks. Team sizes change, ranks change per game, individual games have custom stacks, and local rules can redirect burdens.

### Decision

Model bowling costs as stack allocations first, then convert stacks to money. Keep calculators pure and shared between web preview and API persistence.

### Rationale

Stacks are the language used by the group and the smallest explainable unit of the rule. This keeps previews transparent and makes local-rule overrides auditable.

### Trade-offs

- The input UI must explain stacks well enough for non-technical users.
- Rounding must be handled carefully so the payer recovers the exact paid amount.

### Portfolio Signal

This demonstrates domain modeling and calculation design under real local rules, including fairness, explainability, and rounding correctness.

### Follow-up

- Add public calculation explanation pages.
- Expand tests around local-rule overrides and rounding edge cases.
- Track calculator performance if sessions become very large.

## Shared TypeScript Contracts And Pure Domain Logic

Date: 2026-06-29
Status: Accepted

### Problem

The web app needs instant previews, while the API must be authoritative. Duplicating calculation or validation logic would create drift.

### Decision

Use a pnpm monorepo with shared TypeScript/Zod contracts and pure calculators.

### Rationale

The same domain rules can be tested once and reused in browser previews and server-side persistence. Prisma models stay behind the API boundary.

### Trade-offs

- Shared package boundaries must stay disciplined.
- Mapping between database records and contracts is explicit work.

### Portfolio Signal

This shows maintainability judgment: complex domain behavior is isolated from UI and infrastructure, making it testable and reusable.

### Follow-up

- Keep shared package focused on schemas, types, and pure logic.
- Add contract tests for public share and invite flows.
