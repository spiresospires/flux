# FusionLive FLUX — UX Wireframe Prototype

A clickable wireframe / prototype exploring a redesigned UX for the FusionLive engineering document management system. This is a **UX mockup**, not production code — there is no real backend or auth. API calls go over HTTP against typed contracts and are answered by Mock Service Worker (MSW) with seeded mock data; set `VITE_API_MODE=real` (and `VITE_API_BASE_URL`) to point at a real backend with no component changes. A handful of UI preferences (appearance, panel widths, chat history width, etc.) persist to `localStorage`.

## Getting Started

1. Run `npm install`
2. Run `npm run dev`
3. Open http://localhost:5173/

## Routes

| Path | Screen |
| --- | --- |
| `/` | Dashboard |
| `/documents` | Documents (folders + filters + grid) |
| `/packages` | Packages library, wizard, detail |
| `/chat` | Ask Flint chat with conversation history |
| `/search` | Search results |
| `/briefcase` | My Briefcase |
| `/admin/distribution` | Automatic Distribution |
| `/admin/workgroups` | Workgroups |
| `/design-system` | Design system reference |

Document detail isn't a routed page — clicking a document opens a global `DocumentViewer` overlay on top of whichever screen you're on.

## Key UX changes vs current FusionLive

### Global chrome
- **Top bar** — a white 60px bar pinned to the top of every page with a company-logo switcher (top-left, defaults to the Idox logo — also lets you preview Clough, Iluka, Twinza and Rosetti-Marino branding) and profile / notifications controls (top-right).
- **Scope / project picker** — a dropdown in the top bar, next to the logo switcher. Lets you switch between enterprise scope (all projects) and a single project workspace; this scope drives the Dashboard, Documents nav visibility, and Chat's conversation filtering everywhere in the app.
- **Left navigation rail** — fixed-width icon rail (no hover-expand). Items: Dashboard, Briefcase, Flint (chat), Search, and Documents (shown only in project scope). An Admin group (Distribution, Workgroups) appears only in project scope for users with the relevant permission. Settings sits at the bottom.
- **Active item routing** — Dashboard → `/`, Documents → `/documents`, Packages → `/packages`, Chat → `/chat`, Search → `/search`, Briefcase → `/briefcase`, Admin items → `/admin/distribution` / `/admin/workgroups`.
- **Appearance switcher** (gear icon at the bottom of the rail) — a 2-option **Light / Dark** picker. Choice persists in `localStorage` and applies via `data-appearance` / `data-view` / `data-theme` attributes on `<html>`.

### Documents view
- **Removed redundant "Sort by" control** — the column headers already sort.
- **Compact grid header** — single-line "X documents found • Showing N" plus a smaller View button.
- **Aligned gutters** — equal narrow gap between left rail / folder panel / grid.
- **Table personalization** — Comfy Table and Compact Table support column sorting, filtering, drag reordering, show/hide columns, and single-column grouping by dragging a supported header into the whitespace grouping bar above the table.
- **Grouping persistence** — the active table grouping currently persists locally in `localStorage` as a prototype stand-in for future server-side preferences.
- **Table row selection fix** — row selection and select-all now use a single checkbox-style hit target so the clickable area aligns with the visual control.

### Packages — new mental model
The biggest functional concept change. Today, FusionLive Work Packs are tightly coupled to a single folder (the folder is the source of truth, the pack is stored inside it, and contents are inferred from folder membership).

In this prototype, **Packages are flexible standalone Package Objects** that live in their own library, separate from the document folder structure.

The Packages area includes:

1. **Packages Library** (`/packages`)
   - Filterable table by status: Draft / In Review / Approved / Issued / Out of Date
   - Columns: Reference, Title, Status, Rev, Owner, Last updated, Docs count, Change state, Actions
   - Per-row actions: Open, Repackage, Issue/Transmit, Download PDF, Download ZIP

2. **Create Package wizard** (4 steps)
   - **Details** — reference, title, description, type, discipline, area, owner, due date
   - **Add documents** — modal with five sources: Folder browser, Search results, Saved view, Document register, Manual numbers. Demonstrates that a package can gather documents from anywhere in the project, not just one folder
   - **Organise** — reorder, render-vs-link toggle per doc, include/exclude, attachments and linked-doc options
   - **Review & generate** — summary and a Generate action

3. **Package detail** with tabs: Overview, Contents, Versions, Change Log, Distribution, Activity
   - **Repackage** action bumps revision and prepends a new version entry
   - **Distribution** tab offers: Send via transmittal, Start review workflow, Download PDF/ZIP, Share link

4. **Concept callout** in the library reinforces the message: folders organise *source* documents, Packages organise *deliverables*.

### Chat (Ask Flint)
- **Removed top "Exit Chat / Ask Flint" banner** — chat overlay reuses the global chrome.
- **Left rail visible on chat page** so users can navigate without exiting.
- **Conversation history sidebar** (similar to ChatGPT / Copilot / Gemini)
  - New chat button
  - Search chats
  - Pinned and Recent sections
  - Per-chat context menu: Pin / Unpin, Rename (inline), Delete
  - Collapsible — collapses to a thin 40px rail with New-chat and expand buttons
  - **Resizable** — drag the right edge of the sidebar to widen it (240–560px)
- **Scope-aware history** — the sidebar's Pinned/Recent lists filter by whichever scope (enterprise or a specific project) is currently selected in the top-bar scope picker. Chat doesn't have its own separate scope switcher — it inherits scope globally, the same as every other screen.
- **Seeded EDMS-flavoured example conversations** — TAG ↔ document associations, latest revisions, where-used queries, vendor datasheets, transmittal counts, hold points, redlines, etc. Each is tagged to a project or to enterprise scope.
- **Inline "Ask Flint" entry points**
  - Hovering a folder in the folder tree reveals a sparkle button that opens the chat pre-prompted with *"What do you want to ask Flint about the **&lt;folder&gt;** folder?"*.
  - Hovering a document (in grid, list, or table view) reveals a sparkle button that opens the chat pre-prompted with *"What do you want to ask Flint about the **&lt;DOC-ID — Title&gt;** document?"*.
  - Suggestion chips adapt to the chosen subject (Summarise, Who is responsible, Latest activity, Open issues/holds, Recent changes).

### Multi-project workspace
Four mock projects, themed as a Western Australian mining EPC portfolio: **Marra Ridge Iron Ore Mine**, **Port Hedland Berth 6 Expansion**, **Kwinana Lithium Hydroxide Plant**, **Goldfields Rail Duplication**. Selecting a different project from the top-bar scope picker refreshes the workspace:
- Folder document counts and the document grid reseed per project — each shows a different deterministic mix of documents.
- Selected folder and pagination reset on switch.
- The active project persists in `localStorage` and is read by the Chat scope filtering described above.

## Tech

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide icons
- TanStack React Query + Mock Service Worker (MSW) — mock HTTP API layer standing in for the real backend
- Leaflet + React Leaflet — Dashboard project map view
