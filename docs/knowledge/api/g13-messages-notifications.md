---
type: API Group
title: G13 - Messages and Notifications
description: User-facing workspace messages and notifications, distinct from infrastructure event streams.
tags: [api, messages, notifications, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G13
base_path: /workspaces/{wsId}/messages
contract_status: Draft
frontend_status: Mock
backend_status: Not started
team: API / MSG
source: ../../api-status.md
---

# Purpose

G13 owns user-facing messages and notifications, such as assigned review messages and dashboard notification feed items.

It is intentionally separate from [G31 - Real-time Events](g31-events.md), which exists for infrastructure-level cache invalidation.

# SPA Consumers

* Dashboard feed.
* BrandBanner notification bell.
* Document row or panel "Message" action.

# Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/messages` | Return workspace messages or notifications for the user. |
| `PATCH /workspaces/{wsId}/messages/{msgId}` | Mark a message read or update message state. |

# Current Status

The frontend uses mock data. The backend has not started.

# Open Items

* Define final message schema.
* Define read/unread state and notification counts.
* Confirm separation between user-facing notifications and G31 event delivery.

# Related Concepts

* [G31 - Real-time Events](g31-events.md)
* [ADR-010 - Real-time Sync and Multi-Window Architecture](../architecture/adr-010-realtime-sync.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

