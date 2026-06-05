# Flux EDMS — Development Log

> **Purpose**: Single reference for future Claude sessions. Read this first. It covers architecture, every completed feature, key decisions, and known constraints.

> **Shared log rule**: This file should remain branch-agnostic where possible. Flux-2 branch chronology and experimental implementation history belongs in `docs/flux-2/FLUX2_WORKLOG.md`.

---

## 1. Project Overview

**Flux** is a React 18 + TypeScript prototype for an Engineering Document Management System (EDMS). It is a frontend-only demo — all data is mocked; there is no backend.

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
| `/chat` | `DocumentBrowser` | Placeholder — routed to DocumentBrowser |
| `/design-system` | `DesignSystem` | Internal component reference |
| `/packages` | `Packages` | Placeholder |

### 2.2 Context Provider Stack (outer → inner, in `App.tsx`)

```
LocalizationProvider
  WorkspaceProvider
    ClipboardProvider
      ScopeProvider
        SearchProvider          ← added this session
          ShellLayoutProvider
            BrowserRouter
              BrandBanner (global)
              Routes
```

### 2.3 Key Contexts

| Context | File | What it stores |
|---|---|---|
| `ScopeContext` | `src/contexts/ScopeContext.tsx` | Current scope: `{ kind: 'enterprise' }` or `{ kind: 'project', id, name }` |
| `SearchContext` | `src/contexts/SearchContext.tsx` | `lastQuery: string` — last executed search term |
| `LocalizationContext` | `src/contexts/LocalizationContext.tsx` | i18n translation function `t()` |
| `ShellLayoutContext` | `src/contexts/ShellLayoutContext.tsx` | `isLeftRailVisible`, `toggleLeftRail` |
| `WorkspaceContext` | `src/contexts/WorkspaceContext.tsx` | Workspace-level state |
| `ClipboardContext` | `src/contexts/ClipboardContext.tsx` | Document clipboard/selection state |

### 2.4 Data Layer

All data is mock — no API calls.

| File | Contents |
|---|---|
| `src/data/projects.ts` | **Single source of truth for project names/IDs** — import this everywhere |
| `src/data/mockDocuments.ts` | Mock document records (uses `PROJECTS` names) |
| `src/data/mockFolders.ts` | Mock folder tree |
| `src/data/mockPlaceholders.ts` | Mock placeholder records |
| `src/data/mockDashboard.ts` | Dashboard stats, notifications |
| `src/data/searchData.ts` | Builds `searchRecords[]` from mockDocuments + mockPlaceholders |

---

## 3. Key Architectural Decisions

### 3.1 Single Source of Truth — Projects

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

### 3.2 Search Persistence — SearchContext

`SearchContext` stores `lastQuery`. `SearchResults` writes to it via `setLastQuery(query)` in a `useEffect`. `LeftRail` reads `lastQuery` and navigates to `/search?q=<lastQuery>` when the Search button is clicked (falls back to `/search` if empty).

**Why**: The LeftRail Search button previously always navigated to bare `/search`, losing the query. A URL-only solution would require reading the URL at click time, which is awkward from LeftRail. Context keeps it clean and in-session (no sessionStorage needed for a prototype).

### 3.3 Scope Switching on Search Navigation

When a user clicks a search result card → `navigate('/documents', { state: { folderId, selectedDocId, projectId, projectName } })` → `DocumentBrowser` reads `location.state` in a `useEffect` → calls `setScope({ kind: 'project', id: projectId, name: projectName })` and pre-selects the folder and document.

This is a `location.state` pattern. When a DB object-URL mapping table exists, replace it with a direct deep-link route resolved from that table.

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
- Fixed top bar, `h-[45px]`, `z-[60]`
- Left: toggle rail button + scope dropdown
- Centre: global search input (submits to `/search?q=`)
- Right: notifications bell (badge + hover preview), profile avatar, "FusionLive" label
- Scope dropdown: dynamic width, project search input, `Home` option resets to enterprise scope

### `LeftRail` (`src/components/LeftRail.tsx`)
- Fixed left, `top-[45px]`, `w-[88px]`, `z-20`
- Logo button: navigates to `/` and resets scope to enterprise
- Nav order: **Chat → Search → Documents**
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
- Grid layout with sticky left panel (`sticky top-0`) — must be `top-0` not `top-3` to stay top-aligned with right panel
- Resets `selectedSection` to `'overview'` when `scope.kind === 'enterprise'`

---

## 5. Shared Milestones

- Shared implementation guardrails are maintained in `CLAUDE.md`.
- Shared architecture integration guidance is maintained in `ARCHITECTURE.md`.
- Feature-level behavior specifications are maintained in `docs/`.

Branch-local chronology and Flux-2 implementation iterations were moved to:
- `docs/flux-2/FLUX2_WORKLOG.md`

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

- `/chat` route currently renders `DocumentBrowser` as a placeholder — needs a real chat component.
- `SearchResultCard.handleFolderClick` uses `navigate` with `location.state`. When a DB object-URL mapping table is available, replace with a direct deep-link route (e.g. `/documents/:folderId/:docId`).
- Placeholder records do not carry a `project` field in the current mock schema — `project: undefined` in `searchData.ts`. Add when mock data is updated.
- `filterCategories` only includes types present in current results — a type with zero results across all data never appears, which is correct behaviour for a dynamic filter.

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
