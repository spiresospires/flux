---
type: Feature
title: Automatic Distribution
description: Workspace-scoped metadata rules that route documents to recipients and initiate downstream activities with governed draft and publish workflows.
tags: [automatic-distribution, documents, governance, workgroups, prototype]
timestamp: 2026-07-15T00:00:00Z
status: prototype-ad2
phase: unallocated
formal_delivery_status: not-started
source: ../../../AUTO_DISTRIBUTION_PLAN.md
---

# Purpose

Automatic Distribution explores a new workspace-scoped, rule-based design for routing documents and initiating downstream activities. Rules match document metadata and expand user or workgroup recipients for reviews, approvals, messages, transmittals, technical queries, and RFIs.

The canonical design decisions, detailed model, and staged prototype roadmap remain in [AUTO_DISTRIBUTION_PLAN.md](../../../AUTO_DISTRIBUTION_PLAN.md).

# Current Status

| Local stage | Status | Scope |
|---|---|---|
| AD 1 | Complete in prototype | Rule model, workspace seed data, MSW endpoints, permissions demo, rules authoring, Workgroups read view |
| AD 2 | Complete in prototype | Draft/publish lifecycle, history, restore-as-draft, settings, publish warnings |
| AD 3 | Pending | Server-side evaluation behavior, tester, trace, near misses, matrix coverage view |
| AD 4 | Pending | Runtime triggers, distribution log, unmatched queue, alerting, deduplicated re-run |

`AD 1`–`AD 4` are feature-local stage names. The FLUX delivery phase is unresolved; they do not imply inclusion in the canonical Phase 1 baseline.

Formal delivery has not started. The current implementation is a design prototype, and this concept does not define or imply a legacy-to-new transition plan.

# Durable Decisions

* A rule list is the source of truth; any matrix is a derived coverage view.
* All matching rules fire, then recipient/action outcomes are deduplicated by configured precedence and rule priority.
* Each workspace has a draft, one published version, and immutable version history.
* Publishing requires a summary; restoring a historical version creates a draft rather than changing production state immediately.
* Validation warns but does not block draft editing.
* Unmatched documents must be visible and recoverable rather than silently ignored.
* The production evaluator is server-side. Browser evaluation exists only to support the mock prototype and acceptance behavior.

# Runtime Boundary

The React pages use `useDistribution` React Query hooks and `src/api/distribution.ts`. MSW currently serves the provisional contracts and persists rule-set state in localStorage.

The server must own:

* permission enforcement;
* rule evaluation and workgroup expansion;
* idempotency, concurrency, retries, and audit;
* downstream activity orchestration;
* runtime trigger, log, unmatched, and re-run behavior.

# API and Domain Dependencies

| Concern | Related concept |
|---|---|
| Provisional rule and governance contract | [Automatic Distribution API](../api/automatic-distribution.md) |
| Users and workspace membership | [G02 - Users and Profiles](../api/g02-users-profiles.md) |
| Workspace scope | [G03 - Workspaces](../api/g03-workspaces.md) |
| Document metadata and trigger inputs | [G06 - Documents](../api/g06-documents.md) |
| Workgroup recipients | [Workgroups API](../api/workgroups.md) |
| Messages and alerts | [G13 - Messages and Notifications](../api/g13-messages-notifications.md) |
| Async execution | [G25 - Async Jobs](../api/g25-jobs.md) |
| Runtime invalidation | [G31 - Real-time Events](../api/g31-events.md) |
| Authentication and workspace tokens | [G01 - Authentication and Tokens](../api/g01-auth.md), [ADR-005](../architecture/adr-005-two-token-jwt.md) |
| Production UUIDs | [ADR-009 - UUID-Integer Bridge](../architecture/adr-009-uuid-integer-bridge.md) |

G04 permissions, G09 transmittals, G10 reviews/approvals, G12 RFIs, G14 audit, and G16 metadata schemas are also dependencies, but do not yet have OKF companion concepts.

# Open Decisions

See questions 22–28 in [Engineering Open Questions](../open-questions.md). The highest-priority decisions are API/phase allocation, production authorization, Workgroups ownership, concurrency, downstream orchestration, metadata schema integration, and audit/event behavior.

# Source

Canonical feature detail remains in [AUTO_DISTRIBUTION_PLAN.md](../../../AUTO_DISTRIBUTION_PLAN.md). Contract status and unresolved engineering ownership are tracked in [api-status.md](../../api-status.md) and [ARCHITECTURE.md](../../../ARCHITECTURE.md).
