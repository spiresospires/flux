# Flux EDMS — Development Log

> **Purpose**: Session-by-session development log. Sections 1–8 are kept current
> (last sanitised 2026-07-07); sections 9+ are dated entries recording the state
> at the time they were written. For the authoritative architecture reference see
> **ARCHITECTURE.md** (API contracts, ADRs) and **CLAUDE.md** (working conventions).

---

## 1. Project Overview

**Flux** is a React 18 + TypeScript prototype for an Engineering Document Management System (EDMS). Server data flows over HTTP through React Query hooks against the documented FusionLive API contracts (G03 workspaces, G05 folders, G06 documents, G19 search, `/user/briefcase`); in the prototype those requests are answered by an MSW mock backend (`src/mocks/`) serving the mock datasets. Set `VITE_API_MODE=real` + `VITE_API_BASE_URL` to point at a real backend — no component changes.

| Item | Value |
|---|---|
| Location | repo root (originally `C:\GitHub\flux` on the first dev machine) |
| Stack | React 18, TypeScript, Vite, Tailwind CSS 3, Framer Motion, Lucide React, React Router v6, TanStack React Query v5, MSW |
| Entry point | `src/index.tsx` (starts MSW, then renders `src/App.tsx`) |
| Port | Vite default (5173) |
| Product name displayed | FusionLive |

---

## 2. Architecture

### 2.1 Route Map

| Path | Component | Notes |
|---|---|---|
| `/` | `Dashboard` | Home / enterprise overview |
| `/documents` | `DocumentBrowser` | Project-scoped doc tree; deep-linkable via `?ws=&folder=&doc=` |
| `/search` | `SearchResults` | Global search with `?q=` param |
| `/chat` | `Chat` | Flint AI assistant |
| `/briefcase` | `MyBriefcase` | User-scoped cross-workspace briefcase |
| `/design-system` | `DesignSystem` | Internal component reference |
| `/admin/distribution` | `AutomaticDistribution` | Permission-gated (`ad.view`/`ad.manage`), project scope; tab in `?tab=` param |
| `/admin/workgroups` | `Workgroups` | Read-only workgroup list; same gating |
| `/packages` | `Packages` | Placeholder |

### 2.2 Context Provider Stack (outer → inner, in `App.tsx`)

```
QueryClientProvider (React Query — all server state)
  LocalizationProvider
    ClipboardProvider
      BriefcaseProvider
        ScopeProvider
          ViewStyleProvider
            DensityProvider
              SearchProvider
                PermissionProvider
                  ShellLayoutProvider
                    BrowserRouter
                      BrandBanner (global)
                      Routes
```

### 2.3 Key Contexts

| Context | File | What it stores |
|---|---|---|
| `ScopeContext` | `src/contexts/ScopeContext.tsx` | Current scope: `{ kind: 'enterprise' }` or `{ kind: 'project', id, name }`. Single source of workspace scope (`WorkspaceContext` was consolidated into it, 2026-07-06) |
| `SearchContext` | `src/contexts/SearchContext.tsx` | `lastQuery: string` — last executed search term |
| `LocalizationContext` | `src/contexts/LocalizationContext.tsx` | i18n translation function `t()` |
| `ShellLayoutContext` | `src/contexts/ShellLayoutContext.tsx` | `isLeftRailVisible`, `toggleLeftRail` |
| `ViewStyleContext` | `src/contexts/ViewStyleContext.tsx` | Appearance (`light`/`dark`/`basic`) + layout (`floating`/`flush`) |
| `DensityContext` | `src/contexts/DensityContext.tsx` | Global density (`compact`/`comfortable`) → `html[data-density]` |
| `ClipboardContext` | `src/contexts/ClipboardContext.tsx` | Document clipboard/selection state |
| `BriefcaseContext` | `src/contexts/BriefcaseContext.tsx` | Adapter over React Query for the user-scoped briefcase (`/user/briefcase` via MSW) — stable `useBriefcase()` interface, optimistic mutations |
| `PermissionContext` | `src/contexts/PermissionContext.tsx` | FLUX's first permission concept: `hasPermission('ad.manage'/'ad.view')`. [MOCK] backed by `useUserPref('dev.adPermission')` + demo switcher in the profile menu |

### 2.4 Data Layer

Server data is fetched over HTTP and cached by React Query; the mock datasets are served through the real API contracts by MSW.

