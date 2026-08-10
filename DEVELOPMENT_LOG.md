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
| 16 | Flint icon rebuilt: 3D hover-spin network in a static gradient hexagon | `FlintIcon.tsx`, `flintGeometry.ts` (new) |
| 17 | Repo hygiene baseline: `npm run typecheck` added, all type + lint errors cleared | `package.json`, `.eslintrc.cjs`, 15 source files |
| 18 | First test suite: Vitest + 108 tests over AD rules, search and icon geometry | `vitest.config.ts` (new), 3 `*.test.ts` (new), `package.json` |

---

### 16. Flint icon — 3D hover-spin (2026-08)

Replaced the Framer Motion bloom mark with a node network that spins in **3D on hover** and is
static otherwise, inside a static gradient hexagon frame.

- **Geometry split out** to `flintGeometry.ts` so the renderer and the containment check share one
  copy of the numbers. The previous validator restated the node table, which would drift and then
  pass while checking geometry that was no longer rendered.
- **Hover-gated, not perpetual.** Constant motion in persistent nav is distracting and a
  vestibular-accessibility problem. Spin ramps up on hover and freezes at its current angle on
  leave; the rAF loop exits when stopped, so an idle rail costs zero frames.
- **Linear ramps, not exponential easing.** An exponential only approaches zero — measured, the
  icon crept imperceptibly for ~2.5 s after the pointer left. Constant deceleration stops dead
  in ~0.36 s.
- **Spokes share the central node's colour.** Front-node spokes are drawn *after* the centre by
  the depth sort, so a contrasting colour painted a visible stripe across its face.
- **Containment is checked, not eyeballed** — `flintGeometry.test.ts`, six tier × state
  combinations over 360°. Perspective makes nodes swell toward the camera, so peak reach sits
  past the horizontal extreme, and small tiers squeeze from both ends at once.

### 17. Repo hygiene baseline (2026-08)

Groundwork so the prototype stays handover-ready rather than being cleaned up at handover time.

- `npm run typecheck` added. **`npm run build` never typechecked** — Vite strips types without
  checking them, so a green build said nothing about type safety.
- 19 `TS6133` errors cleared → typecheck clean. Mostly unused `React` imports (the React 17+ JSX
  transform makes them unnecessary). `ColorCustomizer`'s unwired `StandardPicker` was **exported
  rather than deleted** — it is a complete parked feature, not dead code to bin.
- 10 lint errors cleared → **0 errors** (6 known warnings remain). Six were the
  destructure-to-omit idiom (`const { updatedAt: _at, ...rest } = rule`) where the discarded
  bindings are the point; fixed by teaching ESLint the `^_` convention, not by deleting them.
- Rationale for zero: a permanently-failing lint is indistinguishable from a newly-broken one.

---

### 18. First test suite — Vitest (2026-08)

Vitest installed and configured; **108 tests** across three files. `npm test` / `npm run test:watch`.

- **Vitest, not Jest** — this is a Vite project, so Vitest reuses the existing transform
  pipeline and TS setup. Jest would mean maintaining a second, parallel build config.
- **Scope chosen for value, not count.** `distributionEngine` and `search` are pure functions
  (no DOM, no async, no mocking) that encode rules a new team cannot recover from the UI.
- **`jsdom` and `@testing-library/react` deliberately not installed.** Nothing in the current
  suite needs them; they go in when hook/context tests do.
- **The PowerShell containment validator was deleted**, superseded by `flintGeometry.test.ts`.
  It imports the geometry instead of regex-parsing the source, asserts invariants instead of
  reporting numbers, and — decisively — **can run in CI**, which a PowerShell script never
  could on Linux runners.

⚠️ **Still no CI.** Nothing runs on push. That is now the largest remaining gap: a clean-machine
run is the only thing that catches an uncommitted file that everything imports. See "Testing
status" in `CLAUDE.md`.

> **Superseded (2026-08-09, §30):** CI now exists — `.github/workflows/check.yml` runs
> `npm ci → npm run check` on every push and PR, plus a `.githooks/pre-commit` hook. Current
> state and full detail: `docs/quality-gates.md`.

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

---

## 26. Document Placeholders in the Grid (2026-08-09)

A FusionLive document record has an Oracle row for properties/metadata and, separately, its file in the content store (NFS today, moving to per-region S3 — ARCHITECTURE.md §System Architecture). **Placeholders** are pre-registered Oracle records with no file: document controllers create them singly or in bulk, usually against a delivery schedule, so project participants (suppliers, contractors, vendors) have a target to upload EPC deliverables into. Previously the prototype surfaced them in search results only; they now appear in the document grid.

