---
type: API Group
title: G19 - Search
description: Workspace search, full-text results, facets, and cursor-paginated result browsing.
tags: [api, search, pagination, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G19
base_path: /workspaces/{wsId}/search
contract_status: Proposed
frontend_status: Wired (MSW)
backend_status: Not started
team: API / DB
source: ../../api-status.md
---

# Purpose

G19 provides workspace search results, filters, and facets.

# SPA Consumers

* `useSearch`
* `SearchResults.tsx`
* `SearchContext.tsx`
* Filter panel chips and facets

# Key Endpoints

| Endpoint | Use |
|---|---|
| `POST /workspaces/{wsId}/search` | Full-text search with filters, facets, and cursor pagination. |
| `GET /workspaces/{wsId}/search/saved` | List saved searches. Phase 2. |
| `POST /workspaces/{wsId}/search/saved` | Create saved search. Phase 2. |

# Request Model

The Phase 1 search body includes:

```json
{
  "query": "",
  "filters": {
    "folderId": "",
    "status": "",
    "documentType": "",
    "dateRange": ""
  },
  "limit": 50,
  "cursor": null
}
```

# Response Model

Search returns result items, `nextCursor`, and aggregations/facets that drive filter chips.

# Pagination

G19 follows [ADR-011 - Cursor Pagination](../architecture/adr-011-cursor-pagination.md), matching G06 cursor semantics.

# Current Status

The frontend is wired through MSW using `useSearch`.

# Open Items

* Define the real enterprise all-workspaces search contract. The SPA currently uses a sentinel `wsId`.
* Decide whether `totalApprox` is returned and how it is computed.
* Confirm saved-search endpoints for Phase 2.

# Related Concepts

* [G06 - Documents](g06-documents.md)
* [ADR-011 - Cursor Pagination](../architecture/adr-011-cursor-pagination.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