| Layer | Files | Contents |
|---|---|---|
| API client | `src/api/` | Typed fetch client (RFC 7807 `ApiError`), endpoint modules (workspaces/folders/documents/search/briefcase/distribution), `queryKeys.ts`, `queryClient.ts` |
| Hooks | `src/hooks/` | `useWorkspaces`, `useFolderTree`, `useDocuments` (cursor-paginated infinite), `useSearch`, `useDistribution.ts` (rule set/settings/workgroups/users + rule mutations) |
| Mock backend | `src/mocks/handlers.ts` | MSW handlers: keyset cursors (ADR-011), server-side filter/sort, facet aggregations, briefcase store, AD rule-set store (`flux.ad.<wsId>`), 350 ms latency |
| Mock datasets | `src/data/` | `projects.ts` (single source of project names/IDs), `mockDocuments.ts`, `mockFolders.ts`, `mockPlaceholders.ts`, `mockDashboard.ts`, `searchData.ts`, `briefcaseSeed.ts`, `distributionSeed.ts`, `workgroupsSeed.ts` — consumed by the MSW handlers; Dashboard/Chat/BrandBanner/DocumentDetail still import some directly (migration pending) |

---

## 3. Key Architectural Decisions

### 3.1 Single Source of Truth — Projects

`src/data/projects.ts` exports `PROJECTS` (a `const` array) and `ProjectId` type. All components and mock data import from here. **Never define project names inline anywhere else.**

```ts
// Current ids after the WA mining re-theme (§13); each entry also carries
// client / assetType / phase / location for the map view.
export const PROJECTS = [
  { id: 'marra-ridge', name: 'Marra Ridge Iron Ore Mine' /* … */ },
  { id: 'hedland', name: 'Port Hedland Berth 6 Expansion' /* … */ },
  { id: 'kwinana', name: 'Kwinana Lithium Hydroxide Plant' /* … */ },
  { id: 'goldfields', name: 'Goldfields Rail Duplication' /* … */ },
] as const;
export type ProjectId = typeof PROJECTS[number]['id'];
```

In the UI this list now arrives via `useWorkspaces()` (G03 over HTTP); `PROJECTS` remains the seed the MSW handler serves.

**Why**: Prior to this, mock data used arbitrary project names ('Refinery Upgrade 2024', 'Safety Compliance 2024', etc.) that never matched the scope dropdown names, so the project workspace badge never appeared on search cards and scope-switching on navigation never worked.

### 3.2 Search Persistence — SearchContext

`SearchContext` stores `lastQuery`. `SearchResults` writes to it via `setLastQuery(query)` in a `useEffect`. `LeftRail` reads `lastQuery` and navigates to `/search?q=<lastQuery>` when the Search button is clicked (falls back to `/search` if empty).

**Why**: The LeftRail Search button previously always navigated to bare `/search`, losing the query. A URL-only solution would require reading the URL at click time, which is awkward from LeftRail. Context keeps it clean and in-session (no sessionStorage needed for a prototype).

### 3.3 Scope Switching on Search Navigation

When a user clicks a search result card → `navigate('/documents', { state: { folderId, selectedDocId, projectId, projectName } })` → `DocumentBrowser` reads `location.state` in a `useEffect` → calls `setScope({ kind: 'project', id: projectId, name: projectName })` and pre-selects the folder and document.

**Superseded (2026-07-06, §22):** navigation now uses URL params — `/documents?ws=<wsId>&folder=<folderId>&doc=<docId>`. The URL is the source of truth (validated against loaded data), so links are shareable, survive refresh, and open correctly in a second browser window (ADR-010 multi-window).

### 3.4 Dynamic FilterBar — Scalable by Design

`SearchResults` uses `countResultsByType(results)` to get a `Record<SearchResultType, number>` map. `filterCategories` is derived dynamically from `Object.entries(counts)` sorted by count descending. Adding a new `SearchResultType` to the data **automatically** causes a new filter pill to appear — no code changes needed.

`resultTypeLabels` provides friendly display names; unknown types fall back to capitalised slug.

### 3.5 BrandBanner Scope Dropdown Width

Uses `useLayoutEffect` + `ResizeObserver` to compute width dynamically:

1. A hidden `<span>` (off-screen, `opacity-0`) renders the longest project name to measure its natural pixel width.
2. `ResizeObserver` on `searchContainerRef` re-fires on resize.
3. Width = `Math.min(naturalWidth, searchLeft - dropLeft - 100)` — never gets within 100px of the search input.
4. Minimum clamped to 60px.

