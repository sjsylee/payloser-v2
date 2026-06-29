# ADR 0001: Use pnpm Workspace and Turborepo

## Status

Accepted

## Context

The product has a web app, an API app, and shared TypeScript contracts/calculators. The calculator must run in both the browser and API without duplication.

## Decision

Use pnpm workspace with Turborepo.

## Consequences

- Apps and packages can share local TypeScript packages.
- Build and test scripts can be cached and orchestrated.
- The repository remains lighter than an Nx setup for the MVP.
- Workspace scripts must stay disciplined so the monorepo does not become noisy.

