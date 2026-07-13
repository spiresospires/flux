# Architecture

Architecture concepts will live here as OKF concept documents.

# ADRs

* [ADR-005 - Two-Token JWT Auth](adr-005-two-token-jwt.md) - Platform and workspace-scoped token model.
* [ADR-009 - UUID-Integer Bridge](adr-009-uuid-integer-bridge.md) - UUIDs on the wire with integer IDs inside Oracle.
* [ADR-010 - Real-time Sync and Multi-Window Architecture](adr-010-realtime-sync.md) - SSE, cache invalidation, and multi-window coordination.
* [ADR-011 - Cursor Pagination](adr-011-cursor-pagination.md) - Keyset cursor pagination and live-list behavior.

# ADR to API Map

| ADR | Primary API concepts | Open questions |
|---|---|---|
| [ADR-005](adr-005-two-token-jwt.md) | [G01](../api/g01-auth.md), [G03](../api/g03-workspaces.md), [User Briefcase](../api/user-briefcase.md) | [Q3, Q7, Q12](../open-questions.md) |
| [ADR-009](adr-009-uuid-integer-bridge.md) | [G03](../api/g03-workspaces.md), [G05](../api/g05-folders.md), [G06](../api/g06-documents.md), [G31](../api/g31-events.md) | [Q11, Q19](../open-questions.md) |
| [ADR-010](adr-010-realtime-sync.md) | [G13](../api/g13-messages-notifications.md), [G25](../api/g25-jobs.md), [G31](../api/g31-events.md) | [Q9, Q11](../open-questions.md) |
| [ADR-011](adr-011-cursor-pagination.md) | [G06](../api/g06-documents.md), [G19](../api/g19-search.md), [G25](../api/g25-jobs.md), [G29](../api/g29-assistant.md) | [Q10, Q15, Q18](../open-questions.md) |

# Related Indexes

* [API concepts](../api/) - API group documents linked to these ADRs.
* [Open questions](../open-questions.md) - Unresolved decisions grouped by affected concept.

# Canonical Source During Transition

* [ARCHITECTURE.md](../../../ARCHITECTURE.md)
