# ADR 0003: Use Prisma with PostgreSQL

## Status

Accepted

## Context

The product needs relational data: groups, members, sessions, expense items, allocations, statistics, public share links, and auth records.

## Decision

Use PostgreSQL as the database and Prisma as the ORM/migration tool.

## Consequences

- Strong TypeScript integration and productive migrations.
- Good fit for NestJS services.
- Complex statistics may need raw SQL later.
- Prisma schema should remain an internal persistence model, not the public API contract.