**Model.** Two pieces. `'Placeholder'` is now a **`DocumentStatus` value** — the 0% rung of the Rules of Credit ladder — and is mutually exclusive with `New`: a record becomes `New` the instant content lands on it. (This corrects the first cut of this build, which modelled placeholder-ness as a second axis and rendered two chips; the domain owner confirmed a record cannot be both `Placeholder` and `New`.) Alongside it, `DocumentMetadata.contentState?: 'content' | 'placeholder'` plus `dateExpected?` and `responsibleParty?`. `contentState` is not redundant with the status value and is what **behaviour** keys off: customers rename their status ladders (IFR/IFA/IFC/As Built), so upload-vs-download affordances must never depend on a customisable string, and a placeholder can sit on top of a version stack where the current version has no content but earlier revisions do. Typed as a string union so it satisfies the `Document` index signature (a boolean `isPlaceholder` field will not compile). `isPlaceholder(doc)` exported from `types/document.ts` is the single predicate; `undefined` reads as `'content'`, so every pre-existing record is unaffected. Domain background — MDR/DDR, Rules of Credit, version-stack placeholders — written up in **MDR_AND_PROGRESS.md**.

**Data.** `mockPlaceholders.ts` rewritten from a parallel `PlaceholderRecord` shape to full `Document`s — 7 per project (28 total), on real `folderId`s, with 4 concentrated in one engineering folder per project so the grid demos both kinds side by side. `fileType`/`fileSize`/`thumbnail` are empty by design. `dateModified` straddles the content set's 2026-06-01 ceiling so three surface on page 1 of the default `dateModified desc` sort and the rest interleave; two per project are past `dateExpected` to exercise the overdue state. Merged into `mockDocumentsByProject` — G06 returns both kinds from one endpoint, discriminated by `contentState`, not from a separate resource. `searchData.ts` now maps the whole of `mockDocuments` through one mapping (`resultType`/`hasUploadedContent` derived from `isPlaceholder`), so placeholders finally carry a project in search. Side effect worth knowing: that mapping now reads `document.discipline ?? inferDiscipline(document.tags)`, so content documents whose tags didn't match a discipline label now show their assigned discipline in search results where they previously showed none.

**Contract.** `DocumentListParams.contentState` → `?contentState=content|placeholder` (omitted = both); `DocumentListResponse.placeholderApprox` added to the ADR-011 envelope so the header can report both counts without loading every page. MSW handler filters and counts accordingly. Folder-tree `documentCount` now **excludes** placeholders — the badge counts what is actually in the store, and pending deliverables are reported separately in the grid header ("840 documents · 7 placeholders").

**UI (subtle differentiation, per user decision).** Same row height and rhythm; three cues only — a dashed-outline page icon in the filetype slot, the neutral dashed `Placeholder` **status** chip (one chip, via `statusColors.Placeholder`), and `--` in file-derived cells. Row background is untouched so the existing selection / active-row / panel-open styling keeps winning. `Date Expected` is a default column with an overdue treatment (rose text + clock icon); `Responsible` is opt-in via the column chooser (new `DEFAULT_HIDDEN_COLUMN_KEYS`, also excluded from the auto-append on category change). List and card views get a dashed "Awaiting content" tile instead of a broken thumbnail, and the card swaps file size for the expected date. Row action menu: **Upload content** leads for placeholders; View, Rendition and Add to Briefcase are disabled. `PlaceholderFileIcon` / `PlaceholderChip` / `isOverdue` are exported from `DocumentCard.tsx` alongside `getFileTypeIcon` so table, list and card cue identically.

**Detail surfaces.** `toDocumentDetail` previously hardcoded `fileType: 'PDF'` and `fileSize: doc.fileSize || '2.4 MB'` — on a placeholder that asserted a 2.4 MB PDF for a record with no file, reachable from the reference link, the title, the Properties menu item and the `?doc=` deep link. Both now resolve to `''` for placeholders, and `DetailPanelData` carries `contentState` / `dateExpected` / `responsibleParty`. `DetailSlidePanel` gains a dashed "Placeholder — no content uploaded" banner with the delivery line, Date Expected + Responsible fields, an Upload content action leading the bar, and disabled Open / Download / Add to Briefcase (`ActionIconButton` now takes `disabled`). `MetadataPanel` renders `--` for empty filetype/size and appends the two schedule rows. `DocumentDetail.tsx` (the full page) got the same treatment — chip in the header, empty-state preview instead of a thumbnail, Upload content in place of Download, Print disabled.

**Status vocabulary sweep.** Adding `'Placeholder'` to `DocumentStatus` meant adding the entry to **six** near-duplicate colour maps — `documentStatusColors.ts` plus ClipboardPanel, DetailSlidePanel, Dashboard, MyBriefcase and SearchResults — exactly the sweep §25 had to do. SearchResults' stale `'Pending Upload'` entry (left over from the old placeholder mock) removed. `PM_STATUSES` in `distributionEngine.ts` deliberately keeps the six content statuses and excludes `Placeholder`: nothing to distribute until content exists, and AD fires on the `Placeholder → New` transition. FilterPanel's Status list likewise stays at six — the Content radio group owns placeholder isolation, and two paths to the same result would be able to diverge. [TODO-ENG] consolidate the six maps onto the shared one.

**Found while verifying, not fixed:** `DocumentCard` links each grid card to `/document/{id}`, but `App.tsx` declares no such route — clicking any card in grid view renders a blank shell, for content documents as much as placeholders, and `DocumentDetail.tsx` is orphaned. Pre-existing; raised separately since the fix (add the route vs. point cards at the slide panel) is a product call.

