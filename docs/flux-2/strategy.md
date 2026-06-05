# Flux Strategy

Scope:
- This strategy file is branch-specific to flux-2.
- It captures modernization direction for branch-local implementation work.
- Shared governance remains in CLAUDE.md, AGENTS.md, ARCHITECTURE.md, README.md, and DEVELOPMENT_LOG.md.

## Vision
Flux is the modernization path for FusionLive: a faster, clearer engineering document experience that is easier to learn, safer to change, and better suited to long-running product evolution.

## Why Flux Exists
- The legacy system carries UX and architectural constraints that slow delivery.
- Engineering teams need stronger flow continuity across documents, packages, search, and communication.
- Product direction requires modern navigation, clearer information architecture, and better operational consistency.

See README.md for current prototype scope and route surfaces.

## Flux-2 Goals
- Preserve core Flux-1 guardrails while improving usability and maintainability.
- Reduce interaction friction in high-frequency workflows.
- Keep architecture evolvable through explicit shared patterns.
- Improve continuity for AI-assisted development via durable artifacts.

See CLAUDE.md and ARCHITECTURE.md for implementation guardrails and system boundaries.

## Prototype Philosophy
- Prototype first, validate fast, and keep architectural intent explicit.
- Prefer realistic workflow behavior over polish-only demos.
- Keep implementation adaptable to production integration without pretending backend maturity.

## UX Modernization Principles
- Clear, persistent navigation with predictable route behavior.
- Progressive disclosure for complexity-heavy flows.
- Consistent interaction patterns for overlays, tables, filters, and detail surfaces.
- Accessibility and localization are baseline quality constraints, not post-work cleanup.

## Engineering Principles
- Extend existing systems before creating new abstractions.
- Preserve single sources of truth for shared domain data.
- Keep docs concise and operational; avoid competing guidance.
- Favor references to source docs over duplicated architectural prose.

## AI-Assisted Development
- Treat artifacts as durable memory for decisions, constraints, and regressions.
- Require implementation continuity across sessions through AGENTS.md, failures.md, DEVELOPMENT_LOG.md, and feature docs.
- Optimize for low-drift collaboration between humans and coding agents.

## What Is Intentionally Mocked
- Backend data, auth, and integration boundaries remain mocked in the prototype.
- Mock behavior is intentionally explicit to support safe UX iteration.
- Production assumptions must be documented in architecture artifacts before adoption.

## Non-Goals
- Rebuilding the full production backend in this repository.
- Introducing speculative architecture not grounded in current docs and code.
- Expanding documentation into process-heavy governance overhead.

## Long-Term Direction
- Gradual migration from prototype interactions to production-backed workflows.
- Keep route-level UX validated while tightening shared architecture.
- Preserve speed of iteration without sacrificing accessibility, localization, and system coherence.
