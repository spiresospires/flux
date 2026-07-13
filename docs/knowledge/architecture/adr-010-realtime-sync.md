---
type: ADR
title: ADR-010 - Real-time Sync and Multi-Window Architecture
description: Server-sent events and browser coordination model for live workspace updates.
tags: [adr, realtime, sse, react-query, phase-1]
timestamp: 2026-07-13T00:00:00Z
status: proposed
source: ../../../ARCHITECTURE.md
---

# Decision

Flux uses a workspace-scoped Server-Sent Events stream for infrastructure-level change notifications. The stream carries identifiers only; clients respond by invalidating React Query caches and refetching through normal REST endpoints.

# Product Requirements

* Multi-user SaaS behavior.
* No manual refreshes for live workspace data.
* Multiple browser windows per user stay in sync.

# Event Stream

```http
GET /workspaces/{wsId}/events
Accept: text/event-stream
Authorization: Bearer <workspaceToken>
```

This is API group `G31`.

The stream is separate from `G13` messages and notifications. `G13` is user-facing content; `G31` is cache-invalidation plumbing.

# Event Envelope

```json
{
  "id": "01J9ZK7Q2M...",
  "ts": "2026-07-06T09:14:03Z",
  "wsId": "b3f1...",
  "type": "document.updated",
  "entity": "document",
  "entityId": "9c2e...",
  "rev": 7,
  "actorId": "5a77..."
}
```

Events carry what changed, not the changed payload.

# Cache Invalidation Model

| Event type | React Query keys invalidated |
|---|---|
| `document.*` | `['documents', wsId]`, `['document', wsId, entityId]`, `['search', wsId]` |
| `folder.*` | `['folders', 'tree', wsId]`, `['documents', wsId]` |
| `message.created` | `['messages', wsId]` |
| `job.updated` | `['job', wsId, entityId]` |

# Multi-Window Coordination

One browser tab owns the SSE connection. The leading option is a Web Locks election using `navigator.locks.request('flux.sse-leader', ...)`.

The leader rebroadcasts events with `BroadcastChannel('flux.events')`. Every tab, including the leader, runs the same invalidation logic.

User preferences continue to sync through `storage` events via `useUserPref`.

# Reconnect Behavior

* The client reconnects with `Last-Event-ID`.
* The server replays events from a short retained buffer.
* If the client is too far behind, the server emits `stream-reset`.
* On `stream-reset`, the client invalidates all workspace queries.
* Delivery is at-least-once; duplicate events are harmless because invalidation is idempotent.

# Rationale

SSE fits the current model because client writes already go through REST. The browser needs one-way push for invalidation, not a bidirectional socket protocol.

Identifier-only events avoid payload permission leakage and keep merge logic out of the client. The REST refetch path remains the source of truth and applies normal ACL checks.

# Open Items

* Confirm SSE versus WebSocket against infrastructure constraints.
* Confirm ALB idle timeout behavior and per-node connection limits.
* Choose the cluster fan-out mechanism, such as Redis pub/sub.
* Decide replay-buffer retention.
* Confirm whether the event stream is filtered to visible entities or whether entity IDs alone are acceptable.
* Evaluate React Query `broadcastQueryClient` as an alternative to custom BroadcastChannel handling.

# Related Concepts

* [ADR-005 - Two-Token JWT Auth](adr-005-two-token-jwt.md)
* [ADR-009 - UUID-Integer Bridge](adr-009-uuid-integer-bridge.md)
* [ADR-011 - Cursor Pagination](adr-011-cursor-pagination.md)

# Source

Canonical long-form detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

