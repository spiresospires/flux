---
type: ADR
title: ADR-011 - Cursor Pagination
description: Infinite-scroll list endpoints use keyset cursor pagination rather than offset paging.
tags: [adr, pagination, api, react-query, phase-1]
timestamp: 2026-07-13T00:00:00Z
status: proposed
source: ../../../ARCHITECTURE.md
---

# Decision

List endpoints that back infinite scroll use keyset cursor pagination, not offset pagination.

This applies first to:

* `G06` documents.
* `G19` search.

# API Shape

```http
GET /workspaces/{wsId}/documents?folderId=...&sort=name&order=asc&limit=50&cursor=<opaque>
```

```json
{
  "items": [],
  "nextCursor": "eyJz..." | null,
  "totalApprox": 1140
}
```

# Rationale

Offset paging is unstable in live multi-user lists. Concurrent inserts and deletes shift row offsets between requests, which can create duplicates and gaps in an infinite list.

Keyset pagination is stable under concurrent writes and remains efficient in Oracle regardless of scroll depth.

# Cursor Rules

* The cursor is server-generated and opaque.
* Clients never parse cursor values.
* Changing sort or filters discards the current cursor and starts from the top.
* The cursor can encode the sort-key tuple, such as `(sortValue, id)`.

# Count Rule

Do not use `X-Total-Count` for these live lists.

Exact counts require a `COUNT(*)` per request and are stale as soon as they are computed. Where the UI needs a figure, the response uses `totalApprox`.

# Client Model

Use React Query `useInfiniteQuery` with `getNextPageParam: (last) => last.nextCursor`.

Render large lists through a windowed list such as `@tanstack/react-virtual` so DOM size stays bounded.

# Live Update UX Rule

Items are not auto-inserted into a list the user is reading.

A `G31` `document.created` event increments an "N new documents" pill. Clicking it refetches from the top and scrolls there.

Updates and deletes to already-visible rows apply in place through invalidation and refetch, preserving the row's position.

# Open Items

* Decide the source for `totalApprox`: folder rollup counters, cached counts with TTL, or sampled estimates.
* Ensure search and documents expose consistent cursor semantics.
* Confirm server-side aggregation strategy for grouping subtotals over large collections.

# Related Concepts

* [ADR-010 - Real-time Sync and Multi-Window Architecture](adr-010-realtime-sync.md)

# Source

Canonical long-form detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

