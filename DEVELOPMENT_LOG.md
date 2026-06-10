# Flux EDMS â€” Development Log

> **Purpose**: Single reference for future Claude sessions. Read this first. It covers architecture, every completed feature, key decisions, and known constraints.

---

## 1. Project Overview

**Flux** is a React 18 + TypeScript prototype for an Engineering Document Management System (EDMS). It is a frontend-only demo â€” all data is mocked; there is no backend.

| Item | Value |
|---|---|
| Location | `C:\GitHub\flux` |
| Stack | React 18, TypeScript, Vite, Tailwind CSS 3, Framer Motion, Lucide React, React Router v6 |
| Entry point | `src/App.tsx` |
| Port | Vite default (5173) |
| Product name displayed | FusionLive |

---

## 2. Architecture

### 2.1 Route Map

| Path | Component | Notes |
|---|---|---|
| `/` | `Dashboard` | Home / enterprise overview |
| `/documents` | `DocumentBrowser` | Project-scoped doc tree |
| `/search` | `SearchResults` | Global search with `?q=` param |
| `/chat` | `DocumentBrowser` | Placeholder â€” routed to DocumentBrowser |
| `/design-system` | `DesignSystem` | Internal component reference |
| `/packages` | `Packages` | Placeholder |

### 2.2 Context Provider Stack (outer â†’ inner, in `App.tsx`)

```
LocalizationProvider
  WorkspaceProvider
    ClipboardProvider
      ScopeProvider
        SearchProvider          â† added this session
          ShellLayoutProvider
            BrowserRouter
              BrandBanner (global)
              Routes
```

### 2.3 Key Contexts

| Context | File | What it stores |
|---|---|---|
| `ScopeContext` | `src/contexts/ScopeContext.tsx` | Current scope: `{ kind: 'enterprise' }` or `{ kind: 'project', id, name }` |
| `SearchContext` | `src/contexts/SearchContext.tsx` | `lastQuery: string` â€” last executed search term |
| `LocalizationContext` | `src/contexts/LocalizationContext.tsx` | i18n translation function `t()` |
| `ShellLayoutContext` | `src/contexts/ShellLayoutContext.tsx` | `isLeftRailVisible`, `toggleLeftRail` |
| `WorkspaceContext` | `src/contexts/WorkspaceContext.tsx` | Workspace-level state |
| `ClipboardContext` | `src/contexts/ClipboardContext.tsx` | Document clipboard/selection state |

### 2.4 Data Layer

All data is mock â€” no API calls.

| File | Contents |
|---|---|
| `src/data/projects.ts` | **Single source of truth for project names/IDs** â€” import this everywhere |
| `src/data/mockDocuments.ts` | Mock document records (uses `PROJECTS` names) |
| `src/data/mockFolders.ts` | Mock folder tree |
| `src/data/mockPlaceholders.ts` | Mock placeholder records |
| `src/data/mockDashboard.ts` | Dashboard stats, notifications |
| `src/data/searchData.ts` | Builds `searchRecords[]` from mockDocuments + mockPlaceholders |

---

## 3. Key Architectural Decisions

### 3.1 Single Source of Truth â€” Projects

`src/data/projects.ts` exports `PROJECTS` (a `const` array) and `ProjectId` type. All components and mock data import from here. **Never define project names inline anywhere else.**

```ts
export const PROJECTS = [
  { id: 'shard', name: 'The Shard, London' },
  { id: 'skyline', name: 'Skyline' },
  { id: 'tower', name: 'Tower' },
  { id: 'empire', name: 'Empire State' },
] as const;
export type ProjectId = typeof PROJECTS[number]['id'];
```

**Why**: Prior to this, mock data used arbitrary project names ('Refinery Upgrade 2024', 'Safety Compliance 2024', etc.) that never matched the scope dropdown names, so the project workspace badge never appeared on search cards and scope-switching on navigation never worked.

