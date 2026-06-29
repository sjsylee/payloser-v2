# ADR 0007: Use Token-based Public Read-only Result Links

## Status

Accepted

## Context

Most settlement results are shared in group chats. Requiring every viewer to log in would make result verification annoying.

## Decision

Generate public share tokens for settlement result pages.

## Consequences

- Anyone with the link can view the result read-only.
- Editing, deleting, and group statistics require login.
- Sensitive user identifiers must not be exposed on public pages.
- Share links should be revocable later.