---

## 4. Component Reference

### `BrandBanner` (`src/components/BrandBanner.tsx`)
- Fixed top bar, `h-[60px]`, `z-[60]`
- Left: toggle rail button + scope dropdown
- Centre: global search input (submits to `/search?q=`)
- Right: notifications bell (badge + hover preview), profile avatar, "FusionLive" label
- Scope dropdown: dynamic width, project search input, `Home` option resets to enterprise scope

### `LeftRail` (`src/components/LeftRail.tsx`)
- Fixed left, `top-[60px]`, `w-[88px]`, `z-20`
- Logo button: navigates to `/` and resets scope to enterprise
- Nav order: **Dashboard → Briefcase → Flint (Chat) → Search → Documents**
- Documents item: **only rendered when `scope.kind === 'project'`**; Briefcase always visible (user-scoped), with live counter badge
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
- Route: `/documents?ws=&folder=&doc=` — selection derives from (and writes back to) URL params, validated against loaded data
- Folder tree (G05) + documents (G06, cursor-paginated infinite scroll) over HTTP via `useFolderTree`/`useDocuments`; folder scope, status/type filters and sort are server-side
- `?doc=` resolves through `GET /documents/{docId}` and opens the properties panel even when the row isn't in the loaded pages

### `Dashboard` (`src/pages/Dashboard.tsx`)
- Route: `/`
- Grid layout with sticky left panel (`sticky top-0`) — must be `top-0` not `top-3` to stay top-aligned with right panel
- Resets `selectedSection` to `'overview'` when `scope.kind === 'enterprise'`

---

## 5. Completed Features (Chronological)

| # | Feature | Files Changed |
|---|---|---|
| 1 | Dashboard: white header background on Highlights Overview nav | `Dashboard.tsx` |
| 2 | Dashboard: top-align left panel with right content panel | `Dashboard.tsx` — `sticky top-3` → `sticky top-0` |
| 3 | BrandBanner: dynamic scope dropdown width (capped 100px from search input) | `BrandBanner.tsx` |
| 4 | BrandBanner: chevron pushed to far right; project search input replaces "PROJECTS" label | `BrandBanner.tsx` |
| 5 | Logo click resets to enterprise scope | `LeftRail.tsx` |
| 6 | Documents nav item hidden on enterprise scope | `LeftRail.tsx` |
| 7 | Nav order: Chat → Search → Documents | `LeftRail.tsx` |
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

These are hard requirements — apply to any filename handling, validation, storage, or download logic.

1. **Do not strip** engineering unit symbols for feet (′) and inches (″).
2. **Recognise** these Unicode workarounds used in engineering filenames:
   - `″` (U+2033 Double Prime) — inches
   - `''` (two ASCII single quotes, 39×2) — inches
   - `"` (U+201D Right Double Quotation Mark) — inches
   - `′` (U+2032 Single Prime) — feet
3. **UTF-8 everywhere**: filename handling, storage, and DB schemas must use strict UTF-8.
4. **Windows-safe conversion**: when preparing files for Windows download, convert blocked OS characters (e.g. true `"` U+0022) to their safe engineering equivalents (`″` or `''`) — **do not delete them**.
5. **Backend regex**: validation patterns must explicitly allow `′`, `″`, `'`, and `"` (U+201D).

---

## 7. Known Constraints / TODOs

- ~~`/chat` placeholder~~ — done: `/chat` renders the Flint `Chat` page. The real G29 SSE streaming contract is specified in ARCHITECTURE.md but the reply is still a canned `setTimeout` mock.
- ~~`location.state` navigation~~ — done (2026-07-06): search→browser navigation uses URL params (`?ws=&folder=&doc=`).
- Placeholder records do not carry a `project` field in the current mock schema — `project: undefined` in `searchData.ts`. Add when mock data is updated.
- `filterCategories` only includes types present in current results — now driven by the server's G19 `aggregations` (computed over the full result set, stable while a type tab is active).
- Dashboard, Chat, BrandBanner, DocumentDetail and ProjectMapView still import mock datasets directly — remaining migration to the React Query hooks.

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
- Top bar height: `60px`
- Left rail width: `88px`
- Left rail offset CSS var: `--left-rail-width` (88px)
- Main content offset: `mt-[60px]`, `ml-[var(--left-rail-width,88px)]`

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

