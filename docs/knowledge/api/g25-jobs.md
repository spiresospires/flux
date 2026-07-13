---
type: API Group
title: G25 - Async Jobs
description: Async job references, polling, and terminal status for long-running workspace operations.
tags: [api, jobs, async, phase-1]
timestamp: 2026-07-13T00:00:00Z
api_group: G25
base_path: /workspaces/{wsId}/jobs
contract_status: Proposed
frontend_status: Not started
backend_status: Not started
team: API
source: ../../api-status.md
---

# Purpose

G25 tracks long-running operations that cannot safely complete inside a normal synchronous request.

# Use Cases

* Large uploads.
* Bulk operations.
* G05 or G06 writes that may take longer than two seconds.
* G07 content upload processing.

# Key Endpoint

| Endpoint | Use |
|---|---|
| `GET /workspaces/{wsId}/jobs/{jobId}` | Poll a job until it reaches a terminal state. |

# Contract Rule

Any write expected to take more than two seconds should return `202 Accepted` with a job reference.

# Client Model

React Query can poll with `refetchInterval` until job status is terminal:

* `COMPLETE`
* `FAILED`

When G31 is healthy, `job.updated` events can replace or reduce polling.

# Current Status

The contract is proposed. Frontend and backend work have not started.

# Open Items

* Define job status enum and error payload.
* Confirm whether all async jobs emit G31 `job.updated`.
* Confirm retention and lookup behavior for completed jobs.

# Related Concepts

* [G31 - Real-time Events](g31-events.md)
* [G07 - Document Content](g07-document-content.md)

# Source

Status is tracked in [api-status.md](../../api-status.md). Contract detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

