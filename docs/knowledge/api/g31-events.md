---
type: API Group
title: G31 - Real-time Events
description: Workspace-scoped SSE event stream for cache invalidation and live updates.
tags: [api, realtime, events, sse, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G31
base_path: /workspaces/{wsId}/events
contract_status: Proposed
frontend_status: Not started
backend_status: Not started
team: MSG
source: ../../api-status.md
---

# Purpose

G31 delivers infrastructure-level workspace change events to the browser so the SPA can invalidate React Query caches and refetch changed resources.

# Transport

```http
GET /workspaces/{wsId}/events
Accept: text/event-stream
Authorization: Bearer <workspaceToken>
```

# Event Model

Events carry identifiers only. They do not carry changed entity payloads.

The client refetches through normal REST APIs, preserving the standard authorization and ACL path.

# SPA Consumers

* Global event connection manager.
* React Query invalidation logic.
* Multi-window leader election and broadcast.
* DocumentBrowser live update affordances.

# Current Status

The contract is proposed. Frontend and backend work have not started.

# Open Items

* Confirm SSE versus WebSocket against infrastructure constraints.
* Confirm ALB idle timeouts and per-node connection limits.
* Choose cluster fan-out mechanism.
* Define replay-buffer retention and `stream-reset` behavior.
* Confirm event stream permission filtering and entity-ID visibility rules.

# Related Concepts

* [ADR-010 - Real-time Sync and Multi-Window Architecture](../architecture/adr-010-realtime-sync.md)
* [G13 - Messages and Notifications](g13-messages-notifications.md)
* [G25 - Async Jobs](g25-jobs.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