**Filter.** FilterPanel's dead "Include Document Placeholders" checkbox (local state, never wired) replaced by a controlled three-way **Content** radio group — All items / With content only / Placeholders only — lifted to `DocumentBrowser` as `ContentStateFilter`, applied server-side, with a removable chip in the active-filter row and inclusion in Clear all. New en/fr locale keys: `filters.content`, `filters.contentOptions.*`, `documentBrowser.columns.dateExpected`, `documentBrowser.columns.responsibleParty`.

Verified in browser (Goldfields): default grid reads "840 documents · 7 placeholders" with three placeholders at the top of the dateModified sort and dashed icons distinguishing them from PDF/DWG rows; Placeholders only → "0 documents · 7 placeholders", all seven listed, the two overdue ones (2026-07-10, 2026-06-12) in rose with the clock icon; card view shows the "Awaiting content" tile beside a real thumbnail card; list view shows the dashed tile and "Expected 2026-09-25"; action menu on a placeholder row shows Upload content with View/Rendition/Add to Briefcase greyed; search facets still split Documents 16 / Placeholders 1. tsc clean, 108 tests pass, eslint baseline warnings only.

[TODO-ENG] `contentState`, `dateExpected` and `responsibleParty` are prototype-invented names — confirm against the G06 Swagger. The upload flow itself is not built.

---

## 27. Document Journey + Version Stack in the Properties Panel (2026-08-09)

Follow-on from §26, after a domain walkthrough clarified that Rules of Credit is a **UI/UX concept to visualise**, not something to implement: FusionLive already holds a document history audit and shows it as a grid of audit rows; this re-imagines it as a timeline. Stage vocabularies and percentages are **workspace configuration** in real FusionLive, so nothing here may switch on a label.

**Panel now has tabs.** `DetailSlidePanel` gained `Properties | Version Stack`, rendered only for documents that have a stack (other object types and stackless records see no tab bar at all). Tab state resets when the panel switches object, so a user is never stranded on a tab that no longer exists.

**`DocumentJourney` (`src/components/DocumentJourney.tsx`).** Injected at the bottom of the Properties tab. Vertical timeline, chosen over the horizontal reference layout because the panel is 360px by default — a five-node ladder plus a descending branch cannot stay legible there. Fully fluid: no widths set anywhere, so it survives the panel resize. Props are `steps` + `currentStatus`; the active node is resolved from the document's state at render time, falling back to the last dated step. Resolution deliberately takes the **last** status match, not the first: a rejected document revisits an earlier stage at a new revision, so the same status appears twice and the later occurrence is live. Node states are complete (solid dark) / current (brand blue, ring, `CURRENT STATUS` badge above the label) / upcoming (hollow, dashed outline, dashed connector) / rejection. **Red appears only on the rejection path** — node, elbow, label, reason. Each node shows its earned percentage; the header shows the document total plus a progress bar.

**Rejections are a branch, not a rung.** Drawn indented off the spine with a rounded elbow, because the document does not advance — it goes back for revision. `JourneyStep.branch === 'rejection'` marks them; they are skipped when resolving the current step and carry no percentage.

**`VersionStack` (`src/components/VersionStack.tsx`).** Compact per-revision grid sized for 360px: a three-column header (Rev / Status / Date) with author and file on a second line, rather than a wide table needing horizontal scroll. Current revision highlighted; view/download disabled on placeholder revisions, same rule as the grid row menu and the panel action bar.

**Mock data (`src/data/mockJourneys.ts`, `src/types/journey.ts`).** `buildJourney(doc)` produces a **chronological** history plus the rungs still ahead — not a fixed ladder — because a document can revisit a stage. Revisions walk up across reached stages (R1 → R2 → R3) so the timeline agrees with the version stack rather than stamping today's revision on 2024 events. Roughly a third of documents past review carry a rejection in history (stable hash of the id — no `Math.random`, so the demo is identical across reloads). `buildVersionStack(doc)` derives stack depth from the revision number.

**Two things the data deliberately demonstrates.** (1) The four projects use four different stage vocabularies over identical mechanics — Marra Ridge "Issued for Review", Hedland "Squad Check", Kwinana "IDC Review", Goldfields "Discipline Check" — because admins name their own. (2) Four seeded **revision-cycle placeholders** (`REVISION_CYCLE_PLACEHOLDER_IDS`, one per project) show the loop from §4 of MDR_AND_PROGRESS.md: review closed with comments → placeholder pushed onto the stack → earned value back to 0% for the revision that has not arrived. The review *activity* that would create it is not built; the outcome is seeded.

**End-states are not the finish line.** `Superseded` and `Archived` are not rungs — the document left the ladder rather than completing it. The first cut appended them as a step after `As-Built`, which made every superseded document render As-Built as *completed* and the header read "100% earned"; a superseded drawing never reached As-Built. Now `earnedPercent` is optional on `JourneyStep`, end-stated documents drop the rungs they never reached (nothing is "ahead" of a superseded revision), and the terminal step carries no percentage — so the header walks back to the last real rung and a superseded document correctly reads 85%, with a "Replaced by a later revision" note. Rejection branches lost their `earnedPercent: 0` for the same reason: they earn nothing, they are not rungs.

