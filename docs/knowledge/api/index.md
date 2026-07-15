# API

API group concepts will live here as OKF concept documents.

# Phase 1 API Groups

* [G01 - Authentication and Tokens](g01-auth.md) - Authentication and token exchange.
* [G02 - Users and Profiles](g02-users-profiles.md) - User profile, preferences, feature-flag, and potential briefcase ownership area.
* [G03 - Workspaces](g03-workspaces.md) - Workspace list and workspace metadata.
* [G05 - Folder Management](g05-folders.md) - Folder tree and folder management.
* [G06 - Documents](g06-documents.md) - Document listing, filtering, metadata, and pagination.
* [G07 - Document Content](g07-document-content.md) - Binary content, thumbnails, uploads, downloads, and storage abstraction.
* [G13 - Messages and Notifications](g13-messages-notifications.md) - User-facing messages and notification feed.
* [G19 - Search](g19-search.md) - Search contracts and facets.
* [G25 - Async Jobs](g25-jobs.md) - Async job polling and status.
* [G29 - AI Assistant - Flint](g29-assistant.md) - Flint assistant conversations and streaming.
* [G31 - Real-time Events](g31-events.md) - Real-time event stream and cache invalidation.
* [User Briefcase](user-briefcase.md) - User-scoped cross-workspace briefcase contract.

# Unallocated Prototype Contracts

* [Automatic Distribution API](automatic-distribution.md) - AD 1/2 rule authoring and governance are wired through MSW; group, owner, and FLUX phase remain unallocated.
* [Workgroups API](workgroups.md) - Read-only workspace groups are wired through MSW; ownership between G02, G04, or a separate contract remains open.

# Status Views

| Contract status | Concepts |
|---|---|
| Proposed | [G01](g01-auth.md), [G03](g03-workspaces.md), [G05](g05-folders.md), [G06](g06-documents.md), [G19](g19-search.md), [G25](g25-jobs.md), [G31](g31-events.md), [User Briefcase](user-briefcase.md) |
| Draft | [G02](g02-users-profiles.md), [G07](g07-document-content.md), [G13](g13-messages-notifications.md), [G29](g29-assistant.md), [Automatic Distribution](automatic-distribution.md), [Workgroups](workgroups.md) |

| Frontend status | Concepts |
|---|---|
| Wired through MSW | [G02](g02-users-profiles.md) (directory only), [G03](g03-workspaces.md), [G05](g05-folders.md), [G06](g06-documents.md), [G19](g19-search.md), [User Briefcase](user-briefcase.md), [Automatic Distribution](automatic-distribution.md), [Workgroups](workgroups.md) |
| Mock or stubbed | [G07](g07-document-content.md), [G13](g13-messages-notifications.md), [G29](g29-assistant.md) |
| Not started | [G01](g01-auth.md), [G25](g25-jobs.md), [G31](g31-events.md) |

# Cross-Cutting Contracts

| Concern | Concepts |
|---|---|
| Auth and scope | [G01](g01-auth.md), [G02](g02-users-profiles.md), [G03](g03-workspaces.md), [User Briefcase](user-briefcase.md), [ADR-005](../architecture/adr-005-two-token-jwt.md) |
| IDs | [G03](g03-workspaces.md), [G05](g05-folders.md), [G06](g06-documents.md), [G31](g31-events.md), [ADR-009](../architecture/adr-009-uuid-integer-bridge.md) |
| Cursor pagination | [G06](g06-documents.md), [G19](g19-search.md), [G29](g29-assistant.md), [ADR-011](../architecture/adr-011-cursor-pagination.md) |
| Real-time invalidation | [G13](g13-messages-notifications.md), [G25](g25-jobs.md), [G31](g31-events.md), [ADR-010](../architecture/adr-010-realtime-sync.md) |
| Content and async work | [G06](g06-documents.md), [G07](g07-document-content.md), [G25](g25-jobs.md), [User Briefcase](user-briefcase.md) |
| Distribution governance | [Automatic Distribution](automatic-distribution.md), [Workgroups](workgroups.md), [G02](g02-users-profiles.md), [G06](g06-documents.md), [G13](g13-messages-notifications.md), [G25](g25-jobs.md), [G31](g31-events.md) |

# Open Questions

See [Engineering Open Questions](../open-questions.md) for unresolved decisions linked back to these API concepts.

# Canonical Sources During Transition

* [ARCHITECTURE.md](../../../ARCHITECTURE.md)
* [api-status.md](../../api-status.md)
