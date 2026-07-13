---
type: API Group
title: G05 - Folder Management
description: Workspace folder tree, folder CRUD, and folder move operations.
tags: [api, folders, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G05
base_path: /workspaces/{wsId}/folders
contract_status: Proposed
frontend_status: Wired (MSW)
backend_status: Not started
team: API
source: ../../api-status.md
---

# Purpose

G05 provides folder tree and folder management APIs for a workspace.

# SPA Consumers

* `useFolderTree`
* `FolderTree.tsx`
* Document navigation and folder filters

# Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/folders/tree` | Return the full recursive folder tree. |
| `POST /workspaces/{wsId}/folders` | Create a folder. |
| `PATCH /workspaces/{wsId}/folders/{folderId}` | Rename or update a folder. |
| `POST /workspaces/{wsId}/folders/{folderId}/move` | Move a folder. |
| `DELETE /workspaces/{wsId}/folders/{folderId}` | Delete a folder. |

# Prototype Mapping

`MOCK_FOLDERS` in `src/data/mockFolders.ts` maps to the folder tree endpoint.

Expand/collapse remains client state and does not require an API call.

# Current Status

Reads are wired through MSW. CRUD is marked in the contract but not exercised by the SPA.

# Open Items

* Confirm `Idempotency-Key` handling for folder creation.
* Confirm ETag and `If-Match` behavior for rename/update operations.
* Confirm folder move validation and failure shape.

# Related Concepts

* [G06 - Documents](g06-documents.md)
* [ADR-009 - UUID-Integer Bridge](../architecture/adr-009-uuid-integer-bridge.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