**Localization.** Both new components go through `t()` — new `journey.*` and `versionStack.*` blocks plus `detailPanel.tabs.*`, and the placeholder banner / Date Expected / Responsible strings added in §26 were retro-fitted at the same time. Dates use the active locale rather than a hardcoded `en-GB`. en/fr both populated.

Verified in browser: `MR-PRO-DWG-203-R1` renders Placeholder → Uploaded → Issued for Review → red rejection branch ("Rejected with 6 comments — clashes with structural steel") → `CURRENT STATUS` Placeholder (R2) at 0% → four upcoming rungs greyed with dashed connectors; its Version Stack shows R2 Placeholder (current, no content, actions disabled) over R1 Under Review with a 3.0 MB PDF. `MR-NPI-DWG-009-R3` renders 50% earned with revisions progressing R1/R2/R3 and Version Stack 3. `MR-ITP-023-R2` (Superseded) ends at Issued for Construction 85% followed by an unweighted Superseded terminal node — no phantom As-Built. Journey measures 313px inside the default panel with no overflow. tsc clean, 108 tests pass, eslint 6 warnings (baseline).

[TODO-ENG] No confirmed endpoints — journey should come from the history/audit trail and the stack from G06 revisions. Ladder definitions and Rules of Credit percentages need a workspace-configuration source. Aggregate % complete across the register is a Dashboard feature and is deliberately absent from the per-document view.

---

## 28. Status Vocabulary Correction: Superseded off the Grid, Archived Removed (2026-08-09)

Two corrections from the domain owner, with different scopes.

**`Superseded` never appears in the document grid.** The grid lists CURRENT versions only, so a superseded revision cannot be in it by definition — a user wanting an earlier revision navigates to the document and opens the Version Stack. It is a concept, not a grid status. The value stays in `DocumentStatus` because two places legitimately need it: the version stack renders non-current revisions with it, and Automatic Distribution fires a "Superseded notice to DC" when a new revision replaces an old one (a real workspace event even though it is never a grid row). What changed is everything that *produces or filters grid rows*: removed from the `statuses` array in mockDocuments, and from the FilterPanel status list (nothing in the grid could match it, so offering the filter was a dead end).

**`Archived` removed outright** — FusionLive does not archive documents. Gone from `DocumentStatus`, all six `statusColors` maps, `PM_STATUSES`, the FilterPanel list and label map, `briefcaseSeed` (one seeded item moved to `Issued`), and both locale packs (`statuses.archived`, `filters.statusOptions.archived`).

**Knock-on: the journey's end-state handling is now dead code.** §27 added terminal-node logic so Superseded/Archived documents did not render a phantom As-Built at 100%. No grid document can reach either status now, so `endStated`, the terminal step, the `'terminal'` icon slot and the `ArchiveIcon` import are all gone, and `ladderIndexForStatus` no longer needs its construction-rung fallback. The optional `earnedPercent` introduced for that fix stays — rejection branches still need it.

**Encoding incident worth recording.** The locale edits were first attempted with a PowerShell regex round-trip (`Get-Content -Raw` → `Set-Content -Encoding utf8`). In Windows PowerShell 5.1 that reads UTF-8-without-BOM as ANSI and writes back UTF-8-**with**-BOM, which corrupted every accented string in `fr-FR.json` (330 changed lines instead of ~24) and added a BOM that broke `JSON.parse`. Both files were reverted with `git checkout` and re-edited through the Edit tool. **Never use PowerShell string round-trips on the locale packs** — no BOM, and they are full of non-ASCII.

Verified in browser: status counts across all four workspaces are now Placeholder / New / Under Review / Approved / Issued only, zero Superseded and zero Archived. `MR-NPI-DWG-009-R3` shows `New` on its grid row and in the panel header, with R2/R1 as `Superseded` inside the Version Stack. Locale packs parse clean, no BOM, accents intact. tsc clean, 108 tests pass, eslint 6 warnings (baseline).

---

## 29. Test Coverage for the Placeholder / Journey Work (2026-08-09)

Sections 26–28 shipped with documentation but **no tests** — the 108 passing tests were all pre-existing (`distributionEngine`, `search`, `flintGeometry`). Closed that gap before handover. **156 tests now pass across 7 files.**

**New: `npm run check`** — `typecheck && lint && test`, fails fast. The three were easy to half-run; there is still no CI, so one command is the closest thing to a gate. *(CI + a pre-commit hook were added shortly after — §30.)*

**Four new test files**, all pure-function (the suite runs `environment: 'node'`, no jsdom):

- `src/types/document.test.ts` — `isPlaceholder` / `isOverdue`. Pins that an absent `contentState` reads as content (so legacy records are unaffected), that a delivered document is never overdue whatever date it carries, and that a deliverable is not overdue *on* its due date.
- `src/utils/journey.test.ts` — the two rules extracted from the component. `resolveCurrentIndex` takes the **last** status match, so a document that revisits a stage after rejection resolves to the later occurrence; it never lands on a rejection branch. `earnedAt` walks back past non-rungs so landing on a rejection doesn't read as 0%.
- `src/data/mockJourneys.test.ts` — determinism (the demo must not reshuffle on reload), revision progression matching the version stack, the full review-rejection loop (branch is not a rung, two placeholder rungs either side of it, second one back at 0%, trailing rungs unreached), version-stack ordering and the placeholder-on-top-of-stack case.
- `src/data/documentCorpus.test.ts` — corpus invariants that no single component reveals: grid status vocabulary (no `Superseded`, no `Archived`), placeholder field rules, every placeholder's `folderId` existing in its project tree, folder counts excluding placeholders, search classification, and every project seeding both an overdue and an on-schedule placeholder.