### 3.2 Search Persistence â€” SearchContext

`SearchContext` stores `lastQuery`. `SearchResults` writes to it via `setLastQuery(query)` in a `useEffect`. `LeftRail` reads `lastQuery` and navigates to `/search?q=<lastQuery>` when the Search button is clicked (falls back to `/search` if empty).

**Why**: The LeftRail Search button previously always navigated to bare `/search`, losing the query. A URL-only solution would require reading the URL at click time, which is awkward from LeftRail. Context keeps it clean and in-session (no sessionStorage needed for a prototype).

### 3.3 Scope Switching on Search Navigation

When a user clicks a search result card â†’ `navigate('/documents', { state: { folderId, selectedDocId, projectId, projectName } })` â†’ `DocumentBrowser` reads `location.state` in a `useEffect` â†’ calls `setScope({ kind: 'project', id: projectId, name: projectName })` and pre-selects the folder and document.

This is a `location.state` pattern. When a DB object-URL mapping table exists, replace it with a direct deep-link route resolved from that table.

### 3.4 Dynamic FilterBar â€” Scalable by Design

`SearchResults` uses `countResultsByType(results)` to get a `Record<SearchResultType, number>` map. `filterCategories` is derived dynamically from `Object.entries(counts)` sorted by count descending. Adding a new `SearchResultType` to the data **automatically** causes a new filter pill to appear â€” no code changes needed.

`resultTypeLabels` provides friendly display names; unknown types fall back to capitalised slug.

### 3.5 BrandBanner Scope Dropdown Width

Uses `useLayoutEffect` + `ResizeObserver` to compute width dynamically:

1. A hidden `<span>` (off-screen, `opacity-0`) renders the longest project name to measure its natural pixel width.
2. `ResizeObserver` on `searchContainerRef` re-fires on resize.
3. Width = `Math.min(naturalWidth, searchLeft - dropLeft - 100)` â€” never gets within 100px of the search input.
4. Minimum clamped to 60px.

---

## 4. Component Reference

### `BrandBanner` (`src/components/BrandBanner.tsx`)
- Fixed top bar, `h-[45px]`, `z-[60]`
- Left: toggle rail button + scope dropdown
- Centre: global search input (submits to `/search?q=`)
- Right: notifications bell (badge + hover preview), profile avatar, "FusionLive" label
- Scope dropdown: dynamic width, project search input, `Home` option resets to enterprise scope

### `LeftRail` (`src/components/LeftRail.tsx`)
- Fixed left, `top-[45px]`, `w-[88px]`, `z-20`
- Logo button: navigates to `/` and resets scope to enterprise
- Nav order: **Chat â†’ Search â†’ Documents**
- Documents item: **only rendered when `scope.kind === 'project'`**
- Search button: navigates to `/search?q=<lastQuery>` if `lastQuery` exists
- Bottom: Settings (opens ColorCustomizer popover)

### `SearchResults` (`src/pages/SearchResults.tsx`)
- Route: `/search?q=<query>`
- Header: title + `FilterBar` (inline right, shown only when query + results exist)
- `FilterBar`: dynamic pills from `filterCategories` memo, separator after "All", blue active state
- `SearchResultCard`: compact card with status badge, project workspace badge (`Building2Icon`), amber folder icon link to DocumentBrowser, result type badge
- `EmptySearchState`: shown when no query
- `NoResultsState`: shown when query returns zero results
- Writes `lastQuery` to `SearchContext` on each query change

### `DocumentBrowser` (`src/pages/DocumentBrowser.tsx`)
- Route: `/documents`
- Reads `location.state` on mount to pre-select folder + document and switch scope
- TODO: replace `location.state` navigation with direct deep-link route when DB URL mapping is available

### `Dashboard` (`src/pages/Dashboard.tsx`)
- Route: `/`
- Grid layout with sticky left panel (`sticky top-0`) â€” must be `top-0` not `top-3` to stay top-aligned with right panel
- Resets `selectedSection` to `'overview'` when `scope.kind === 'enterprise'`