**Reduced motion (WCAG 2.3.3):** `<MotionConfig reducedMotion="user">` wraps the app in App.tsx — every Framer Motion animation now respects the OS setting. CSS keyframes (`docs-nav-appear`) and transitions suppressed via `prefers-reduced-motion` block in index.css.

**Escape-to-close (WCAG 2.1.2)** added to: BrandBanner (all four menus, shared handler), ClipboardDropdown, DetailSlidePanel (both variants), ColorCustomizer, DocumentBrowser ViewModeDropdown / ColumnHeaderDropdown popover / row action menu + export menu.

**ARIA / labels:** `aria-label` on BrandBanner project search, FolderTree folder search, column filter inputs and triggers (+ `aria-haspopup`/`aria-expanded`), ViewModeDropdown button, sort pills (+ `aria-pressed`), sort-label buttons.

**Other:** `type="button"` on all DetailSlidePanel and column-header buttons; column filter icon gains `focus-visible:opacity-80` so keyboard focus reveals it; FolderTree row actions use `focus-within` (was `focus`, which never fired on the wrapper div).

Verified in browser: Escape closes notifications menu, column filter popover (aria-expanded true->false) and detail panel; no console errors. `tsc --noEmit` shows only the pre-existing warnings (AppRouter/FolderTree_old entries gone).

Still open (larger work): focus trap in drawer dialog, FolderTree role="tree" + arrow keys, text-neutral-400 contrast pass, per-route document.title.

---

## 11. Search White-Page Fix (Flush View) + 1000-Document Mock Data (2026-06-09)

**Bug:** Banner search showed result counts but a white page below — only in flush view styles.
**Root cause:** `SearchResults.tsx` tagged its page *header* with `data-component="content-panel"`. The flush height fix in index.css applies `min-height: 100% !important` to content-panel (intended for the main content column on Dashboard/Chat/Packages, where content-panel is flex-1). On the shrink-0 search header it inflated the header to full page height, squeezing the results section to ~4px below the fold inside an overflow-hidden layout. Floating view was unaffected, which is why it went unnoticed.
**Fix:** Header re-tagged `data-component="header-panel"` with a new flush CSS rule (radius/shadow zeroed, no min-height) and a code comment warning against reusing content-panel on shrink-0 headers. Verified in flush+basic and floating: header 70px, results render in both.

**Mock data scale-up:** mockDocuments.ts category generator lengths raised from 367 to exactly 1000 total (each category ~2.7x). IDs stay unique (3-digit padding per category).
**Folder counts now computed:** mockFolders.ts no longer hardcodes `documentCount` — counts are derived from mockDocuments per folderId, parents aggregate their subtree. The old literals had already drifted (e.g. folders claiming docs that did not exist); folders with no documents now honestly show 0. The literal counts in the tree are inert placeholders.

Verified: Documents page shows "1000 documents", search for EQUIP returns 63 results and renders, no console errors after reload.

---

## 12. "All Workspaces" Always Lands on Dashboard (2026-06-10)

**Change:** Selecting "All Workspaces" in the top-banner scope dropdown now calls `navigate('/')` alongside `setScope({ kind: 'enterprise' })` (BrandBanner.tsx).

**Why:** There is no all-workspaces documents view — customers operate within one project envelope at a time and switch projects via the workspace dropdown. Previously, switching to enterprise scope while on /documents left the user on a dead page (Documents nav hidden, content project-scoped). Enterprise scope is now equivalent to "go Home", matching the existing logo/Home button behaviour.

**Behaviour matrix:** All Workspaces -> always Dashboard. Project selection -> scope changes, user stays on current page.

Verified in browser: from /documents in project scope, selecting All Workspaces lands on / with Documents nav hidden; no console errors. CLAUDE.md scope section updated with the rationale.

---

## 13. WA Mining EPC Re-theme: Per-Project Data + Dashboard Map View (2026-06-10)

**Project rename (full, incl. ids):** shard/skyline/tower/empire -> marra-ridge (Marra Ridge Iron Ore Mine, Pilbara), hedland (Port Hedland Berth 6 Expansion, carries isFluxRefactor), kwinana (Kwinana Lithium Hydroxide Plant), goldfields (Goldfields Rail Duplication, Kalgoorlie). projects.ts entries now carry client / assetType / phase / location for the map. ScopeContext re-validates the persisted scope id against PROJECTS so stale localStorage falls back to enterprise.

