---
type: API Group
title: User Briefcase
description: User-scoped cross-workspace document reference collection exposed at /user/briefcase.
tags: [api, briefcase, users, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: user-briefcase
base_path: /user/briefcase
contract_status: Proposed
frontend_status: Wired (MSW)
backend_status: Not started
team: API
source: ../../api-status.md
---

# Purpose

The user briefcase is a private, user-scoped, cross-workspace collection of document references.

Because items can span workspaces, briefcase calls use the platform token rather than a workspace-scoped token.

# SPA Consumers

* `BriefcaseContext`
* `useBriefcase`
* `MyBriefcase.tsx`
* Document row and panel actions

# Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /user/briefcase` | Return the current user's briefcase items. |
| `POST /user/briefcase` | Add a document reference. Idempotent on `docId`. |
| `PATCH /user/briefcase/{docId}` | Toggle static/dynamic behavior. |
| `DELETE /user/briefcase?docId=...` | Remove one document reference. |
| `DELETE /user/briefcase` | Clear all briefcase items. |

# Cache Model

The React Query cache key is `['user', 'briefcase']`.

Mutations use optimistic updates in the prototype.

# Current Status

The frontend is wired through MSW. The backend has not started.

# Open Items

* Confirm final API group ownership; G02 is the suggested home.
* Confirm final paths.
* Define server-side freshness state computation for `newer-available`, `checked-out`, and `unavailable`.
* Confirm bulk download integration with G07.

# Related Concepts

* [G02 - Users and Profiles](g02-users-profiles.md)
* [G07 - Document Content](g07-document-content.md)
* [ADR-005 - Two-Token JWT Auth](../architecture/adr-005-two-token-jwt.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md) and [BRIEFCASE_PLAN.md](../../../BRIEFCASE_PLAN.md).