---

## 5. Completed Features (Chronological)

| # | Feature | Files Changed |
|---|---|---|
| 1 | Dashboard: white header background on Highlights Overview nav | `Dashboard.tsx` |
| 2 | Dashboard: top-align left panel with right content panel | `Dashboard.tsx` â€” `sticky top-3` â†’ `sticky top-0` |
| 3 | BrandBanner: dynamic scope dropdown width (capped 100px from search input) | `BrandBanner.tsx` |
| 4 | BrandBanner: chevron pushed to far right; project search input replaces "PROJECTS" label | `BrandBanner.tsx` |
| 5 | Logo click resets to enterprise scope | `LeftRail.tsx` |
| 6 | Documents nav item hidden on enterprise scope | `LeftRail.tsx` |
| 7 | Nav order: Chat â†’ Search â†’ Documents | `LeftRail.tsx` |
| 8 | Dashboard: resets to overview when scope switches to enterprise | `Dashboard.tsx` |
| 9 | EDMS filename sanitisation rules documented | `CLAUDE.md` |
| 10 | Search result cards: compact redesign, project workspace badge, amber folder icon link, right margin | `SearchResults.tsx` |
| 11 | Single source of truth for projects | `src/data/projects.ts` (new), `mockDocuments.ts`, `searchData.ts`, `BrandBanner.tsx` |
| 12 | `projectId` + `projectName` on search records for scope-switching on navigation | `search.ts`, `searchData.ts` |
| 13 | DocumentBrowser: reads `location.state` and switches scope on search-card navigation | `DocumentBrowser.tsx` |
| 14 | Search persistence: `SearchContext` + LeftRail Search button uses `lastQuery` | `SearchContext.tsx` (new), `App.tsx`, `LeftRail.tsx`, `SearchResults.tsx` |
| 15 | FilterBar consolidation: removed duplicate stats row, unified dynamic filter pills | `SearchResults.tsx` |

---

## 6. EDMS Filename Sanitisation Rules

These are hard requirements â€” apply to any filename handling, validation, storage, or download logic.

1. **Do not strip** engineering unit symbols for feet (â€²) and inches (â€³).
2. **Recognise** these Unicode workarounds used in engineering filenames:
   - `â€³` (U+2033 Double Prime) â€” inches
   - `''` (two ASCII single quotes, 39Ã—2) â€” inches
   - `"` (U+201D Right Double Quotation Mark) â€” inches
   - `â€²` (U+2032 Single Prime) â€” feet
3. **UTF-8 everywhere**: filename handling, storage, and DB schemas must use strict UTF-8.
4. **Windows-safe conversion**: when preparing files for Windows download, convert blocked OS characters (e.g. true `"` U+0022) to their safe engineering equivalents (`â€³` or `''`) â€” **do not delete them**.
5. **Backend regex**: validation patterns must explicitly allow `â€²`, `â€³`, `'`, and `"` (U+201D).

---

## 7. Known Constraints / TODOs

- `/chat` route currently renders `DocumentBrowser` as a placeholder â€” needs a real chat component.
- `SearchResultCard.handleFolderClick` uses `navigate` with `location.state`. When a DB object-URL mapping table is available, replace with a direct deep-link route (e.g. `/documents/:folderId/:docId`).
- Placeholder records do not carry a `project` field in the current mock schema â€” `project: undefined` in `searchData.ts`. Add when mock data is updated.
- `filterCategories` only includes types present in current results â€” a type with zero results across all data never appears, which is correct behaviour for a dynamic filter.

---

## 8. Style / Colour Conventions

| Token | Value | Usage |
|---|---|---|
| Primary blue | `#0461BA` | Active states, links, badges |
| Primary blue light | `#E8F1FB` | Badge backgrounds, hover states |
| Primary blue dark | `#034f97` | Hover on primary buttons |
| Hover bg | `#F0F4F8` | Button/row hover fill |
| Danger | `#E10613` / `#B30B16` | Notification badge, logo hover border |
| Enterprise scope | `violet-*` | Scope button when enterprise selected |