**Two refactors the tests forced.**

`resolveCurrentIndex` and the earned-total walk-back moved out of `DocumentJourney.tsx` into `src/utils/journey.ts`. Exporting them from the `.tsx` cost a `react-refresh/only-export-components` warning (the same trap `isOverdue` hit in §26), and `utils/` is where this project's business rules already live.

`buildVersionStack` had a latent ordering bug found while writing the "newest first" assertion: older revision dates were generated by stepping *forward* from `dateCreated` in fixed 21-day increments, which on a short-lived document overshoots `dateModified` and puts R2 after R3. Now spread across the document's own lifespan, so the stack is strictly newest-first. The test asserts it over 150 documents per project.

**What is deliberately not covered:** anything that renders. No jsdom or Testing Library is installed, and adding them is a dependency decision for the receiving team — the vitest config already anticipates it. The visual states (grid cues, journey branch and badge, panel-resize fluidity, version-stack tab, fr-FR strings) are written up as a manual checklist in **MDR_AND_PROGRESS.md §5b**, alongside a table mapping every automated domain rule to the test that pins it.

Also raised separately: a deep link carrying `?ws=` fires one document request against the previously-persisted workspace before the scope reconciles, logging a spurious 404. Pre-existing, self-correcting, cosmetic — but it is console noise QA will notice.

---

## 30. Product Decisions Batch: Superseded Removed, Cards Rewired, In-App Viewer, CI (2026-08-09)

Worked through a full batch of product answers in one pass. Ordered so the status vocabulary and the six duplicate colour maps were touched once, not twice.

**Status maps consolidated, then `Superseded` removed entirely.** The five near-copies of `statusColors` (ClipboardPanel, DetailSlidePanel, Dashboard, MyBriefcase, SearchResults) now import from `documentStatusColors.ts`. That module exports `statusColors` typed `Record<DocumentStatus, string>` — so a vocabulary change is a **compile error** rather than a blank chip — plus `panelStatusColors` for the non-document states the detail panel also renders (Overdue / Due Today / Due Soon / Pending / Returned), and a `statusChipClass()` helper for the string-typed call sites (briefcase snapshots, search results, dashboard feeds). This was the trap that bit twice in one week; it can't bite the same way again.

With one map to edit, `Superseded` went: **FusionLive has no such status.** Superseding is a *relationship between revisions*, expressed by position in the version stack, not a state a document is in. Removed from `DocumentStatus`, `PM_STATUSES`, the version stack (older revisions now keep the status they held when replaced — `Issued` in the mock), and both locale packs. The AD seed rule that fired on it was **retargeted, not deleted**: `r-hed-superseded-notice` → `r-hed-reissue-notice` on a status change to `Issued`, preserving the seed's only time-boxed (`effectiveFrom`/`effectiveUntil`) example. `DocumentStatus` is now five values: Placeholder → New → Under Review → Approved → Issued.

**Grid cards open the properties panel.** `DocumentCard` was wrapping every card in `<Link to={/document/:id}>` — a route `App.tsx` never declared, so clicking any card rendered a blank page. Now a keyboard-operable `role="button"` calling `onOpen`, threaded through `GridWithStickyScrollbar` to `openDocumentPanel`, so grid view matches table and list and the selection stays deep-linkable via `?doc=`. The orphaned `src/pages/DocumentDetail.tsx` (imported by nothing) was **deleted** — recoverable from git if that turns out to be wrong.

**In-app document viewer.** FusionLive opens documents in the Apryse viewer in a new browser tab, which drops the user out of the app. `DocumentViewer` reproduces that chrome **framed inside FLUX** — below the banner, right of the rail, so the user can still see where they are — with the two escapes the user asked for in the white menu header: **maximise to full page** and **open in new tab**. Toolbar, View/Annotate/Shapes/Insert/Measure tabs, working zoom, left Markup panel and right Comments panel are all modelled; markups and comments come from `mockMarkups.ts`. Open/close state lives in `ViewerContext` because the eye icon appears in three places — grid row action menu, properties action bar, and per-revision in the Version Stack — and the user asked for the same experience from all of them. Escape closes; tabs other than View carry an explicit "not built in this prototype" chip rather than pretending.

**Deep-link 404** — fixed by the user running the spawned task; `scopeMatchesUrl` now gates the deep-linked document query so it no longer fires against the previously persisted workspace.

**Testing and enforcement.** `jsdom` + `@testing-library/react` added, with component tests for `DocumentJourney` (current-status badge tracks the document state; red confined to the rejection path; no hard-coded width) and `VersionStack` (placeholder version disables view/download; clicking view opens the framed viewer for that revision). **174 tests, 9 files.** Component tests opt in per-file with `// @vitest-environment jsdom`; because the suite runs `globals: false`, Testing Library does **not** auto-register cleanup — every such file must call `afterEach(cleanup)` or renders accumulate and queries start matching duplicates. That cost an hour; it is now documented in `vitest.config.ts`.