**Per-project mock data:** mockDocuments.ts rebuilt as a spec-driven generator — each project has its own themed category specs (mine/port/plant/rail) producing 1140/920/1060/840 docs (3960 total). mockFolders.ts rebuilt: shared EPC top-level taxonomy (01 PM -> 08 Handover & Ops), project-specific subfolders, counts computed. New exports mockDocumentsByProject / mockFoldersByProject keyed by ProjectId; flat exports remain as the all-projects union for search.

**DocumentBrowser:** removed the PROJECT_SCALE shuffle hack (it keyed off WorkspaceContext.currentWorkspace, which the banner never updates — why all projects looked identical). Now selects tree + documents via ScopeContext scope.id. useWorkspace dropped from this page.

**Chat:** local PROJECTS duplicate deleted — now imports from data/projects (closes the earlier [TODO-ENG]); canned conversation scopes remapped to new ids.

**Dashboard Map view:** enterprise-only Widgets/Map toggle (persisted: useUserPref dashboard.view). ProjectMapView.tsx = Leaflet + react-leaflet (new deps) on OSM tiles, divIcon pins (no default marker PNGs). Hover opens clickable popup: project title/Open -> setScope (project dashboard), Documents -> /documents, Flint -> /chat, all project-scoped. Popup stats (doc count, in-review, overdue, unread) derive from the per-project mocks. Map wrapper has relative z-0 so Leaflet panes stay below the top banner. New locale keys dashboard.viewWidgets/viewMap (en-US, fr-FR).

Verified in browser: scope dropdown shows new names; Marra Ridge documents = 1140 with EPC tree; switching to Kwinana on /documents swaps tree (Process/Piping/E&I subfolders) and docs (KW- ids); map shows 4 WA pins; hover popup renders stats; popup Documents click sets scope + lands on /documents; pin Open shows project dashboard. tsc: only pre-existing warnings (Dashboard callable errors now ~408/467).

---

## 14. Map Panel Refinement, Dashboard Crash Fix, Flint Context Chip (2026-06-10)

**Dashboard white-screen fix (was a real bug masquerading as a "pre-existing TS warning"):** in Dashboard.tsx, `todoFiltered.map((t) => ...)` and `toTodoDetail(t: TodoItem)` shadowed the `t()` translation function, then called `t(''statuses.overdue'')` on a TodoItem — a runtime TypeError that unmounted the whole React tree (no error boundary) whenever the To Do section rendered. Params renamed to `todo`; the TS2349 errors are gone from tsc. All 11 Highlights-overview paths verified working (4 stat tiles, 3 View-all links, 4 left-list sections, plus todo-row -> detail panel). Rule: never name a callback param `t`.

**Map layout:** map now renders inside the content panel only — left section list stays visible. Widgets/Map toggle moved to the top-LEFT of the panel toolbar; an expand/collapse button (top-right, Maximize2/Minimize2) maximises the map over the full dashboard area and back (transient useState, not persisted). Selecting a section from the left list switches back to widgets. Maximised state resets on any scope change.

**Flint context:** map pin Flint now navigates with `?ask=<project name>&askKind=project` (matching the existing folder/document entry points). Chat.tsx shows a context chip on the empty state — kind icon (building/folder/file) + "Context: <label>" + project scope when relevant. Marker comments in Chat.tsx and ProjectMapView.tsx document the future G29 payload shape ({ scope: { wsId }, context: { type, id } }) and note labels must become object IDs when wired. New locale keys: chat.contextLabel, dashboard.expandMap/collapseMap (en-US, fr-FR).

Verified in browser: toggle renders inside panel top-left; map 560px wide beside the section list, 848px maximised, collapse restores; pin Flint -> /chat?ask=Goldfields...&askKind=project with visible chip; folder chat button -> chip shows "02 Engineering · Goldfields Rail Duplication"; no new console errors.


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

---

## 22. HTTP Data Layer Merge, Briefcase API Wiring, Docs Sanitise (2026-07-07)

