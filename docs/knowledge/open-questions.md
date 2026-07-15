---
type: Open Question
title: Engineering Open Questions
description: Cross-linked open engineering questions that affect ADRs, API groups, and Phase 1 delivery.
tags: [open-questions, api, architecture, phase-1]
timestamp: 2026-07-15T00:00:00Z
status: open
source: ../api-status.md
---

# Purpose

This concept gives agents and engineers one navigable view of unresolved decisions that affect the Flux prototype-to-production handoff.

The canonical status tracker remains [api-status.md](../api-status.md). This file adds OKF links to the relevant concepts.

# Phase 1 Open Questions

| # | Question | Related concepts | Owner | Status |
|---|---|---|---|---|
| 1 | Confirm G29 SSE streaming contract and context payload schema against the LLM gateway. | [G29](api/g29-assistant.md) | LLM | Open |
| 2 | Decide whether dashboard stats belong to G03 workspace summary or a dedicated G26 dashboard endpoint. | [G03](api/g03-workspaces.md) | API | Open |
| 3 | Decide where the "Try New" per-user feature flag is persisted. | [G02](api/g02-users-profiles.md) | API | Open |
| 4 | Define NFS-to-S3 migration strategy for document content serving. | [G07](api/g07-document-content.md) | INFRA | Open |
| 5 | Confirm final region subdomain scheme for `VITE_API_BASE_URL`. | [G03](api/g03-workspaces.md) | INFRA | Open |
| 7 | Confirm CORS policy for React SPA origins per region. | [G01](api/g01-auth.md), [G03](api/g03-workspaces.md) | API / INFRA | Open |
| 8 | Add top-level React error boundary for RFC 7807 ProblemDetails. | [G06](api/g06-documents.md), [G19](api/g19-search.md) | FE | Open |
| 9 | Confirm G31 transport, cluster fan-out, and replay-buffer retention. | [G31](api/g31-events.md), [ADR-010](architecture/adr-010-realtime-sync.md) | MSG / INFRA | Open |
| 10 | Decide the source for `totalApprox`. | [G06](api/g06-documents.md), [G19](api/g19-search.md), [ADR-011](architecture/adr-011-cursor-pagination.md) | DB / API | Open |
| 11 | Decide whether the event stream is permission-filtered or whether entity IDs may leak existence. | [G31](api/g31-events.md), [ADR-010](architecture/adr-010-realtime-sync.md) | MSG / Security | Open |
| 12 | Confirm briefcase API group home and server-side freshness computation. | [User Briefcase](api/user-briefcase.md), [G02](api/g02-users-profiles.md) | API | Open |
| 13 | Confirm `Idempotency-Key` and ETag/`If-Match` support for writes. | [G05](api/g05-folders.md), [G06](api/g06-documents.md) | API | Open |
| 14 | Add category chips and column text filters as G06 query params. | [G06](api/g06-documents.md) | API | Open |
| 15 | Define server-side aggregation for grouping subtotals over large collections. | [G06](api/g06-documents.md) | API / DB | Open |
| 16 | Decide endpoint homes for subscribe, favorite, share link, and renditions. | [G02](api/g02-users-profiles.md), [G07](api/g07-document-content.md), [G13](api/g13-messages-notifications.md) | API | Open |
| 17 | Decide where project geo metadata belongs. | [G03](api/g03-workspaces.md) | API / DB | Open |
| 18 | Define enterprise all-workspaces search contract. | [G19](api/g19-search.md) | API / DB | Open |
| 19 | Decide whether placeholders are a G06 document state or separate resource. | [G06](api/g06-documents.md) | API | Open |
| 20 | Confirm service home for feedback widget endpoint. | [G02](api/g02-users-profiles.md) | API | Open |
| 21 | Publish OpenAPI specs per group for generated SPA types. | [API index](api/) | API | Open |
| 22 | Assign Automatic Distribution to an API group and owner, and decide its FLUX delivery phase; AD 1–4 are feature-local stages only. | [Automatic Distribution API](api/automatic-distribution.md), [Automatic Distribution feature](features/automatic-distribution.md) | Product / API | Open |
| 23 | Define production enforcement and grant source for `ad.view` and `ad.manage` across read, edit, publish, restore, settings, tester, log, and re-run operations. | [Automatic Distribution API](api/automatic-distribution.md), [G01](api/g01-auth.md), [ADR-005](architecture/adr-005-two-token-jwt.md) | API / Security | Open |
| 24 | Decide Workgroups ownership and whether recipient lookup must use workspace-filtered membership instead of global `GET /users`. | [Workgroups API](api/workgroups.md), [G02](api/g02-users-profiles.md), [Automatic Distribution API](api/automatic-distribution.md) | API / Security | Open |
| 25 | Define ETag/`If-Match`, draft `baseVersion` conflict behavior, and idempotency for distribution create, publish, restore, and re-run writes. | [Automatic Distribution API](api/automatic-distribution.md) | API | Open |
| 26 | Define transaction, retry, dedupe, compensation, and async-job boundaries when distribution starts downstream activities. | [Automatic Distribution API](api/automatic-distribution.md), [G13](api/g13-messages-notifications.md), [G25](api/g25-jobs.md) | API / MSG | Open |
| 27 | Confirm `discipline` in G06 and whether condition fields and stable values come from metadata schemas. | [G06](api/g06-documents.md), [Automatic Distribution API](api/automatic-distribution.md) | API / DB | Open |
| 28 | Replace mock project IDs with UUID wire IDs and decide how distribution history integrates with audit and real-time invalidation. | [Automatic Distribution API](api/automatic-distribution.md), [G31](api/g31-events.md), [ADR-009](architecture/adr-009-uuid-integer-bridge.md) | API / DB / MSG | Open |

# Resolved Questions

| # | Resolution | Related concepts |
|---|---|---|
| 6 | `ScopeContext` is the single source; `WorkspaceContext` was consolidated. | [G03](api/g03-workspaces.md), [ADR-005](architecture/adr-005-two-token-jwt.md) |

# High-Risk Clusters

| Cluster | Why it matters | Related concepts |
|---|---|---|
| Auth and scope | Mistakes here can leak workspace data or break all workspace-scoped calls. | [G01](api/g01-auth.md), [G03](api/g03-workspaces.md), [ADR-005](architecture/adr-005-two-token-jwt.md) |
| Live data and list correctness | Real-time updates, cursor pagination, and large lists must behave together. | [G06](api/g06-documents.md), [G19](api/g19-search.md), [G31](api/g31-events.md), [ADR-010](architecture/adr-010-realtime-sync.md), [ADR-011](architecture/adr-011-cursor-pagination.md) |
| Content storage migration | G07 must hide NFS-to-S3 migration details from the SPA. | [G07](api/g07-document-content.md), [User Briefcase](api/user-briefcase.md) |
| AI gateway streaming | Chat UX depends on true streaming behavior and recovery states. | [G29](api/g29-assistant.md) |
| Distribution governance and execution | Publishing rules can initiate several downstream domains; permissions, concurrency, retries, audit, and dedupe must agree before AD 3/4 production work. | [Automatic Distribution feature](features/automatic-distribution.md), [Automatic Distribution API](api/automatic-distribution.md), [Workgroups API](api/workgroups.md) |

# Source

Canonical question status remains in [api-status.md](../api-status.md).