`npm run check` is enforced in two places: a zero-dependency `.githooks/pre-commit` hook wired up by the `prepare` npm script (no husky), and `.github/workflows/check.yml` on every push and PR. ⚠️ The hook needs its executable bit set when first committed or macOS/Linux clones ignore it.

**Encoding, again.** Editing `CLAUDE.md` with a PowerShell `Get-Content -Raw` → `Set-Content -Encoding utf8` round-trip corrupted it exactly as it corrupted the locale packs in §28 — BOM added, em-dashes mangled, 120 changed lines instead of 4. Reverted and redone with the Edit tool. A repo-wide BOM audit then found `mockPlaceholders.ts` had picked one up the same way and `DEVELOPMENT_LOG.md` had had its (pre-existing) BOM stripped; both restored to match HEAD byte-for-byte. **Never use PowerShell string round-trips on repo files.**

**Documentation.** MDR_AND_PROGRESS.md gains the framed-viewer section, the corrected MDR framing (§2 — the MDR is *not* a distinct resource; every document has an Oracle record whether or not it has content), the §3.2 status rules, and a rewritten §6 splitting the five genuinely open engineering questions from the two now answered. Placeholder creation (Excel template export/import **and** UI creation) and Rules of Credit admin configuration are both recorded as future Flux phases.

**Signed-shift bug, caught by eye then pinned by test.** The mock generators index fixed arrays with a hashed document id: `ARRAY[(hash >> 5) % ARRAY.length]`. `hash()` returns an **unsigned** 32-bit value, so for any id hashing to ≥ 2^31 the *signed* `>>` produced a negative index and a silent `undefined` — blank comment bodies in the viewer, and latent `undefined` reviewer/reason on journey rejection steps. All shifts changed to `>>>`, and `src/data/mockMarkups.test.ts` now sweeps 120 documents per project asserting no generator ever yields an empty field, plus that two comments on the same document never share a body.

**Test runner made deterministic.** Both the default `forks` pool *and* `threads` intermittently failed to start a worker for the jsdom files ("Timeout waiting for worker to respond") — four clean runs on threads turned out to be luck, and it failed again on the fifth. Running many workers at once starves the slow ones, and jsdom setup is by far the slowest thing in the suite. Since `npm run check` now gates commits and CI, a flaky runner is worse than a slow one: `pool: 'threads'` **plus `fileParallelism: false`**, so files run sequentially. Verified over five consecutive full runs, zero start failures, 12–18s warm. If speed ever matters, raise parallelism for the node-environment files only rather than globally.

Verified in browser: grid card click opens the panel with `?doc=`; viewer opens framed from the properties eye icon *and* the grid row action menu (different project) with both header buttons present, maximises to full viewport and restores, closes on Escape; all three viewer comments render distinct bodies. Status counts across all four workspaces are Placeholder / New / Under Review / Approved / Issued only. tsc clean, **180 tests** pass across 10 files, eslint 6 warnings (baseline).

---

## 31. View Style Simplified to a Light / Dark Toggle, Floating Layout Retired (2026-08-10)

**Floating layout and the standalone 'light' appearance are gone.** The View Style picker in Settings offered five combinations — Light Floating, Light Flush, Dark Floating, Dark Flush, Basic Flush — as a 2×2 tile grid plus a special-cased full-width tile. Product decision: flush is now the only layout, Basic Flush is the permanent default, and the picker collapses to exactly two options, **Light Mode** (`appearance: 'basic'`) and **Dark Mode** (`appearance: 'dark'`), both always `layout: 'flush'`. Panel header renamed from "View Style" to "Appearance" to match — presented like the light/dark toggle in any modern app rather than a bespoke FLUX-refactor picker.

**Found and fixed a latent persistence bug while touching this.** `loadFluxStyle()`'s localStorage validation in `ViewStyleContext.tsx` only ever accepted `appearance === 'light' || 'dark'` — `'basic'` was never in the allow-list, so selecting Basic Flush and reloading silently discarded the choice and fell back to the old default (`{appearance:'light', layout:'floating'}`). It only *looked* persistent because state lived in React until the next reload. Validation now accepts `'basic' | 'dark'` with `layout === 'flush'` only; anything else (old floating saves, plain `'light'`) falls through to the new default `{appearance:'basic', layout:'flush'}`, so pre-existing localStorage from before this change self-heals instead of erroring.

`ColorCustomizer.tsx`'s `FluxPicker` dropped the appearance+layout icon pairing (`AppearanceIcon`/`LayoutIcon`, `LayersIcon`/`AlignJustifyIcon`/`CircleIcon`) since there's no layout choice left — each tile is now a single Sun/Moon icon, label, and description. `fluxOptions` shrank from four entries to two; the old full-width "Basic Flush" special case is gone, folded into the regular tile grid. Locale keys `lightFloating(Desc)`, `lightFlush(Desc)`, `darkFloating(Desc)`, `darkFlush(Desc)`, `basicFlush(Desc)` removed from both `en-US.json` and `fr-FR.json`; replaced with `lightMode(Desc)` / `darkMode(Desc)`; `fluxTitle` changed from "View Style"/"Style de vue" to "Appearance"/"Apparence". Edited both locale packs with the Edit tool, not PowerShell — see the §28/§30 encoding incidents.

