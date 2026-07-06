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

---

## 16. Dashboard Map View Available in Project Scope (2026-06-10)

**Change (made by Oliver, documented retrospectively):** the Widgets/Map toggle is no longer enterprise-only — it renders in project scope too. `ProjectMapView` gained a `focusedProjectId` prop:

- `null` (enterprise) — all four pins, `fitBounds` to the WA extent (unchanged behaviour).
- a project id (Dashboard passes `scope.id` when `scope.kind === 'project'`) — only that project's pin renders, an inner `MapViewportController` (uses `useMap`) animates `setView` to the pin at zoom 8, and the pin's popup auto-opens via a marker ref.

**Dashboard.tsx:** the scope-change effect no longer forces the view back to widgets — it only resets the transient `mapExpanded` (and resets the section to overview on enterprise). The persisted `dashboard.view` pref therefore survives scope switches, so a user who prefers the map keeps it when moving between workspaces. Expand/collapse and the "select a section returns to widgets" rule are unchanged.

**Docs updated:** CLAUDE.md map section retitled "(both scopes)" + `focusedProjectId` behaviour documented; `dashboard.view` added to the useUserPref table; stale "enterprise Dashboard map" header comment in ProjectMapView.tsx rewritten. (§13's "enterprise-only" wording reflects the state at that time.)

---

## 17. Column Chooser: Done Button Removed, Standard Dismissal Added (2026-06-10)

**Rationale:** the Show Columns popover applies checkbox changes immediately, so the solid-blue "Done" button was a confirm button confirming nothing — and it was also the popover's only dismissal path (no outside-click or Escape handling, unlike every other popup on the page).

**Change (DocumentBrowser.tsx):** Done button removed. `showColumnChooser` state moved up beside the other dropdown state; new `columnChooserRef` on the chooser wrapper, wired into the existing shared outside-click + Escape effect (same one that closes the row-action menu and export dropdown — WCAG 2.1.2).

**Type-error cleanup (from the §16 map change, surfaced by tsc):** `ProjectMapView.projectsToRender` memo typed `readonly Project[]` (PROJECTS is readonly); Dashboard's two `focusedProjectId={scope.id}` sites cast `scope.id as ProjectId` — safe because ScopeContext validates persisted ids against PROJECTS on load (ChatScope.id stays `string` to avoid a wide ripple; revisit if ScopeContext/WorkspaceContext are consolidated).

Verified in browser: chooser opens with 7 column checkboxes, no Done button; Escape closes; outside mousedown closes; checkbox toggles still apply live (header count 9 -> 7 -> 9). tsc: only the known pre-existing warnings remain.

**Known deviations (unchanged):** the chooser popover is `absolute`-positioned rather than createPortal (works because the toolbar isn't inside a clipping stacking context); "Show Columns" label is hardcoded English, not via t().

---

## 18. Unified Panel Resize Handles (2026-06-10)

**Problem (user-reported):** the two separators in the document browser split view looked inconsistent — the tree↔grid separator was a clean 16px gap with a barely-visible drag line ON the island edge and no grip affordance (and its width was transient useState, not persisted); the grid↔properties separator was an 8px grip strip INSIDE the panel wrapper on top of the gap, with the line offset toward the grid.

**Fix:** new shared `src/components/PanelResizeHandle.tsx` — renders inside the 16px `browser-layout` gap (absolute `-left-4`/`-right-4` off the host island, `w-4`): faint centred 1px line + small always-visible grip pill (white, bordered, GripVerticalIcon); hover/drag turns line, pill border and icon brand blue. Used by both `CollapsibleFilterPanel` (side="right") and the DocumentBrowser detail-panel wrapper (side="left"). aria: `role="separator"` + new `panel.resize` locale key (en-US, fr-FR).

**Also:** `CollapsibleFilterPanel` width now persists via `useUserPref('docBrowser.treeWidth', 320)` — previously transient `useState`, inconsistent with `docBrowser.panelWidth`. The detail-panel wrapper simplified (handle no longer occupies flex space, so `panelWidth` is now the true panel width).

Verified in browser: both handles render with centred line + visible grip pill; dragging the right handle 360→476 and the left 320→408 works; widths persist to localStorage and restore after reload; tsc and console clean. Known pre-existing quirk: the tree island animates width via Framer Motion, so it trails the cursor slightly during drag (was the case before this change).

---

## 19. Map Hybrid (Satellite) Basemap (2026-06-14)

**Feature:** ProjectMapView gained a Map / Hybrid basemap toggle (in-map segmented control, top-right, persisted via `useUserPref('dashboard.mapBasemap', 'map')`).

- `map` (default) — OSM standard raster, as before.
- `hybrid` — Esri World Imagery satellite base + two transparent Esri reference overlays on top: `World_Transportation` (roads) and `World_Boundaries_and_Places` (place/city labels). Rendered bottom→top with explicit `zIndex` 1/2/3; distinct React keys force a clean layer swap when toggling. All tile sources are free and require NO API key. URLs centralised in the `TILE_LAYERS` constant.

**Why Esri overlays rather than "transparent OSM":** the request was for transparent OSM roads/labels over satellite, but no free, key-free transparent OSM roads+labels overlay exists (Stadia/Stamen, Thunderforest, MapTiler all need keys now). Esri's reference layers are the standard free substitute and give the identical roads+labels-on-imagery result. Documented in the component header + CLAUDE.md as a swap point if strictly-OSM data is ever required.

**Implementation notes:** the component now wraps `MapContainer` in a `relative h-full w-full` div; the toggle is a DOM sibling of the map (not a child) so wheel/click events never reach Leaflet's map handlers. `z-[1000]` puts it above Leaflet panes while the page-level `relative z-0` wrapper still contains it under the top banner (z-60). New locale keys `dashboard.basemapToggle/basemapMap/basemapHybrid` (en-US, fr-FR).

Verified in browser (DOM-level): Map mode loads only OSM tiles; Hybrid loads exactly the three Esri services (World_Imagery + World_Transportation + World_Boundaries_and_Places) and drops OSM; all 60 tiles load with no failed requests; toggle aria-pressed states correct; pref persists and the layer set swaps cleanly both directions. tsc + console clean (only pre-existing warnings). NB: preview_screenshot times out encoding the satellite imagery — a screenshot-tool limit, not a page hang (eval stays responsive, tiles confirmed painted).

---

## 20. Map Right-Click "Copy Coordinates" (2026-06-14)

**Feature:** right-clicking anywhere on the dashboard map opens a small menu showing that point's `lat, lng` (6 decimal places) with a Copy action.

**Implementation (ProjectMapView.tsx):** new `MapContextMenuController` child uses `useMapEvents` to handle Leaflet's `contextmenu` event — `e.originalEvent.preventDefault()` suppresses the native browser menu, then it lifts `{ x, y, lat, lng }` to parent state (`x/y` from `e.containerPoint`, clamped to the map size so the menu stays in-bounds). The menu renders as an absolutely-positioned sibling of `MapContainer` (`z-[1100]`, above the basemap toggle, still under the banner via the page `relative z-0` wrapper). Copy uses `navigator.clipboard.writeText` with a hidden-textarea + `execCommand('copy')` fallback for non-secure contexts; shows a "Copied!" check state then auto-closes ~900ms. Dismissed by Escape / outside-click (a `useEffect` that attaches document listeners only while open) or any map interaction (`movestart`/`zoomstart`/`click` handled in the controller). Works in both basemaps. New locale keys `dashboard.copyCoords/coordsCopied` (en-US, fr-FR). State is transient (not persisted).

Verified in browser (DOM-level): right-click at map centre opens the menu with correct WA coords (e.g. -26.6, 118.5); clicking Copy shows "Copied!" and the menu auto-closes; Escape closes; a left map-click closes; the native contextmenu event is `defaultPrevented`. tsc + console clean (only pre-existing warnings). Clipboard content can't be read back in the headless preview (read blocked) — write path exercised, "Copied!" state confirms the handler ran.

---

## 21. Global Density System + Document List Interaction + Grid/Table Polish (2026-07-06)

**Global density preference (Compact / Comfortable; default Compact).** New `src/contexts/DensityContext.tsx` (backed by `useUserPref('ui.density')`, Oracle TODO inherited) reflects the choice onto `html[data-density]`, mirroring the `data-appearance` / `data-view` pattern. `index.css` defines a density CSS-var scale in `:root` (`--cell-pad-y/x`, `--row-text`, `--row-icon`, `--row-btn`, `--grid-gap`, `--card-pad`, `--list-pad-y`, `--folder-pad-y`, `--checkbox-size`) with a `html[data-density='compact']` override, so one toggle re-flows every list/grid surface. Compact holds the WCAG 2.2 AA 24px Target Size (Minimum, 2.5.8) floor: table rows ~29px, comfortable ~41px; visual row height is decoupled from hit-target size (full-row click target + >=24px icon-button hit areas via `--row-btn`).

**Density control lives in the view-options dropdown** (`ViewModeDropdown` in DocumentBrowser), labelled "Comfy Table" / "Compact Table" — NOT in ColorCustomizer (was briefly there, moved out per user). The old local `compact-table` viewMode was removed; view modes are now just grid / list / table, and the table reads density from CSS vars. This also fixed a latent bug where the old compact mode silently dropped `text-neutral-500 / font-medium` styling on several columns. `.doc-table` and `.folder-row` CSS rules drive cell/row padding + text size from the vars.

**Document-row interaction model (table).** A keyboard cursor (`activeDocId`, blue inset ring) is kept distinct from the checked set (`selectedDocumentIds`):
- Click a row body toggles that row's checkbox (add/remove) and sets the range anchor.
- The Reference link opens the properties panel and never toggles (stopPropagation); action buttons unchanged.
- Ctrl/Cmd+A selects all filtered docs; Up/Down move the cursor (scroll into view); Shift+click and Shift+Up/Down extend a contiguous range; Space toggles the cursor row.
- Container is `tabIndex=0` with a keydown handler that ignores form fields and lets a focused button keep Space. `navigableDocs` memo = visible order (respects grouping + collapsed groups). Selection checkbox is density-sized (`--checkbox-size`: 20px comfy / 16px compact — under 24px but conforming via the 2.5.8 spacing exception, as it already was at 20px).

**Grid preview collapse fix.** Card previews (`aspect-video`, height derived from width) vanished when the content panel was narrow because the grid used viewport breakpoints (`grid-cols-1 md:2 lg:3 xl:4`) — a tiny panel forced 1 column of ~0px width -> 0-height images. Grid now sizes columns by available space: `grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`. Cards keep a usable min width (previews always render; the existing synced horizontal scrollbar handles overflow) and large monitors get more columns automatically.

**Filetype icons in table rows.** `getFileTypeIcon` is now exported from `DocumentCard.tsx` and reused in the DocumentBrowser table `id` column, so each Reference shows the same filetype cue as the grid cards.

Verified in browser (DOM-level, multiple widths): density toggle re-flows table + folder tree (compact 29px / comfy 41px rows, folder 30px); all row interactions behave (toggle, reference-opens-panel, Ctrl+A=all, arrows move cursor, Space toggles, Shift+click / Shift+Arrow range); grid previews render at 442px (219x122, scrolls) and 1440px (4 cols, 226x126); table Reference cells show the filetype icon. No console errors / no Vite overlay.