**Merge (cae7ec8):** §21's density/row-interaction/briefcase work was developed in parallel with the React Query + MSW data layer (ce5e92d..cb9297e) and merged with the principle *his UI wins, our data layer carries it*. DocumentBrowser now serves folder scope/status/type filters, sort and cursor pagination (ADR-011) from the MSW mock backend while keeping the §21 interaction model; the Reference link routes through `openDocumentPanel` so `?doc=` stays on the URL; `viewMode` is `grid | list | table` with density from CSS vars; the resurrected `sortBy` state was dropped again (server-side).

**Briefcase onto the data layer:** `BriefcaseContext` keeps its stable `useBriefcase()` interface (nine consumer files untouched) but its internals are now React Query: `GET/POST/PATCH/DELETE /user/briefcase` (`src/api/briefcase.ts`) with optimistic mutations (instant toggle, rollback on error, invalidate on settle). The MSW handlers own the seed and persist to the same `flux.briefcase` localStorage key the old context used, so existing demo briefcases carry over. Workspace identity resolves via `useWorkspaces()` (G03) instead of the static `PROJECTS` import. The endpoint is user-scoped, NOT workspace-scoped — `[TODO-ENG]` confirm the API group (suggested G02, alongside `/user/preferences`).

**Docs sanitised:** repaired CP1252 mojibake throughout this file (51 sequences — em dashes, arrows, prime marks); refreshed §1–8 to current truth (route map, provider stack, contexts table, HTTP data layer, 60px banner, nav order); marked §3.3 and the §7 TODOs superseded where the work landed; ARCHITECTURE.md, CLAUDE.md, BRIEFCASE_PLAN.md and docs/runtime-architecture.md updated to match.

Verified in browser: fresh load seeds 8 briefcase items through `GET /user/briefcase`; add from a search card → server count 9 (POST), toggle off → 8 (DELETE); MyBriefcase page renders the items grouped by workspace; tsc shows only the known unused-import baseline.

---

## 23. Automatic Distribution — AD 1: Foundation & Rules Authoring (2026-07-13)

First stage of the native Automatic Distribution module replacing FusionLive's Excel matrix (full design + decisions in **AUTO_DISTRIBUTION_PLAN.md**; legacy module reference in `Automatic_Distribution_SKILL.md`). Rule LIST is the source of truth; all-match + dedupe semantics; no single-letter codes in the UI.

**New — model & engine:** `src/types/distribution.ts` (AdRule/AdRuleSet/AdSettings/AdEvaluation, six action types incl. TQ/RFI), `src/types/workgroup.ts`; `src/utils/distributionEngine.ts` — condition-field registry (`AD_CONDITION_FIELDS`: discipline/documentType/status/tags/asset), display helpers, draft-vs-published diff (excludes updatedAt/updatedBy so a revert reads as unchanged), non-blocking `ruleWarnings`. Engine header documents it as MOCK-SERVER-ONLY: real matching runs server-side in the SaaS platform; this module is called only from the MSW handlers and serves as the acceptance spec for the backend.

**New — data & API:** `distributionSeed.ts` (25 rules across the four workspaces, hedland flagship v14; default settings: action precedence + editable reason vocabularies), `workgroupsSeed.ts` (15-user directory incl. 2 inactive, per-workspace workgroups; `CURRENT_USER_ID` = u-ospires). `src/api/distribution.ts` + `useDistribution.ts` hooks + queryKeys entries. MSW handlers persist per-workspace to `flux.ad.<wsId>`; rule mutations touch the DRAFT only and stamp updatedAt/updatedBy server-side; workgroups/users served read-only from seed. `DocumentMetadata` gained `discipline?` (seeded from the inferred category in mockDocuments).

**New — permissions & nav:** `PermissionContext` (`ad.manage` implies `ad.view`; [MOCK] `useUserPref('dev.adPermission')`) with a three-way demo switcher (Manage / Read-only / None) in the BrandBanner profile menu. LeftRail gains a captioned ADMIN section (Distribution + Workgroups) rendered only in project scope with `ad.view`; route→active-item map extended.