Fixed shell dimensions:
- Top bar height: `45px`
- Left rail width: `88px`
- Left rail offset CSS var: `--left-rail-width` (88px)
- Main content offset: `mt-[45px]`, `ml-[var(--left-rail-width,88px)]`

---

## 9. API-Handoff Comment Pass (2026-06-09)

Applied the ARCHITECTURE.md marker convention (`[MOCK]` / `[API]` / `[AUTH]` / `[PHASE-N]` / `[TODO-ENG]` / `[TBD]`) across `src/` ahead of the Dev handoff:

- All six `src/data/*` mock files now carry header markers naming their replacement API group (G03/G05/G06/G13/G19) per the Mock -> Real migration table.
- All mock-data consumption points marked: BrandBanner, DocumentBrowser, DocumentDetail, Dashboard, SearchResults, Chat, FilterPanel, `utils/search.ts`, `hooks/useUserPref.ts`.
- All bare `TODO:` comments converted to `[TODO-ENG]` (with `[TBD]` where the endpoint is unconfirmed) - DetailSlidePanel/DocumentBrowser action stubs, FolderTree subscribe/favourite, deep-link notes.
- File-header purpose comments added to DocumentBrowser, Chat, Dashboard, Packages, FilterPanel.
- ScopeContext / WorkspaceContext annotated with the ADR-005 token-exchange note and the consolidation `[TODO-ENG]` (ARCHITECTURE.md open question 6).
- Packages.tsx inline `samplePackages` marked `[MOCK]` -> G08 `[PHASE-2]`.

`npx tsc --noEmit` after the pass shows only the pre-existing warnings listed in CLAUDE.md (Dashboard callable errors moved to ~404/463 due to added headers).

---

## 10. WCAG Quick Wins + Dead-File Cleanup (2026-06-09)

**Deleted:** `src/AppRouter.tsx` (never imported; App.tsx owns the single BrowserRouter) and `src/components/FolderTree_old.tsx` (unreferenced).

**Reduced motion (WCAG 2.3.3):** `<MotionConfig reducedMotion="user">` wraps the app in App.tsx â€” every Framer Motion animation now respects the OS setting. CSS keyframes (`docs-nav-appear`) and transitions suppressed via `prefers-reduced-motion` block in index.css.

**Escape-to-close (WCAG 2.1.2)** added to: BrandBanner (all four menus, shared handler), ClipboardDropdown, DetailSlidePanel (both variants), ColorCustomizer, DocumentBrowser ViewModeDropdown / ColumnHeaderDropdown popover / row action menu + export menu.

**ARIA / labels:** `aria-label` on BrandBanner project search, FolderTree folder search, column filter inputs and triggers (+ `aria-haspopup`/`aria-expanded`), ViewModeDropdown button, sort pills (+ `aria-pressed`), sort-label buttons.

**Other:** `type="button"` on all DetailSlidePanel and column-header buttons; column filter icon gains `focus-visible:opacity-80` so keyboard focus reveals it; FolderTree row actions use `focus-within` (was `focus`, which never fired on the wrapper div).

Verified in browser: Escape closes notifications menu, column filter popover (aria-expanded true->false) and detail panel; no console errors. `tsc --noEmit` shows only the pre-existing warnings (AppRouter/FolderTree_old entries gone).

Still open (larger work): focus trap in drawer dialog, FolderTree role="tree" + arrow keys, text-neutral-400 contrast pass, per-route document.title.

---

## 11. Search White-Page Fix (Flush View) + 1000-Document Mock Data (2026-06-09)

