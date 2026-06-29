# Portfolio Harness

This directory captures Payloser decisions in a portfolio-ready form.

The goal is not to write a polished case study too early. The goal is to keep a reliable trail of product, architecture, domain logic, UX, testing, performance, and security decisions while the product is still being built.

## How To Use

When a decision is made, update one of these files:

- `decision-rationale.md`: why a technical, product, or domain decision was made.
- `case-study-notes.md`: portfolio narrative material that can later become a public write-up.
- `troubleshooting-harness.md`: reusable structure for portfolio-ready problem-solving notes.
- `optimization-and-security-backlog.md`: performance, security, privacy, and release-hardening items to revisit before portfolio/public release.

## Entry Format

Use this structure for new rationale entries:

```md
## Decision Title

Date: YYYY-MM-DD
Status: Accepted | Trial | Deferred | Revisit

### Problem

What was unclear, risky, painful, or easy to get wrong?

### Decision

What did we choose?

### Rationale

Why is this better for this product now?

### Trade-offs

What did we knowingly give up?

### Portfolio Signal

What does this show about engineering/product judgment?

### Follow-up

What should be measured, tested, hardened, or revisited later?
```

## Portfolio Thesis

Payloser is a mobile-first social settlement app for friend-group games. The standout engineering story is not just CRUD. It is the combination of:

- complex local-rule calculation logic that still feels explainable
- temporary-to-real user identity linking for messy real-world friend groups
- Kakao-centered sharing without overreaching into fragile permissions
- shared TypeScript contracts and pure calculators across web/API
- product-quality UX iteration based on actual input friction