**New — pages:** `/admin/distribution` (`pages/admin/AutomaticDistribution.tsx`) — header with published-version + draft-changes chip ("Draft · N changes since vX" / "In sync with vX") and a disabled Publish (AD 2); seven tabs via `?tab=` (Rules live; Matrix/Tester AD 3, Unmatched/Log AD 4, History/Settings AD 2 as staged placeholders); guard cards for no-permission and enterprise scope. Rules tab (`components/distribution/RulesTab.tsx`): switchable group-by (discipline/document type/trigger/none, persisted `ad.rules.groupBy`), search + action/trigger filters, expandable rows (mono condition summary + recipient chips "Civil Leads — Formal Review · Lead Reviewer", inactive recipients flagged red), New/Edited badges from the diff, inline enabled toggle (manage only). Slide-over `RuleEditor.tsx` (drawer pattern): triggers (upload / status→X / manual), condition builder (per-kind operators, multi-select chips for `in`), recipients table (workgroup/user × action × reason), effective dates, priority (tiebreak only — not a list column), amber warnings that never block draft save. `/admin/workgroups` — read-only cards with members, roles, Inactive badges.

Verified in browser (Port Hedland): 10 seed rules grouped by discipline; expand shows conditions + chips; edit→save flips banner to "Draft · 1 change since v14" + Edited badge, persisted to `flux.ad.hedland` stamped u-ospires; create ("11 of 11 rules", New badge, 2 changes) then delete + rename-revert returns "In sync with v14" (proving the updatedAt-excluding diff); read-only mode hides New rule/Publish/toggles; None hides the rail section and direct URL shows the no-access guard; Tester placeholder + `?tab=tester` URL param; Workgroups page renders 6 groups with Inactive strikethrough. tsc: only the pre-existing unused-import baseline.

**Follow-up fix (same day) — perpetual "Loading rules…" (user-reported, Edge):** an Edge tab left open across the handler edits ran a stale bundle whose MSW worker didn't know the `/distribution/*` routes; with `onUnhandledRequest: 'bypass'` those calls fell through to Vite's SPA fallback, which answers **200 text/html**, so `res.json()` threw and React Query retried silently — and RulesTab's gate (`isLoading || !data`) rendered the failure as infinite loading. User fix: hard refresh (Ctrl+F5). Code fix: RulesTab and Workgroups now render an error card with Retry when a query errors **with no cached data** (cached data + failed background refetch keeps showing the list); message hints at Ctrl+F5 on dev builds. Verified by patching `window.fetch` to return the SPA-fallback HTML for `/distribution/*`, switching workspace (fresh query keys): error card + Retry render after retries exhaust; restoring fetch + Retry recovers ("published v5 · 6 of 6 rules"). Note: retry backoff timers throttle in hidden tabs, so the error state can take longer to appear in a backgrounded tab.

---

## 24. Automatic Distribution — AD 2: Governance (2026-07-13)

Second stage (AUTO_DISTRIBUTION_PLAN.md §4): draft → publish lifecycle, version history with restore, and workspace settings. Committed on top of AD 1 (`1a3de14`).

**Engine (`distributionEngine.ts`):** `diffRuleLists(from, to)` — named rule-level diff (added/edited/removed `RuleRef`s) powering the publish dialog and History tab; `findPriorityConflicts(rules)` — flags enabled rules giving the same recipient the same action with different reasons at EQUAL priority (differing priorities are resolved by definition: lower number wins), so the tiebreak ambiguity is surfaced contextually instead of exposing a priority column.

