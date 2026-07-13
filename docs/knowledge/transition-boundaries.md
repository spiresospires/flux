---
type: Reference
title: OKF Transition Boundaries
description: Defines how the OKF knowledge bundle relates to the existing canonical project documentation.
tags: [okf, documentation, transition, reference]
timestamp: 2026-07-13T00:00:00Z
status: active
---

# Purpose

This bundle is a structured companion to the existing project documentation. It helps humans and agents find the right concept quickly, but it does not replace the current canonical docs yet.

# Canonical Source Map

| Subject | Canonical source | OKF companion |
|---|---|---|
| Architecture decisions, production target, component mapping, environment variables | [ARCHITECTURE.md](../../ARCHITECTURE.md) | [Architecture concepts](architecture/) |
| API group status, ownership, open questions, backend/frontend readiness | [api-status.md](../api-status.md) | [API concepts](api/) and [open questions](open-questions.md) |
| Current React/MSW runtime shape | [runtime-architecture.md](../runtime-architecture.md) | Future runtime architecture concept |
| My Briefcase product and implementation plan | [BRIEFCASE_PLAN.md](../../BRIEFCASE_PLAN.md) | Future [Briefcase feature concept](features/) and [User Briefcase API concept](api/user-briefcase.md) |
| AI/code-generation working notes | [CLAUDE.md](../../CLAUDE.md) | Future agent-guide concepts |
| Chronological implementation history | [DEVELOPMENT_LOG.md](../../DEVELOPMENT_LOG.md) | [Knowledge bundle log](log.md) for OKF-only changes |

# Update Rules

* If a contract, status, or decision changes, update the canonical source first.
* Then update the matching OKF concept in the same commit when practical.
* If the OKF concept is intentionally a summary, preserve the source link rather than copying all detail.
* If canonical docs and OKF summaries disagree, trust the canonical source and fix the OKF summary.
* Keep `index.md` files navigational. Put durable facts in concept files.
* Keep [open questions](open-questions.md) aligned with [api-status.md](../api-status.md).

# What Belongs in OKF

Good OKF concept candidates:

* ADRs and durable decisions.
* API group summaries.
* Open questions and decision dependencies.
* Feature concepts that cross multiple files.
* Agent-readable guides for common implementation or review workflows.

Avoid using OKF for:

* Full source-code documentation that belongs near code.
* Chronological implementation detail already captured in `DEVELOPMENT_LOG.md`.
* Large verbatim copies of canonical docs.
* Generated artifacts such as dashboards, bundles, or presentation files.

# Drift Control

Until validator tooling exists, use this manual checklist for OKF updates:

1. Confirm the canonical source was updated or still reflects the truth.
2. Update the related OKF concept frontmatter if status, ownership, or tags changed.
3. Update any relevant index page.
4. Update [open questions](open-questions.md) when question status or ownership changes.
5. Add an entry to [log.md](log.md) for notable OKF bundle changes.
6. Run a local link check before committing when links change.

# Current Transition State

Steps 1 through 5 of the [OKF adoption plan](adoption-plan.md) are complete.

The next optional step is validation/generation tooling. Until that exists, this bundle is maintained manually.