**Bug:** Banner search showed result counts but a white page below â€” only in flush view styles.
**Root cause:** `SearchResults.tsx` tagged its page *header* with `data-component="content-panel"`. The flush height fix in index.css applies `min-height: 100% !important` to content-panel (intended for the main content column on Dashboard/Chat/Packages, where content-panel is flex-1). On the shrink-0 search header it inflated the header to full page height, squeezing the results section to ~4px below the fold inside an overflow-hidden layout. Floating view was unaffected, which is why it went unnoticed.
**Fix:** Header re-tagged `data-component="header-panel"` with a new flush CSS rule (radius/shadow zeroed, no min-height) and a code comment warning against reusing content-panel on shrink-0 headers. Verified in flush+basic and floating: header 70px, results render in both.

**Mock data scale-up:** mockDocuments.ts category generator lengths raised from 367 to exactly 1000 total (each category ~2.7x). IDs stay unique (3-digit padding per category).
**Folder counts now computed:** mockFolders.ts no longer hardcodes `documentCount` â€” counts are derived from mockDocuments per folderId, parents aggregate their subtree. The old literals had already drifted (e.g. folders claiming docs that did not exist); folders with no documents now honestly show 0. The literal counts in the tree are inert placeholders.

Verified: Documents page shows "1000 documents", search for EQUIP returns 63 results and renders, no console errors after reload.

---

## 12. "All Workspaces" Always Lands on Dashboard (2026-06-10)

**Change:** Selecting "All Workspaces" in the top-banner scope dropdown now calls `navigate('/')` alongside `setScope({ kind: 'enterprise' })` (BrandBanner.tsx).

**Why:** There is no all-workspaces documents view â€” customers operate within one project envelope at a time and switch projects via the workspace dropdown. Previously, switching to enterprise scope while on /documents left the user on a dead page (Documents nav hidden, content project-scoped). Enterprise scope is now equivalent to "go Home", matching the existing logo/Home button behaviour.

**Behaviour matrix:** All Workspaces -> always Dashboard. Project selection -> scope changes, user stays on current page.

Verified in browser: from /documents in project scope, selecting All Workspaces lands on / with Documents nav hidden; no console errors. CLAUDE.md scope section updated with the rationale.

---

## 13. WA Mining EPC Re-theme: Per-Project Data + Dashboard Map View (2026-06-10)

**Project rename (full, incl. ids):** shard/skyline/tower/empire -> marra-ridge (Marra Ridge Iron Ore Mine, Pilbara), hedland (Port Hedland Berth 6 Expansion, carries isFluxRefactor), kwinana (Kwinana Lithium Hydroxide Plant), goldfields (Goldfields Rail Duplication, Kalgoorlie). projects.ts entries now carry client / assetType / phase / location for the map. ScopeContext re-validates the persisted scope id against PROJECTS so stale localStorage falls back to enterprise.

**Per-project mock data:** mockDocuments.ts rebuilt as a spec-driven generator â€” each project has its own themed category specs (mine/port/plant/rail) producing 1140/920/1060/840 docs (3960 total). mockFolders.ts rebuilt: shared EPC top-level taxonomy (01 PM -> 08 Handover & Ops), project-specific subfolders, counts computed. New exports mockDocumentsByProject / mockFoldersByProject keyed by ProjectId; flat exports remain as the all-projects union for search.

**DocumentBrowser:** removed the PROJECT_SCALE shuffle hack (it keyed off WorkspaceContext.currentWorkspace, which the banner never updates â€” why all projects looked identical). Now selects tree + documents via ScopeContext scope.id. useWorkspace dropped from this page.

**Chat:** local PROJECTS duplicate deleted â€” now imports from data/projects (closes the earlier [TODO-ENG]); canned conversation scopes remapped to new ids.

