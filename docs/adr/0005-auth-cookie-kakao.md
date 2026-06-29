# ADR 0005: Use Kakao OAuth and HTTP-only Cookie Sessions

## Status

Accepted

## Context

User management is required for persistent groups and statistics. Kakao is the primary social graph and sharing surface for the target users.

## Decision

Use Kakao OAuth for production authentication and a development-only mock login for local work. Web sessions use HTTP-only signed cookies.

## Consequences

- Avoids storing browser tokens in localStorage.
- Keeps local development unblocked without Kakao configuration.
- Mobile clients may require an additional token strategy later.
- Session invalidation may later require a DB-backed session table.

