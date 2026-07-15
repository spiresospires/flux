# Features

Feature concepts will live here as OKF concept documents.

# Current Concepts

* [Automatic Distribution](automatic-distribution.md) - Workspace-scoped metadata routing, governed rule publication, and future runtime distribution.

Potential extraction targets:

* `briefcase.md` - My Briefcase product framing, contract needs, and implementation plan.
* `document-browser.md` - DocumentBrowser behavior, filters, listing modes, and API wiring.
* `search.md` - Search behavior, persistence, facets, and API wiring.
* `chat.md` - Flint assistant behavior and production integration needs.

# Related API Concepts

| Feature area | API concepts |
|---|---|
| Briefcase | [User Briefcase](../api/user-briefcase.md), [G02](../api/g02-users-profiles.md), [G07](../api/g07-document-content.md) |
| Document Browser | [G03](../api/g03-workspaces.md), [G05](../api/g05-folders.md), [G06](../api/g06-documents.md), [G07](../api/g07-document-content.md), [G31](../api/g31-events.md) |
| Search | [G19](../api/g19-search.md), [G06](../api/g06-documents.md), [ADR-011](../architecture/adr-011-cursor-pagination.md) |
| Chat | [G29](../api/g29-assistant.md), [G06](../api/g06-documents.md) |
| Dashboard | [G03](../api/g03-workspaces.md), [G13](../api/g13-messages-notifications.md) |
| Automatic Distribution | [Automatic Distribution API](../api/automatic-distribution.md), [Workgroups](../api/workgroups.md), [G02](../api/g02-users-profiles.md), [G06](../api/g06-documents.md), [G13](../api/g13-messages-notifications.md), [G25](../api/g25-jobs.md), [G31](../api/g31-events.md) |

# Open Questions

Feature extraction should preserve links to [Engineering Open Questions](../open-questions.md), especially the briefcase, search, dashboard, chat, and Automatic Distribution contract questions.

Canonical sources during transition:

* [BRIEFCASE_PLAN.md](../../../BRIEFCASE_PLAN.md)
* [ARCHITECTURE.md](../../../ARCHITECTURE.md)
* [runtime-architecture.md](../../runtime-architecture.md)
* [AUTO_DISTRIBUTION_PLAN.md](../../../AUTO_DISTRIBUTION_PLAN.md)
