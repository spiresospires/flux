---
type: API Group
title: Workgroups API
description: Provisional workspace-scoped contract for reusable named groups of workspace members.
tags: [api, workgroups, users, permissions, unallocated]
timestamp: 2026-07-15T00:00:00Z
api_group: unallocated
base_path: /workspaces/{wsId}/workgroups
contract_status: Draft
frontend_status: Wired (MSW) - read only
backend_status: Not started
team: Unassigned
phase: unallocated
formal_delivery_status: not-started
source: ../../api-status.md
---

# Purpose

Workgroups are reusable workspace-scoped recipient groups. Automatic Distribution is their first prototype consumer, but the domain should remain usable by reviews, permissions, messaging, and future workspace-administration features.

# Current Endpoint

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/workgroups` | Return the workspace's named groups and member IDs. |

The prototype also reads `GET /users` for recipient display and selection. Production should use an explicitly authorised workspace-membership or directory contract unless global directory visibility is a deliberate requirement.

# Current Status

The read-only Workgroups Admin page and Automatic Distribution recipient picker are wired through MSW. Create, edit, membership, deletion, and lifecycle behavior are deferred.

# Ownership Boundary

Open ownership options are:

* extend G02 users and workspace membership;
* combine resource ownership with G04 permissions/ACL;
* allocate a separate workspace-administration contract.

Workgroups should not become AD-specific merely because AD is the first consumer. Likewise, access to Workgroups should not permanently inherit `ad.view` unless product and security owners explicitly choose that policy.

# Contract Requirements

* Workspace-scoped authorization and member visibility.
* UUID identifiers on the wire.
* Rules for inactive, removed, or cross-company members.
* Stable membership semantics when a published distribution rule references a group that later changes.
* ETag/`If-Match` and audit behavior when management operations are added.
* G31 invalidation behavior for membership changes.

# Related Concepts

* [G02 - Users and Profiles](g02-users-profiles.md)
* [Automatic Distribution API](automatic-distribution.md)
* [Automatic Distribution feature](../features/automatic-distribution.md)
* [G31 - Real-time Events](g31-events.md)
* [ADR-005 - Two-Token JWT Auth](../architecture/adr-005-two-token-jwt.md)
* [ADR-009 - UUID-Integer Bridge](../architecture/adr-009-uuid-integer-bridge.md)

# Open Items

See question 24 in [Engineering Open Questions](../open-questions.md).

# Source

Status is tracked in [api-status.md](../../api-status.md). Current prototype behavior is described in [AUTO_DISTRIBUTION_PLAN.md](../../../AUTO_DISTRIBUTION_PLAN.md).
