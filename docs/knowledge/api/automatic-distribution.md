---
type: API Group
title: Automatic Distribution API
description: Provisional workspace-scoped contract for rule authoring, governance, diagnostics, and distribution runtime operations.
tags: [api, automatic-distribution, governance, unallocated]
timestamp: 2026-07-15T00:00:00Z
api_group: unallocated
base_path: /workspaces/{wsId}/distribution
contract_status: Draft
frontend_status: Wired (MSW) - AD 1/2
backend_status: Not started
team: Unassigned
phase: unallocated
formal_delivery_status: not-started
source: ../../api-status.md
---

# Purpose

This provisional contract supports workspace-scoped Automatic Distribution rule sets, draft editing, publication history, settings, and future diagnostics/runtime operations.

The API group, backend owner, and FLUX delivery phase are intentionally unallocated pending engineering agreement.

# SPA Consumers

* `useDistribution.ts`
* `AutomaticDistribution.tsx`
* Rules, Publish, History, and Settings components under `src/components/distribution/`
* Future Tester, Matrix, Log, and Unmatched components

# Current Endpoints

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/distribution/ruleset` | Return draft, published version, and history. |
| `GET /workspaces/{wsId}/distribution/settings` | Return action precedence, reasons, and alert recipients. |
| `POST /workspaces/{wsId}/distribution/rules` | Create a draft rule. |
| `PATCH /workspaces/{wsId}/distribution/rules/{ruleId}` | Replace a draft rule. |
| `DELETE /workspaces/{wsId}/distribution/rules/{ruleId}` | Remove a rule from the draft. |
| `POST /workspaces/{wsId}/distribution/publish` | Publish the draft with a required summary. |
| `POST /workspaces/{wsId}/distribution/restore` | Copy a historical version into the draft. |
| `PATCH /workspaces/{wsId}/distribution/settings` | Replace workspace AD settings. |

# Planned Contract Areas

AD 3/4 require server-owned endpoints for draft/published evaluation, runtime triggers, logs, unmatched items, dismissal, and deduplicated re-run. Final paths and async behavior are not agreed.

# Authentication and Authorization

Calls are workspace-scoped and use the workspace token under [ADR-005](../architecture/adr-005-two-token-jwt.md).

The prototype checks `ad.view` and `ad.manage` in the UI. Production endpoints must enforce grants server-side. Grant source, claim shape, and operation-level mapping remain open.

# Contract Requirements

* UUIDs on the wire per [ADR-009](../architecture/adr-009-uuid-integer-bridge.md), not the prototype `ProjectId` literals.
* ETag/`If-Match` or an equivalent version precondition for draft and settings writes.
* Idempotency for creates, publish, restore, and re-run operations.
* Explicit stale-`baseVersion` behavior.
* RFC 7807 errors.
* Audit identity and timestamps assigned by the server.
* A defined orchestration boundary for downstream activities and G25 jobs.
* G31 invalidation behavior for published rules, settings, logs, and unmatched state.

# Related Concepts

* [Automatic Distribution feature](../features/automatic-distribution.md)
* [Workgroups API](workgroups.md)
* [G02 - Users and Profiles](g02-users-profiles.md)
* [G06 - Documents](g06-documents.md)
* [G13 - Messages and Notifications](g13-messages-notifications.md)
* [G25 - Async Jobs](g25-jobs.md)
* [G31 - Real-time Events](g31-events.md)

# Open Items

See questions 22–28 in [Engineering Open Questions](../open-questions.md).

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract boundaries remain in [ARCHITECTURE.md](../../../ARCHITECTURE.md), with feature detail in [AUTO_DISTRIBUTION_PLAN.md](../../../AUTO_DISTRIBUTION_PLAN.md).
