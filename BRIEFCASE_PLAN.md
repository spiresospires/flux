# My Briefcase — Implementation Plan

> Status: **Briefcase 1 built & verified (2026-06-15); data layer wired to `/user/briefcase` over HTTP (2026-07-07).** Stages 2–4 pending.
> Plan captured 2026-06-15.
> Source material: `_FUSION/BRIEFCASE HOW IT CURRENTLY IS DESCRIBED.txt` (product framing)
> and `_FUSION/BRIEFCASE IDEAS.pdf` (19 customer ideas).

## What Briefcase is (product framing)

A **private, user-specific, cross-workspace** collection of references to source documents
that live in their original workspaces. Not a repository, not a shared space, not source-of-truth.
A briefcase item points to a **specific document revision** and may go stale. Persists across
sessions, spans all workspaces the user can access.

---

## 1. Key architectural decisions

| Concern | Decision | Rationale |
|---|---|---|
| **State layer** | `BriefcaseContext` keeps the stable `useBriefcase()` interface, but internally it is a React Query adapter — server state in the `['user','briefcase']` cache, mutations optimistic (instant toggle, rollback on error) | Briefcase needs per-item metadata (source workspace, added date, pinned revision, dynamic flag) that Clipboard doesn't; consumers never talk HTTP directly |
| **Persistence** | ~~localStorage~~ → **`GET/POST/PATCH/DELETE /user/briefcase`** (`src/api/briefcase.ts`), answered by MSW in the prototype (updated 2026-07-07). The MSW handlers persist to the original `flux.briefcase` localStorage key as the mock server's durable store, so pre-API demo briefcases carry over | User-scoped, NOT workspace-scoped — calls carry the platform token. `[TODO-ENG]` API group (suggested G02, alongside `/user/preferences`) — ARCHITECTURE.md open question 12 |
| **"Workspace" identity** | `Document.project` (project name) is the workspace proxy; resolved via `useWorkspaces()` (G03) at add-time | `Document` has no `workspaceId`; project *is* the workspace in FLUX. Satisfies the "retain source workspace" rule without a schema change |
| **Provider placement** | `<BriefcaseProvider>` nested inside `<ClipboardProvider>` in `App.tsx` | Same level as clipboard |
| **Route** | `/briefcase` -> new `MyBriefcase` page; added to `<Routes>` and `routeActiveItem` map in `LeftRail.tsx` | |
| **Nav visibility** | **Always visible in both scopes** (unlike Documents, which is project-only) | Briefcase is cross-workspace/user-level — must not be gated by scope |
| **Icon** | `BriefcaseIcon` from lucide (already used in DocumentBrowser + DetailSlidePanel) at `size={20}` | Same icon everywhere |
| **Revision model** | **Per-item static/dynamic toggle, default static** | Reconciles the static-with-staleness product framing with customer ideas I-425/I-640 |

## 2. Data model (`src/types/briefcase.ts`)

```ts
interface BriefcaseItem {
  id: string;                 // briefcase entry id
  document: Document;         // snapshot at add-time (title/ref/type/size)
  sourceProjectId: ProjectId; // workspace identity
  sourceWorkspaceName: string;
  pinnedRevision: string;     // revisionNumber captured when added
  isDynamic: boolean;         // default false -> follows latest when true (I-425/I-640)
  addedAt: string;            // ISO timestamp
  state: 'current' | 'newer-available' | 'checked-out' | 'unavailable';
}
```

Staleness is **computed**: compare `pinnedRevision` vs the live doc's current `revisionNumber`
in `mockDocumentsByProject`. `isDynamic` items always report `current`. A couple of seed items
get `checked-out`/`unavailable` hardcoded to exercise the badges.

`BriefcaseContext` API (superset of clipboard):
`items, count, add(doc), remove(id), removeMany(ids), clear, isInBriefcase(docId), toggleDynamic(id)`.

---

## 3. Roadmap (customer ideas mapped)

> Stage names below ("Briefcase 1–4") are local to this plan. They are **not** the
> FLUX `[PHASE-N]` rollout markers used elsewhere in the codebase.

### Briefcase 1 — Foundation ✅ DONE (2026-06-15)
- `BriefcaseContext` + `flux.briefcase` persistence + seed of ~6–8 cross-workspace items
  (2 flagged `newer-available`, 1 `checked-out`, 1 `unavailable`)
- LeftRail entry **directly under Dashboard**, always visible, with a **live counter badge**
  (blue `#0461BA` pill, top-right of icon, hidden at 0, "99+" cap)
- `MyBriefcase` page skeleton (grid like DocumentBrowser):
  title / ref / revision / **source-workspace column** / state badge / file type / added date
- Wire **three entry points with membership-aware toggle state** (add <-> "in briefcase / remove",
  filled vs outline icon):
  - DocumentBrowser row action menu (currently a `[TODO-ENG]` stub)
  - DetailSlidePanel briefcase action icon (currently a `[TODO-ENG]` stub)
  - SearchResults rows (new entry point)

### Briefcase 2 — Core actions & freshness
- Bulk select + toolbar: download, export, remove, clear-all, copy-to-workspace/folder
- Group/filter by source workspace; state badges live; **per-item static/dynamic toggle, default static** (I-425, I-640)

### Briefcase 3 — Grid parity with other listings
- Folder-icon -> folder location (I-157)
- Info action (I-259)
- Column sort (I-191)
- Select-across-pages (I-569)
- Select-all-per-workspace (I-546)

### Briefcase 4 — Heavier flows
- Copy *placeholder* (I-159)
- Revise-from-briefcase (current-rev only, per product framing)
- Extra export fields: Category / Uploaded-by / Filename / Originator (I-208)
- Bulk export -> edit -> import metadata (I-584)

### Backlog
- Bulk search+retrieve paste (I-448)
- Add-from Tag module (I-449)
- Add after upload (I-684)
- Reinstate-from-trash via briefcase (I-657)
- User subfolders in briefcase (I-724)
- Highlight Copy button when minimised (I-791)

### Not applicable in FLUX (prototype)
- **I-830** add-from-submittal — no submittal page exists in this prototype
- **I-826** external annotations — Apryse *viewer* feature; Briefcase is only one grid where its
  icon appears, not a briefcase capability

---

## 4. Parked — needs FLUX discovery before scoping

- **I-262 — Expand attachments in Briefcase.** Customer wants an attachment icon next to a document
  that expands to show attached/child documents. **Deliberately excluded from the phased plan above**
  until we understand how attachments / parent-child relationships actually surface in FLUX today
  (the `Document.relationships` model exists, but the attachment *expand* UX pattern hasn't been
  designed or built anywhere in FLUX yet). Revisit once that behaviour is defined.

---

## 5. Files touched in Briefcase 1
- **New:** `src/types/briefcase.ts`, `src/contexts/BriefcaseContext.tsx`, `src/data/briefcaseSeed.ts`, `src/pages/MyBriefcase.tsx`
- **Edit:** `App.tsx` (provider + route), `LeftRail.tsx` (nav item + counter badge + active-route map),
  `DocumentBrowser.tsx` (wire stub + toggle), `DetailSlidePanel.tsx` (wire stub + toggle),
  `SearchResults.tsx` (add entry point), localization strings for `navigation.briefcase` + briefcase labels

## 6. Decisions confirmed
- Counter badge style: **blue `#0461BA`** pill matching the active-nav accent (confirmed 2026-06-15).
