# ADR 0006: Use Framer Motion and Lottie

## Status

Accepted

## Context

The UI should be modern, mobile-friendly, and slightly playful without becoming noisy. Results, rankings, and penalty moments are emotional parts of the app.

## Decision

Use Framer Motion for UI transitions and Lottie for rare expressive moments.

## Consequences

- Framer Motion handles result reveals, ranking transitions, drawers, and layout motion.
- Lottie is reserved for group creation, saved result, punishment reveal, RPS loss record, and empty states.
- Motion must support hierarchy and feedback, not decoration.
- Animation assets should be kept small and optional.

