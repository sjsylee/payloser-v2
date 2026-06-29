# ADR 0002: Share Zod Schemas and Pure Calculators

## Status

Accepted

## Context

The web app needs real-time previews while the API needs authoritative validation and persistence. Bowling calculation rules are complex and must not be duplicated.

## Decision

Place Zod schemas, shared TypeScript types, and pure calculators in `packages/shared`.

## Consequences

- Web and API use the same request/response contracts.
- The bowling calculator can be unit tested without a database or server.
- Prisma models are not exposed directly to the web app.
- Mapping between database records and shared API contracts must be explicit.

