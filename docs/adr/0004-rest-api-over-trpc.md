# ADR 0004: Use REST API over tRPC

## Status

Accepted

## Context

The backend is a separate NestJS API. The product also needs Kakao OAuth callbacks, public share links, and future mobile or external integrations.

## Decision

Use REST endpoints with shared Zod DTO schemas.

## Consequences

- Natural fit for NestJS controllers.
- Easier to support public read-only links and future clients.
- Type safety comes from shared Zod schemas rather than tRPC procedures.
- Endpoint documentation and schema discipline are important.

