---
type: API Group
title: G07 - Document Content
description: Binary document content, thumbnails, uploads, downloads, and storage abstraction.
tags: [api, documents, content, storage, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G07
base_path: /workspaces/{wsId}/documents/{docId}/content
contract_status: Draft
frontend_status: Stubbed
backend_status: Not started
team: API / INFRA
source: ../../api-status.md
---

# Purpose

G07 handles binary document content and content variants, separate from G06 document metadata.

# SPA Consumers

* Download actions.
* Upload/new revision actions.
* Thumbnail display.
* My Briefcase bulk download.
* Potential rendition actions.

# Key Endpoints

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/documents/{docId}/content` | Download or stream document content. |
| `POST /workspaces/{wsId}/documents/{docId}/content` | Upload a new document revision. |
| `GET /workspaces/{wsId}/documents/{docId}/content/thumbnail` | Fetch document thumbnail. |

# Storage Boundary

G07 must abstract the migration from NFS to S3. The SPA should not know whether content is served from legacy file storage, S3, or a pre-signed URL.

# Current Status

The SPA has stubbed actions. Backend work has not started.

# Open Items

* Decide NFS-to-S3 migration strategy.
* Confirm whether renditions are content variants under G07.
* Confirm upload size thresholds and when uploads return async G25 jobs.
* Confirm download behavior for user briefcase bulk operations.

# Related Concepts

* [G06 - Documents](g06-documents.md)
* [G25 - Async Jobs](g25-jobs.md)
* [User Briefcase](user-briefcase.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

