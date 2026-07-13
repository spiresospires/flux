---
type: Project Plan
title: OKF Adoption Plan
description: Step-by-step plan and progress record for introducing the OKF-style knowledge layer.
tags: [okf, documentation, planning]
timestamp: 2026-07-13T00:00:00Z
---

# Purpose

Adopt an OKF-style structured knowledge layer under `docs/knowledge/` without disrupting the existing documentation.

This plan is the running progress record for the work. Update it whenever a step is started, completed, or deliberately changed.

# Principles

* Keep the existing docs canonical during the transition.
* Prefer small, reviewable local commits.
* Start with ADRs and API groups because they are already semi-structured and high-value for agents.
* Use markdown and YAML frontmatter only; defer custom tooling until the content shape is useful.
* Do not push OKF adoption commits unless explicitly requested.

# Steps

| Step | Status | Scope | Commit target |
|---|---|---|---|
| 1 | Complete | Create OKF bundle skeleton, section indexes, concept type reference, and this adoption plan. | `docs: add OKF knowledge bundle skeleton` |
| 2 | Complete | Extract ADR concepts from `ARCHITECTURE.md` into `docs/knowledge/architecture/`. | `docs: add OKF ADR concepts` |
| 3 | Complete | Extract Phase 1 API group concepts into `docs/knowledge/api/`. | `docs: add OKF API group concepts` |
| 4 | Complete | Add cross-links, directory indexes, and an open-questions concept. | `docs: link OKF concepts and indexes` |
| 5 | Complete | Add transition notes from existing docs into the OKF bundle, keeping source docs canonical. | `docs: document OKF transition boundaries` |
| 6 | Pending | Add a small validator/generator for frontmatter, indexes, and local links. | `docs: add OKF validation tooling` |

# Current Boundary

Steps 1 through 5 establish the bundle structure, ADR concepts, Phase 1 API group concepts, cross-linked indexes, open-question navigation, and transition boundaries. Existing project documentation remains canonical during the transition.

# Pause Point

The OKF bundle is now useful as a manually maintained structured companion. Step 6 is optional tooling work and can wait until the content has settled enough to justify automation.
