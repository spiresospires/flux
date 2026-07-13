---
type: API Group
title: G06 - Documents
description: Document listing, metadata, filtering, cursor pagination, and document relationships.
tags: [api, documents, pagination, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G06
base_path: /workspaces/{wsId}/documents
contract_status: Proposed
frontend_status: Wired (MSW)
backend_status: Not started
team: API / DB
source: ../../api-status.md
---

# Purpose

G06 is the primary document metadata API for workspace document browsing and detail views.

# SPA Consumers

* `useDocuments`
* `DocumentBrowser.tsx`
* `DocumentDetail.tsx`
* `MetadataPanel.tsx`
* Search result navigation and document selection

# Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/documents` | List documents with filters, sort, and cursor pagination. |
| `GET /workspaces/{wsId}/documents/{docId}` | Return a single document metadata record. |
| `PATCH /workspaces/{wsId}/documents/{docId}` | Update document metadata. |
| `GET /workspaces/{wsId}/documents/{docId}/revisions` | Return revision history. |
| `GET /workspaces/{wsId}/documents/{docId}/relationships` | Return document relationships. |

# Query Model

Document listing supports:

* `folderId`
* `status`
* `documentType`
* date filters
* author filters
* `sort`
* `order`
* `limit`
* `cursor`

# Pagination

G06 follows [ADR-011 - Cursor Pagination](../architecture/adr-011-cursor-pagination.md). It returns `{ items, nextCursor, totalApprox }` and does not use offset paging or `X-Total-Count`.

# Live Updates

G31 events invalidate document query keys. New rows are not inserted automatically into a list the user is reading; the UI shows a "N new documents" affordance.

# Current Status

The frontend is wired through MSW with server-side folder/status/type filters, sort, and cursor pagination.

# Open Items

* Add category chip and column text filters as G06 query params.
* Decide how grouping subtotals work over large collections.
* Decide the `totalApprox` source.
* Decide whether placeholders are a G06 document state or a separate resource.
* Confirm ETag and `If-Match` handling for metadata updates.

# Related Concepts

* [G05 - Folder Management](g05-folders.md)
* [G07 - Document Content](g07-document-content.md)
* [G31 - Real-time Events](g31-events.md)
* [ADR-010 - Real-time Sync and Multi-Window Architecture](../architecture/adr-010-realtime-sync.md)
* [ADR-011 - Cursor Pagination](../architecture/adr-011-cursor-pagination.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