**Deliberately not touched:** the `html[data-view='flush']`-gated CSS in `index.css` still exists conditionally rather than being made unconditional. Since `data-view` will now always be `'flush'` (nothing sets `'floating'` anymore), the non-flush default rules are simply unreachable dead weight, not deleted. Left alone to keep this change scoped to the picker and its persistence; a follow-up could strip the floating-only rules and make flush the CSS baseline outright.

Verified in browser: Appearance panel shows exactly two tiles (Light Mode checked by default); clicking Dark Mode applies instantly across the whole shell and persists correctly across a reload; switching back to Light Mode also persists (confirming the validation fix). tsc clean, eslint 6 warnings (pre-existing baseline, none in touched files), 180/180 tests pass (one `VersionStack.test.tsx` worker-start timeout on the first run was the same transient vitest-pool flake documented in §30 — re-ran clean).

---

## 32. Lint Baseline Burned Down to Zero + Quality-Gates Doc (2026-08-10)

The standing 6-warning eslint baseline (carried since §17) is **gone — 0 errors, 0 warnings.** Each was fixed at the root, not silenced:

- **3 × `react-hooks/exhaustive-deps` on `useUserPref` setters** (`CollapsibleFilterPanel`, `Chat`, `DocumentBrowser`) — the setter is `useCallback(…, [])`, referentially stable, so it was added to the resize effect's dep array. The effect still subscribes once; the deps are now honest.
- **1 × `react-hooks/exhaustive-deps` on a local function** (`FeedbackWidget`'s `handleClose`) — recreated every render, so a blind dep-add would re-subscribe each render. Fixed by **inlining** its body (`setIsOpen(false)` + `setTimeout(reset, 300)`) into the Escape effect, matching the identical, already-clean auto-close effect directly above it. The effect now depends only on `isOpen`.
- **2 × `react-refresh/only-export-components`** (`DocumentCard`, `RuleEditor`) — a module can't export a component *and* a non-component helper without breaking Fast Refresh. Extracted the helpers: `getFileTypeIcon` → new `src/components/fileTypeIcon.tsx`; `newRuleTemplate` → new `src/components/distribution/ruleTemplate.ts`. Consumers (`VersionStack`, `DocumentBrowser`, `RulesTab`) updated. **Gotcha:** the first extraction still warned — the extracted `.tsx` had a named `DwgIcon` component next to the helper. A component-free module was the actual requirement, so the DWG glyph was inlined into the icon map as an anonymous factory. Lesson: `only-export-components` is about the *module containing a named component alongside a non-component export*, not merely about what's exported.

**New handover doc: `docs/quality-gates.md`** — the current-state reference for testing/lint/CI (the one gate `npm run check`, the three enforcement points, the ESLint rationale, the three Vitest config traps, the per-file test map, operational gotchas). README gained a short "Quality gates" section pointing to it. Stale CI claims corrected: CLAUDE.md's "Testing status" tail (said "Nothing runs automatically" / "CI — still none" — both false since §30) and dated superseded pointers added to §18/§29.

Verified: `npm run check` — tsc clean, **eslint 0 errors / 0 warnings**, 180/180 tests across 10 files pass. No behaviour change (dep-array honesty, an inlined handler matching an existing pattern, and pure module moves).

---

## 33. Vitest Worker-Start Flake — ATTEMPTED FIX, RETRACTED (2026-08-10)

> **🛑 RETRACTED — see §34.** This entry claimed the flake was fixed by
> `poolOptions.threads.singleThread`. That claim is **false**: `singleThread` is dead config
> in vitest 4 (the string does not exist anywhere in the 4.1.10 package), so the change was a
> silent no-op, and the flake recurred ~15 minutes after this was written. The entry is kept
> because the reasoning error is instructive, but **do not apply the fix it describes.**

The *"Failed to start threads worker … Timeout waiting for worker to respond"* flake on the jsdom files (`DocumentJourney.test.tsx` / `VersionStack.test.tsx`) — noted as "transient, re-ran clean" in §30/§31 — stopped being cosmetic: it aborted a real `push-to-github-flux.bat` commit via the pre-commit hook (9/10 files, 171/180 tests, 1 error).

**§30's `fileParallelism: false` was necessary but not sufficient.** It makes files run *sequentially*, but Vitest still spawns a **fresh worker per file**. On this machine the jsdom import is ~30s (antivirus/disk-bound `node_modules`), and the previous worker's teardown/import starves the pool's startup handshake for the next worker, which then times out. Sequential-but-still-respawning left the race intact — it just made it rarer, which is why five clean runs in §30 read as "fixed" when it wasn't.

**Fix:** `poolOptions: { threads: { singleThread: true } }`. The whole suite runs in one long-lived worker — a single startup handshake total, no per-file spawn race left to lose. `fileParallelism: false` kept as explicit redundancy. Rationale written into `vitest.config.ts` replacing the old "files run sequentially" note; `docs/quality-gates.md` trap #3 updated to match.

Verified: **four consecutive `npm test` runs, 180/180, zero worker-start errors**, and it's *faster* (~50–64s vs the failing run's 153s) since there's no repeated spawn/teardown churn. Full `npm run check` green. If speed ever matters, don't restore global multi-worker parallelism — split the node-only files into a separate parallel project and keep the jsdom files single-threaded.

