# Flux Knowledge Bundle

This directory is the OKF-style structured knowledge layer for the Flux prototype and production handoff.

It is a companion to the existing project documentation, not a replacement. During the transition, canonical long-form detail remains in files such as [ARCHITECTURE.md](../../ARCHITECTURE.md), [api-status.md](../api-status.md), and [runtime-architecture.md](../runtime-architecture.md).

# Bundle Guide

* [Adoption plan](adoption-plan.md) - Step-by-step migration plan and progress record for the OKF layer.
* [Concept types](concept-types.md) - Local concept type vocabulary used by this bundle.
* [Open questions](open-questions.md) - Cross-linked unresolved engineering decisions.
* [Architecture](architecture/) - ADRs, runtime decisions, and architecture concepts.
* [API](api/) - API group concepts and cross-cutting API contracts.
* [Features](features/) - Product and implementation concepts for feature areas.

# Navigation by Concern

* Authentication and scope: [ADR-005](architecture/adr-005-two-token-jwt.md), [G01](api/g01-auth.md), [G03](api/g03-workspaces.md), [User Briefcase](api/user-briefcase.md)
* Identifiers and coexistence: [ADR-009](architecture/adr-009-uuid-integer-bridge.md), [G06](api/g06-documents.md), [G31](api/g31-events.md)
* Live updates and list correctness: [ADR-010](architecture/adr-010-realtime-sync.md), [ADR-011](architecture/adr-011-cursor-pagination.md), [G06](api/g06-documents.md), [G19](api/g19-search.md), [G31](api/g31-events.md)
* Content and storage: [G06](api/g06-documents.md), [G07](api/g07-document-content.md), [G25](api/g25-jobs.md), [User Briefcase](api/user-briefcase.md)
* AI assistant: [G29](api/g29-assistant.md)

# Source Documents

* [Architecture guide](../../ARCHITECTURE.md) - Current architecture and API integration guide.
* [API status tracker](../api-status.md) - Current status for API groups, open questions, and cross-cutting contracts.
* [Runtime architecture](../runtime-architecture.md) - Current implementation architecture diagram.
* [Briefcase plan](../../BRIEFCASE_PLAN.md) - Current implementation plan for My Briefcase.