**Mock server:** `POST /distribution/publish` (400 without a summary — the summary IS the audit record; deep-copies draft → snapshot, bumps version, unshifts history, rebases draft), `POST /distribution/restore` (historical version's rules → draft, baseVersion stays at current published), `PATCH /distribution/settings`. `AD_SEED_VERSION` (=2) added to the store — stale localStorage stores re-seed automatically, which also delivered the new synthetic seed history (hedland v14/v13/v12 with staggered dates, authors and summaries; each older version drops the newest rules so diffs read sensibly).

**UI:** `PublishDialog` — changed rules named and chipped (New/Edited/Removed), amber "Checks — you can still publish" box (per-rule warnings + priority conflicts, never blocking), required summary, publish disabled until summary present. `HistoryTab` — timeline with Current badge, who/when/rule-count, summary, "vs vN-1" diff line, Restore-as-draft with two-click confirm ("Overwrites current draft — confirm"). `SettingsTab` — action precedence with up/down reorder, per-action reason vocabulary editing (add/rename/remove; removal tolerated by rule chips), alert-recipient checklist; local draft copy with dirty tracking that survives background refetches (last-synced ref), Save PATCHes whole object, "All changes saved" indicator. Page: Publish button live (disabled at zero changes), History/Settings tabs real, placeholders now only Matrix/Tester/Unmatched/Log.

Verified in browser (Port Hedland): history timeline v14/v13/v12 with correct diffs; toggle rule → "Draft · 1 change since v14" → publish dialog (button disabled until summary typed) → "In sync with v15", history 4 entries, publishedBy u-ospires; restore v14 → 1 change vs v15, restore v15 → in sync; settings reorder (Transmittal to #2) + new "For Construction" transmittal reason persisted to `flux.ad.hedland`, Save disables with "All changes saved"; synthetic conflict rule (Mike Chen, Formal Review, different reason, equal priority 30) → publish dialog names both rules and the recipient in the conflict warning; read-only mode: no Publish/Restore/reorder/inputs/save, static settings view. tsc: baseline only.

---

## 25. Document Category, FusionLive PM Statuses, Category-Scoped Metadata Conditions (2026-07-16)

Three user-driven changes locked after reviewing the AD build (AUTO_DISTRIBUTION_PLAN.md §6a).

**Document Category (new document field).** `DocumentMetadata.category?: DocumentCategory` with FusionLive-style values (`DOCUMENT_CATEGORIES` in types/document.ts: DRAWING, SPECIFICATION, VENDOR - SUPPLIER, PROJECT CONTROLS, CONTRACTS, HSE & ENVIRONMENT, QUALITY, COMMISSIONING, CONSTRUCTION RECORDS, HANDOVER & O&M). Assigned by `inferDocCategory(spec)` in mockDocuments (tag/format buckets — vendor before SPECIFICATION since vendor data is Specification-format) rather than annotating all ~74 specs. AD registry: `category` ("Document Category") replaces `documentType` as the primary condition field; group-by, seed-rule conditions and the RulesTab label updated. `documentType` untouched elsewhere (it's the format).

**PM status rename, app-wide.** `DocumentStatus` is now New → Under Review → Approved → Issued → Superseded → Archived (was Draft/In Review/Approved/Superseded/Archived). Swept: six status colour maps (documentStatusColors, ClipboardPanel, Dashboard, SearchResults, MyBriefcase, DetailSlidePanel — Issued restyled sky for all uses), DetailSlidePanel + FilterPanel locale-key maps, FilterPanel options list, ProjectMapView count, mockDocuments/briefcaseSeed/mockDashboard/mockPlaceholders seeds, AD engine `PM_STATUSES` (now the single exported source; RuleEditor's local copy removed), AD seed rules (transmittal rules retriggered on **Issued** — the classic FusionLive distribution trigger — and renamed accordingly; editor default toStatus Issued), en/fr locale keys (statuses.new/underReview, filters.statusOptions.*). Packages.tsx has its own PackageStatus — deliberately untouched.

**Category-scoped metadata conditions.** `AD_CATEGORY_METADATA_FIELDS` maps categories to their metadata schema (VENDOR - SUPPLIER → Manufacturer/Equipment Tag/Power Rating/Service Medium, DRAWING → Material Grade/Beam Size/Voltage/Concrete Type, …) with keys matching the generated document properties. `conditionFieldsForRule(conditions)` extends the field list once a rule names a category; the editor renders them in a "Category metadata" optgroup and keeps orphaned fields listed if the category clause changes; `conditionFieldDef` does a global lookup so existing conditions always render.

**User rules now survive re-seeds.** `AD_SEED_VERSION` → 3; on version mismatch `readAdStore` salvages user-created draft rules (ids not present in any seed version) and migrates their values (`STATUS_VALUE_MIGRATION`, `documentType`→`category` via `DOC_TYPE_TO_CATEGORY`) before merging into the fresh seed. `freshAdStore` deep-copies the seed so handler mutations can't corrupt the module-level object.

Verified in browser: civil rule reads "Discipline is Civil AND Document Category is DRAWING AND PM status is New"; transmittal rule badges "Status → Issued"; planted v2 store with a legacy user rule → salvaged with documentType/Drawing→category/DRAWING, In Review→Under Review, trigger Draft→New; built the user's example rule end-to-end through the UI ("Document Category is VENDOR - SUPPLIER AND PM status is New" → David Kumar Formal Review · Lead Reviewer, Lisa Wong Formal Review · For Information) — selecting the category unlocked the Manufacturer/Equipment Tag/Power Rating/Service Medium fields in the dropdown, and the rule persisted across reload; /documents shows all six new statuses and zero old vocabulary; console clean; tsc baseline only.
