---
type: ADR
title: ADR-009 - UUID-Integer Bridge
description: External API IDs are UUIDs while Oracle continues to use integer primary keys internally.
tags: [adr, api, oracle, identifiers]
timestamp: 2026-07-13T00:00:00Z
status: proposed
source: ../../../ARCHITECTURE.md
---

# Decision

The REST API exposes UUIDs for external-facing IDs, including documents, folders, and workspaces. Oracle keeps integer primary keys internally. The Spring layer maps between UUIDs and integer IDs.

# Rationale

The legacy Oracle schema and Struts application continue to use integer primary keys during coexistence. The new API needs stable public identifiers that do not leak internal database keys and remain suitable for partner/external interfaces.

# Client Rule

The React SPA always treats IDs as strings and never depends on integer database identifiers.

`DocumentMetadata.id` in `src/types/document.ts` is already a `string`; keep it that way.

# Backend Rule

The Spring API layer owns the UUID-to-integer mapping. Clients must not parse, infer, or construct internal IDs.

# Implications

* API paths use UUID path parameters for workspace, folder, document, job, and related resources.
* React Query keys should store UUIDs, not integer IDs.
* Event payloads should identify entities by UUID.
* OpenAPI schemas should model external IDs as strings with UUID format where appropriate.
* Legacy coexistence requires reliable bridge data between UUIDs and existing integer rows.

# Related Concepts

* [ADR-010 - Real-time Sync and Multi-Window Architecture](adr-010-realtime-sync.md) uses UUID entity IDs in event envelopes.

# Source

Canonical long-form detail remains in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