---

## 34. Worker-Start Flake: Actual Mechanism, Prewarm Mitigation, and Why §33 Was Wrong (2026-08-10)

§33's fix was dead config and its verification was meaningless. Both errors are worth recording because they are the same error twice.

**The mechanism, from vitest 4.1.10 source.** `START_TIMEOUT` is a hardcoded `6e4` (60s) at `node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:2794`, armed at `:2906` via `withTimeout(waitForStart(), …)`; `WORKER_START_TIMEOUT` is a hardcoded `9e4` at `:3395`. **Neither is reachable from config, CLI or env** — the ceiling cannot be raised. The DOM environment is imported *inside* that window, and measured on this machine `import('jsdom')` costs **~80,500ms cold vs ~1,600ms warm**, while `new JSDOM()` costs **99ms**. So ~99.9% of the cost is cold-reading jsdom's ~1,730-file tree at **~35ms/file vs ~0.54ms/file warm (65×)** — antivirus scanning `node_modules`, i.e. file I/O, not DOM work.

**Why §33 (and §30 before it) could not have worked.** `poolOptions.threads.singleThread` is **dead config in vitest 4** — the string `singleThread` appears nowhere in the 4.1.10 package, and `poolOptions` only emits a deprecation warning. It was a silent no-op whose comment described a mechanism vitest 4 doesn't implement. And structurally: **anything that reduces the NUMBER of worker startups cannot beat a fixed PER-startup ceiling.** `fileParallelism: false` (§30) and `singleThread` (§33) both made exactly that mistake. Lesson: confirm a config key exists in the installed version before attributing a behaviour change to it.

**Why the "verification" was worthless — the more important lesson.** §33 cited four consecutive clean runs; §30 cited five. Neither carried information. This machine has 32GB RAM with ~15.6GB free, so `node_modules` (237MB) cannot be evicted from page cache on demand — **warm runs cannot reproduce the failure**, so warm clean runs are uninformative at any N (20 ≈ 5 ≈ 0). Worse, the clean runs used bare `npm test` while the real failures came through `npm run check`, where `tsc` and `eslint` churn the cache first. A tally of passes is not evidence when the failure mode is structurally absent from the conditions being sampled.

**Mitigation applied: `scripts/prewarm-test-env.mjs`**, chained ahead of vitest in the `test` script. It imports jsdom and the vitest worker graph in a plain node process — **which has no timeout** — so the cold read is paid outside the 60s window and the in-handshake read hits a warm cache. Total work is unchanged; it moves. Always exits 0, so it can never block the suite. Effect on the in-window quantity: reported `environment` **3.57s**, vs 17–22s on previously-marginal runs and 28–54s on the failing ones.

**Rejected after investigation** (each for a specific, evidenced reason): `isolate: false` — `ThreadsPoolWorker` defines no `canReuse` (`cli-api:3135-3188`; only Typecheck/VmForks/VmThreads do), so a node-env runner can never serve a jsdom task; it would remove only the *second, already-warm* jsdom startup (~1.5s) while making `afterEach(cleanup)` cross-file load-bearing. `happy-dom` — only makes DOM construction cheaper, which is 99ms of an 80,500ms cost. `pool: 'vmThreads'` — experimental, and cross-realm `instanceof` breaks Testing Library. Patching the vendored constant — content-hashed 495KB bundle, changes every vitest bump. Auto-retry in the hook — masks a machine pathology and couples the gate to a vendored string. `fileParallelism: false` is **kept**, but now documented for its real reason: serial cold reads beat concurrent ones on a contended disk, and serial execution lets the second jsdom file ride the first's warm cache.

**Still open, and honestly labelled as such.** The prewarm is verified only on a warm cache. The decisive test needs a genuinely cold one (post-reboot) and is written up as a 3-stage protocol in `docs/quality-gates.md`; Stage C gives the standing invariant — *prewarm duration may be arbitrarily large; reported `environment` must stay in single-digit seconds.* **The actual cure is an antivirus exclusion for `C:\GitHub\flux\node_modules`** (admin/IT action); it removes the 35ms/file cause rather than relocating it, but unlike the script it does not travel with the handover.

**Two harness defects fixed alongside.** `.githooks/pre-commit` now tees its output and classifies the failure: on a `[vitest-pool]` marker it prints that this is the known worker-start flake rather than "Fix the errors above" — which was false in this case and trained reflexive `--no-verify` — while **still exiting 1**, with no auto-retry and nothing masked (verified the classifier both fires on the pool error and does *not* fire on a real assertion failure). `push-to-github-flux.bat` had **no error handling at all**: it ran `git push` and printed "Operation complete." even when the hook aborted the commit, reporting success for work never committed. Now guarded with `if errorlevel 1`.