**Dashboard Map view:** enterprise-only Widgets/Map toggle (persisted: useUserPref dashboard.view). ProjectMapView.tsx = Leaflet + react-leaflet (new deps) on OSM tiles, divIcon pins (no default marker PNGs). Hover opens clickable popup: project title/Open -> setScope (project dashboard), Documents -> /documents, Flint -> /chat, all project-scoped. Popup stats (doc count, in-review, overdue, unread) derive from the per-project mocks. Map wrapper has relative z-0 so Leaflet panes stay below the top banner. New locale keys dashboard.viewWidgets/viewMap (en-US, fr-FR).

Verified in browser: scope dropdown shows new names; Marra Ridge documents = 1140 with EPC tree; switching to Kwinana on /documents swaps tree (Process/Piping/E&I subfolders) and docs (KW- ids); map shows 4 WA pins; hover popup renders stats; popup Documents click sets scope + lands on /documents; pin Open shows project dashboard. tsc: only pre-existing warnings (Dashboard callable errors now ~408/467).

---

## 14. Map Panel Refinement, Dashboard Crash Fix, Flint Context Chip (2026-06-10)

**Dashboard white-screen fix (was a real bug masquerading as a "pre-existing TS warning"):** in Dashboard.tsx, `todoFiltered.map((t) => ...)` and `toTodoDetail(t: TodoItem)` shadowed the `t()` translation function, then called `t(''statuses.overdue'')` on a TodoItem â€” a runtime TypeError that unmounted the whole React tree (no error boundary) whenever the To Do section rendered. Params renamed to `todo`; the TS2349 errors are gone from tsc. All 11 Highlights-overview paths verified working (4 stat tiles, 3 View-all links, 4 left-list sections, plus todo-row -> detail panel). Rule: never name a callback param `t`.

**Map layout:** map now renders inside the content panel only â€” left section list stays visible. Widgets/Map toggle moved to the top-LEFT of the panel toolbar; an expand/collapse button (top-right, Maximize2/Minimize2) maximises the map over the full dashboard area and back (transient useState, not persisted). Selecting a section from the left list switches back to widgets. Maximised state resets on any scope change.

**Flint context:** map pin Flint now navigates with `?ask=<project name>&askKind=project` (matching the existing folder/document entry points). Chat.tsx shows a context chip on the empty state â€” kind icon (building/folder/file) + "Context: <label>" + project scope when relevant. Marker comments in Chat.tsx and ProjectMapView.tsx document the future G29 payload shape ({ scope: { wsId }, context: { type, id } }) and note labels must become object IDs when wired. New locale keys: chat.contextLabel, dashboard.expandMap/collapseMap (en-US, fr-FR).

Verified in browser: toggle renders inside panel top-left; map 560px wide beside the section list, 848px maximised, collapse restores; pin Flint -> /chat?ask=Goldfields...&askKind=project with visible chip; folder chat button -> chip shows "02 Engineering Â· Goldfields Rail Duplication"; no new console errors.


---

## 15. DocumentBrowser Split-Panel Drag Resize (2026-06-10)

**Feature:** The DetailSlidePanel in split view is now drag-resizable. A `GripVerticalIcon` handle sits at the left edge of the panel wrapper (`cursor-col-resize`, same pattern as the Chat history sidebar). Dragging recalculates width from `window.innerWidth - e.clientX`. Width persisted via `useUserPref('docBrowser.panelWidth', 360)` (default 360 px, min 260 px, max 640 px) — localStorage now, Oracle preferences API when wired (same G02 endpoint as other prefs).

**Files changed:** `src/pages/DocumentBrowser.tsx` — added `GripVerticalIcon` + `useUserPref` imports; added `panelWidth`/`setPanelWidth` state, `panelResizingRef`, document-level `mousemove`/`mouseup` resize handlers, `startPanelResize()` callback; replaced fixed `w-[360px] shrink-0` wrapper with dynamic `style={{ width: panelWidth }}` flex wrapper containing the grip div and a `flex-1 min-w-0` inner div for the panel itself.

**CLAUDE.md updated:** `useUserPref` table gains `docBrowser.panelWidth` row; Detail Panel split-layout section updated to document the resize handle.
