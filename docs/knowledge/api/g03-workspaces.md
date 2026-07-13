---
type: API Group
title: G03 - Workspaces
description: Workspace listing and workspace metadata consumed by scope selection, dashboard, and map views.
tags: [api, workspaces, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G03
base_path: /workspaces
contract_status: Proposed
frontend_status: Wired (MSW)
backend_status: Not started
team: API
source: ../../api-status.md
---

# Purpose

G03 provides the workspace list and workspace metadata available to the authenticated user.

# SPA Consumers

* `useWorkspaces`
* `BrandBanner`
* `ScopeContext`
* Dashboard
* Map/project views

# Key Endpoint

| Endpoint | Use |
|---|---|
| `GET /workspaces` | Return workspaces the authenticated user can access. |

# Prototype Mapping

`PROJECTS` in `src/data/projects.ts` maps to `GET /workspaces`.

`scope.id` maps directly to the production `wsId` path parameter used by downstream workspace APIs.

# Current Status

The frontend is wired through MSW and is swap-ready for a real backend.

# Open Items

* Confirm whether dashboard stats live on G03 or a dedicated G26 dashboard endpoint.
* Confirm where project geo metadata belongs: G03 workspace attributes or G16 metadata schema.

# Related Concepts

* [G01 - Authentication and Tokens](g01-auth.md)
* [ADR-005 - Two-Token JWT Auth](../architecture/adr-005-two-token-jwt.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

