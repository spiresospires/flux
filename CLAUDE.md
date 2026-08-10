# Flux — Project Notes for Claude Code

## Project Overview

Flux is a React 18 + TypeScript front-end prototype for a FusionLive EDMS (Engineering Document Management System). Built with Vite, Tailwind CSS 3, Framer Motion, Lucide React, React Router v6, TanStack React Query v5, and MSW. Server data flows over HTTP against the documented API contracts; MSW answers those requests from the mock datasets (see §Data Layer) — set `VITE_API_MODE=real` to bypass it.

**Run locally:** `npm run dev` (or double-click `flux-dev.bat`) → http://localhost:5173

---

## Architecture

```
src/
  api/            API client wrapper
  components/     UI components (BrandBanner, LeftRail, FlintIcon, ColorCustomizer, etc.)
  contexts/       React context providers
  data/           Mock data (mockDashboard, mockDocuments, mockFolders, projects, etc.)
  hooks/          Custom React hooks (useUserPref)
  mocks/          MSW handlers + browser worker
  pages/          Route-level pages (Dashboard, DocumentBrowser, Chat, SearchResults, etc.)
  types/          Shared TypeScript types
  utils/          Utility functions (search, distributionEngine)
```

Tests live beside the code they cover, as `*.test.ts`.

### Commands

| command | what it does |
|---------|--------------|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Production build (does **not** typecheck — Vite strips types without checking) |
| `npm run typecheck` | `tsc --noEmit`. Currently clean; keep it that way |
| `npm run lint` | ESLint. **0 errors, 0 warnings** — keep it there |
| `npm test` | Vitest, single run. 180 tests over business rules, mock generators, icon geometry + two component suites |
| `npm run check` | typecheck → lint → test in one go. Run this before any handover |
| `npm run test:watch` | Vitest in watch mode |

⚠️ `npm run build` succeeding does **not** mean the code typechecks — Vite strips types without checking them. That is what the separate `typecheck` script is for. Run `typecheck`, `lint` and `test`; the build alone proves very little.

✅ **CI and a pre-commit hook now run `npm run check`** (typecheck → lint → test). See "Testing status" at the end of this file.

### Key context providers

| Context | Purpose |
|---|---|
| `ScopeContext` | Enterprise vs project mode. Controls dashboard filtering and left-rail visibility. |
| `LocalizationContext` | `t()` translation helper. Locale files in `public/locales/`. |
| `ShellLayoutContext` | Left-rail visibility toggle. |
| `ClipboardContext` | Cross-page document clipboard (pinned docs shared between pages). |
| `BriefcaseContext` | User-scoped cross-workspace briefcase. Adapter over React Query (`/user/briefcase` via MSW) — stable `useBriefcase()` interface, optimistic mutations. |
| `ViewStyleContext` | Global appearance (`light`/`dark`/`basic`) and layout (`floating`/`flush`). Always active — not gated by project. |
| `DensityContext` | Global density (`compact` default / `comfortable`) → `html[data-density]`, drives the density CSS vars in index.css. |
| `SearchContext` | Persists `lastQuery` so the Search nav button restores the last search. |

---

## UI Conventions

- **Brand colour:** `#0461BA` (cobalt blue) — active states, focus rings, links, active nav indicators.
- **Background:** `#EAEEF6` (page), `#E8F1FB` (active nav/chip bg), `#F0F4F8` (input bg).
- **Panels:** `bg-white border border-neutral-200 rounded-xl shadow-sm`.
- **Search inputs:** `h-7 pl-8 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs focus:ring-2 focus:ring-[#0461BA] focus:bg-white`.
- **Top banner:** fixed `h-[60px]`. Left rail: fixed `w-[88px]`, `top-[60px]`.
- **Folder icon colour (document grid / folder tree):** `text-amber-400` inactive, `text-amber-500` active — match this whenever referencing folder icons.
- **All popups/dropdowns** use `createPortal(content, document.body)` with `position: fixed` and `zIndex: 9999`. Position calculated from `getBoundingClientRect()` at click time. This escapes all stacking contexts (topbar has `z-[60]` which would otherwise trap children).

---

## View Style System

`ViewStyleContext` exposes `viewStyle: { appearance, layout }`.

| `appearance` | `layout` | Effect |
|---|---|---|
| `light` | `floating` | Default — soft blue-grey gradient chrome, panels float with shadow |
| `dark` | `floating` | Dark navy chrome |
| `basic` | `flush` | Neutral grey, panels flush edge-to-edge |
| `light` | `flush` | Blue-grey, flush |
| `dark` | `flush` | Dark navy, flush |

Appearance is written to `html[data-view][data-appearance]` and driven by CSS in `src/index.css`. The `ColorCustomizer` component (settings gear in left rail) always shows `FluxPicker` — it is not gated by project.

**Flush height fix (index.css):** `align-items: stretch` on `page-layout`, `height: 100%` on `left-panel`, `min-height: 100%` on `content-panel`.

---

## Scope / Workspace Behaviour

The top-banner workspace dropdown sets `ScopeContext`:

| Selection | `scope.kind` | Effect |
|---|---|---|
| All Workspaces | `enterprise` | **Always navigates to the Dashboard** (`navigate('/')`). Dashboard shows all-projects data; Documents hidden from left rail |
| Any project | `project` | Dashboard filters to that project; Documents visible in left rail; user stays on the current page |

**Why enterprise always lands on Dashboard:** there is no all-workspaces documents view — customers operate within one project envelope at a time and switch via the workspace dropdown. Leaving the user on `/documents` (or any project-scoped page) in enterprise scope would be a dead state.

**Resetting to Home:** `setScope({ kind: 'enterprise' })` + `navigate('/')` — same behaviour from the logo/Home button and the "All Workspaces" dropdown option. The Dashboard `useEffect` watching `scope` resets `selectedSection` to `'overview'`.

**Single source of truth for projects:** `src/data/projects.ts` — exports `PROJECTS` array (ids: marra-ridge, hedland, kwinana, goldfields). All mock data imports from here. Theme: WA mining EPC portfolio — Marra Ridge Iron Ore Mine (Pilbara), Port Hedland Berth 6 Expansion (port, carries `isFluxRefactor`), Kwinana Lithium Hydroxide Plant (process plant), Goldfields Rail Duplication (rail, Kalgoorlie). Each project entry carries `client`, `assetType`, `phase` and `location {lat,lng,locality}` for the map view.

**Per-project mock data:** every workspace has its own folder tree and document set. `mockDocumentsByProject` / `mockFoldersByProject` (keyed by `ProjectId`) are what DocumentBrowser consumes via `scope.id`; the flat `mockDocuments` / `mockFolders` exports are the all-projects union used by search. All projects share the same controlled EPC top-level folders (01 Project Management → 08 Handover & Operations); subfolders are themed per asset type. Document totals: Marra Ridge 1140, Port Hedland 920, Kwinana 1060, Goldfields 840. Folder counts are computed from documents — never hand-edit.

**Dashboard Map view (both scopes):** a Widgets/Map segmented toggle (persisted via `useUserPref('dashboard.view')`) sits **top-left inside the content panel** in enterprise AND project scope. The map fills the content panel only (left section list stays visible); an expand/collapse button (top-right of the toolbar, transient `useState`) maximises it over the whole dashboard area. Selecting any section from the left list returns to widgets; scope changes reset only `mapExpanded`, not the view choice. Map = `src/components/ProjectMapView.tsx` — Leaflet + react-leaflet on OpenStreetMap tiles, brand-blue divIcon pins. It takes a `focusedProjectId` prop: `null` (enterprise) renders all pins fitted to the WA bounds; a project id (Dashboard passes `scope.id` in project scope) renders **only that pin**, zooms to it (zoom 8, animated via `MapViewportController`/`useMap`) and auto-opens its popup. Hovering a pin opens a clickable popup (stats + actions): title/Open → `setScope(project)` (project dashboard), Documents → `/documents`, Flint → `/chat?ask=<name>&askKind=project`. The map wrapper needs `relative z-0` so Leaflet panes stay under the top banner.

**Basemap toggle (Map / Hybrid):** an in-map segmented control (top-right, persisted via `useUserPref('dashboard.mapBasemap', 'map')`) switches the basemap. `map` = OSM standard raster (default). `hybrid` = Esri World Imagery satellite base + two transparent Esri reference overlays composited on top (`World_Transportation` = roads, `World_Boundaries_and_Places` = place/city labels), rendered bottom→top with explicit `zIndex` 1/2/3 and distinct React keys so the layer set swaps cleanly. All tile sources are free and key-free; URLs live in the `TILE_LAYERS` constant. **Note:** there is no free, key-free *transparent OSM* roads+labels overlay — the Esri reference layers are the standard substitute. To use strictly-OSM data, swap the overlay URLs for a keyed provider (Stadia/Thunderforest/MapTiler). The toggle is a DOM sibling of `MapContainer` (not a child) so wheel/click events never reach the map; `z-[1000]` keeps it above Leaflet panes but the page `relative z-0` wrapper still contains it under the banner.

**Right-click → copy coordinates:** `MapContextMenuController` (a `useMapEvents` child) handles the Leaflet `contextmenu` event — it preventDefaults the native browser menu, then opens a small in-map menu at the clicked point showing `lat, lng` (6dp) and a Copy action (`navigator.clipboard` with an `execCommand` fallback for non-secure contexts; shows "Copied!" then auto-closes ~900ms). The menu position comes from `e.containerPoint` (same origin as the wrapper), clamped to stay in-bounds. Dismissed by Escape, outside-click (transient `useEffect` while open), or any map interaction (`movestart`/`zoomstart`/`click` in the controller). Transient state — not persisted. `z-[1100]`, above the basemap toggle.

**Flint chat context convention:** every Flint entry point passes `?ask=<label>&askKind=project|folder|document` (map pin → project, FolderTree → folder, DocumentBrowser/DocumentCard → document). Chat.tsx renders this as a context chip on the empty state (icon per kind + label + project scope) so the user always sees what Flint is scoped to. Markers in Chat.tsx document the future G29 payload: `{ scope: { wsId }, context: { type: askKind, id: <objectId> } }` — pass object IDs, not labels, once wired.

---

## Left Rail (`src/components/LeftRail.tsx`)

Nav order (top → bottom): **Dashboard → Flint (Chat) → Search → Documents**

- **Documents** is conditionally rendered when `scope.kind === 'project'` only.
- On scope `enterprise → project` transition: Documents button **slides in** (Framer Motion `AnimatePresence`, y:10→0, scale:0.88→1, 200 ms) and the **folder icon flashes amber** for 1.3 s (`@keyframes docs-nav-appear` in `index.css`, amber-400 `#FBBF24` matching FolderTree colour).
- `prevScopeKindRef` guards against firing the highlight on initial mount.
- All icon sizes: 20 px.
- `useUserPref` is NOT used here — the highlight is a one-shot transition effect, not a persisted preference.

---

## Flint AI Icon (`src/components/FlintIcon.tsx`)

Shared animated SVG component used in LeftRail nav, Chat empty state and the Dashboard project map.

**Two files.** `flintGeometry.ts` holds the node table, size tiers and projection maths; `FlintIcon.tsx` is only the renderer. The split is not cosmetic — `flintGeometry.test.ts` imports the same module, so the geometry has exactly one definition. An earlier PowerShell validator kept its own copy of the node table, which would drift the moment anyone edited the component and leave a check that passed while validating geometry that was no longer rendered.

**Structure:** A static rounded point-top hexagon frame (circumradius 52, centre (60, 60), viewBox `0 0 120 120`) with a gradient stroke, enclosing a node network that **spins in 3D on hover** and is static otherwise. Corners are built into the path (each vertex cut back and rejoined with a quadratic), not just `stroke-linejoin`. Nine peripheral nodes, all wired **directly** to the centre — no branches off other spokes.

**Frame gradient:** `#3B2FC9` → `#2E6AD6` → `#52C4F2`, bottom-left to top-right. The frame is a **sibling** of the network group, never a parent, so it cannot move.

**No framer-motion.** Animation is a `requestAnimationFrame` loop writing SVG attributes directly through refs, so it never re-renders the React tree at 60 fps.

### The 3D rotation

Nodes hold 3D positions (`phi` azimuth, `psi` elevation, `d` distance) and orbit the **vertical axis** like a turning globe. Rotation about Y is cheap because elevation never changes:

```
rho = d·cos(psi)            horizontal orbit radius
y   = d·sin(psi)            constant — Y rotation cannot alter height
x   = rho·cos(phi + theta)
z   = rho·sin(phi + theta)
scale = CAM / (CAM - z)     CAM = 170
```

⚠️ A CSS `transform: rotateY()` does **not** work here. SVG children get no per-element 3D perspective, so it just squashes the network horizontally like a flipping card.

⚠️ SVG has no `z-index` — **depth order is document order**. The draw loop sorts by `z` and re-appends the groups far-to-near each time the order changes.

⚠️ Spokes are the **same colour as the central node** (`SPOKE = CENTRE`). A node in front of the centre has its spoke drawn *after* the central node, so a contrasting spoke colour paints a visible stripe across its face and the centre looks transparent.

### Hover behaviour

Spin ramps up on hover and ramps down on leave, **freezing at whatever angle it reached** rather than snapping back to zero (`thetaRef` survives re-renders). Once fully stopped the rAF loop returns without rescheduling, so an idle rail costs zero frames.

⚠️ Ramps are **linear** (`ACCEL 140`, `DECEL 110` deg/s²), deliberately not an exponential ease. An exponential only *approaches* zero — measured, the icon kept creeping imperceptibly for ~2.5 s after the pointer left. Constant deceleration reaches a true dead stop in ~0.36 s.

Perpetual motion in persistent nav is distracting and a vestibular-accessibility problem; hover-gating is what makes this mark acceptable in the rail at all. `prefers-reduced-motion: reduce` disables the spin entirely and renders a static pose.

**Colours:** Fully blue — violet `#3B2FC9`, navy `#1E3A8A`, brand `#0461BA`, mid `#2F6FD0`, sky `#5BA0E8`, light `#7FC4EE`. Centre and spokes are brand.

⚠️ The icon does **not** use `currentColor`, so it does not grey out in the rail's idle state. This is deliberate. The active signal still reads because `LeftRail` supplies it independently via the `bg-[#E8F1FB]` pill, the blue left bar and the blue label — not via the icon.

**Optical sizing (`flintTier`):** Flint ships at 14 px (ProjectMapView, inline), 20 px (LeftRail) and 88 px (Chat hero). Nine nodes rasterise to an indistinct smudge below ~24 px, so small sizes draw a subset — larger, on thicker spokes, pulled inward:

| size | frame | spoke | node scale | spread | centre | corner | nodes |
|------|-------|-------|-----------|--------|--------|--------|-------|
| ≤15 | 11.0 | 5.5 | 1.30 | 0.86 | 7.9 | 6.5 | 3 — `[0,3,7]` |
| ≤24 | 9.25 | 4.5 | 1.18 | 0.92 | 7.3 | 8.0 | 5 — `[0,2,3,6,7]` |
| >24 | 6.75 | 3.0 | 1.00 | 1.00 | 6.25 | 9.5 | 9 — all |

`isActive` multiplies frame ×1.12 and centre ×1.06.

⚠️ `spread` is not decoration. Small sizes squeeze containment from **both** ends at once: a thicker frame stroke pulls the inner edge inward while larger nodes push reach outward. Without it the 14 px tier overflows the frame by 1.45. `spread` pulls node distances in to pay for both.

### Containment — do not eyeball this

Perspective makes nodes **swell** as they swing toward the camera, so peak reach sits just *past* the horizontal extreme (where `z=0`, `scale=1`), not at it. At the hero tier the worst case is 235°, nowhere near the widest point.

All six tier × state combinations are checked over a full 360°; worst clearance is 2.39. The `isActive` state is the tighter case, since the thicker stroke moves the inner edge inward.

This is asserted by `flintGeometry.test.ts`, so it re-checks automatically after any change to `CAM`, `spread`, `scale`, `stroke`, or any node's `d`/`psi`/`r`:

```bash
npm test
```

The test imports `flintGeometry.ts` directly, so there is no second copy of the numbers to keep in sync. It asserts both that clearance stays positive *and* that it stays above 1.5 — a mark grazing the frame reads as a bug even when it technically fits.

The same file also pins the rotation itself: it inverts the projection and asserts each node's recovered orbit radius and elevation are invariant across a full turn. Note it deliberately does **not** assert that screen `cy` holds still — it must not, because perspective scales height as well as width. A node whose `cy` never moved would mean the projection was ignoring depth.

⚠️ The mark is **completely flat** — no `drop-shadow`, glow, `filter` or gradient on the nodes anywhere. Depth reads from size alone.

**Props:** `isHovered: boolean`, `isActive?: boolean`, `size?: number` (default 20). Unchanged from the previous implementation, so no call site needed editing.

**Used in:**
- `LeftRail`: size=20, `isActive` tied to route, `isHovered` tied to `hoveredId === 'chat'`
- `Chat` empty state: size=88, auto-plays once on mount via `useEffect` on `activeId`
- `ProjectMapView`: size=14, inline beside 11 px "Flint" label on project cards, `isHovered={false}`

---

## Chat Page (`src/pages/Chat.tsx`)

### Empty state
- Shows `FlintIcon` at 88 px.
- **Auto-plays** the bloom animation once whenever the empty state becomes visible (effect fires on `activeId` change, sets `iconHovered=true` for 1.2 s if `messages.length === 0`).
- Hover interaction also works (manual trigger via `onMouseEnter/Leave`).

### Conversation history sidebar
- **Starts collapsed** on first visit (`useUserPref('chat.historyOpen', false)`).
- Collapsed/open state and panel width **persist** via `useUserPref` (localStorage now; see `src/hooks/useUserPref.ts` for Oracle API wiring instructions).

### First-message bug fix
- Previous code had a **stale closure bug**: `setMessages` in the 1.2 s `setTimeout` captured `activeId=null` from the closure for new conversations, causing the Flint response to be written to a second orphan conversation and `setActiveId` to switch away from the user's message.
- **Fix:** `resolvedId` is computed synchronously at the top of `handleSend` (`activeId ?? 'c-' + Date.now()`). New conversations are created with the user message already included in a single `setConversations` call. The setTimeout closure captures `resolvedId` (a string constant) — no stale state.
- The `setMessages` wrapper function was removed (was the source of the bug).

---

## User Preferences Hook (`src/hooks/useUserPref.ts`)

```ts
useUserPref<T>(prefKey: string, defaultValue: T): [T, setter]
```

Drop-in replacement for `useState` that persists to `localStorage` under `flux.userPref.<prefKey>`.

**Oracle integration:** When the FusionLive user-preferences table is available, replace the `readPref`/`writePref` internals with `GET /api/user/preferences/:prefKey` (on mount) and `POST /api/user/preferences/:prefKey` (on change). The hook signature and all call-sites are unchanged.

**Current usages:**

| Key | Default | Where |
|---|---|---|
| `chat.historyOpen` | `false` | Chat sidebar collapsed state |
| `chat.historyWidth` | `288` | Chat sidebar pixel width |
| `docBrowser.panelWidth` | `360` | DocumentBrowser split-panel pixel width |
| `docBrowser.treeWidth` | `320` | DocumentBrowser folder-tree/filter island width |
| `dashboard.view` | `'widgets'` | Dashboard Widgets/Map toggle (both scopes) |
| `dashboard.mapBasemap` | `'map'` | Map basemap: OSM (`map`) vs satellite Hybrid (`hybrid`) |
| `ui.density` | `'compact'` | Global density (DensityContext → `html[data-density]`) |

**Planned usages (not yet wired):** document browser column choice, column order, column widths.

---

## Document Browser — Column Headers (`src/pages/DocumentBrowser.tsx`)

The `ColumnHeaderDropdown` component was redesigned for modern UX:

**Sort** — click the **column label** to cycle: `none → asc → desc → none`.
- State shown inline: `⇅` (ghost, sortable hint) → `↑` blue bold (asc) → `↓` blue bold (desc).
- No popup needed for sort.

**Filter** — a `ListFilterIcon` (funnel) sits right of the label.
- Hidden until hover (`opacity-0 → group-hover:opacity-35`) unless filter is active (always visible, blue).
- Filled blue dot appears beside icon when a filter value is set.
- Clicking opens the compact popover.

**Filter popover (192 px, rounded-xl):**
- **Sort pills row** — two equal-width icon-only buttons (`↑` / `↓`). Active = blue fill + ring. Clicking the active pill clears that sort.
- **Filter input** — `[🔍 Filter… ×]`. Inline clear `×` appears when value present. `bg-[#F8FAFC]` brightens to white on focus.
- **Clear row** — dashed-border `×` + "clear" (shown only when sort or filter is active). Turns red on hover.

---

## Document Browser — Detail Panel (`src/components/DetailSlidePanel.tsx`)

The detail panel supports two rendering variants via the `variant` prop:

| Variant | Behaviour |
|---|---|
| `'drawer'` (default) | Fixed overlay, slides in from the right with backdrop. Used everywhere except DocumentBrowser. |
| `'split'` | Inline flex column, no backdrop, no fixed positioning. Used in DocumentBrowser. |

**Split layout (DocumentBrowser):**
- Panel renders as a flex sibling of `content-panel` inside `browser-layout`; width controlled by `useUserPref('docBrowser.panelWidth', 360)` (min 260 px, max 640 px).
- Resizing uses the shared `PanelResizeHandle` component (`src/components/PanelResizeHandle.tsx`): a faint centred line + always-visible grip pill rendered **in the 16px `browser-layout` gap** between islands (positioned `-left-4`/`-right-4` off the host panel's edge). The same handle resizes the folder-tree island via `CollapsibleFilterPanel` (`useUserPref('docBrowser.treeWidth', 320)`), so both separators look and behave identically. Dragging recalculates width from `window.innerWidth - e.clientX` (detail panel) / `e.clientX - rect.left` (tree).
- `content-panel` has `transition-all duration-200` — smoothly compresses as the panel opens.
- `browser-layout` has `items-stretch` so all columns fill full height.
- Animation: `opacity+x` slide-in (`x: 20 → 0`, 200 ms ease-out). No backdrop.
- **Active row highlight**: the row matching `panelData.docId` gets `bg-[#F0F6FF] ring-1 ring-inset ring-[#0461BA]/20` — lighter than the selection blue so the two states are visually distinct.

**Shared inner content (`PanelInner`):**
Both variants use the same `PanelInner` component for header and body. Only the outer `motion.aside` wrapper differs. `px`/`py` props allow tighter padding in the narrower split panel (`px-4 py-4`) vs the drawer (`px-6 py-5`).

**Drawer variant** is preserved intact — no other call-sites need updating.

---

## BrandBanner Dropdowns (`src/components/BrandBanner.tsx`)

All three dropdown menus (scope selector, notifications, profile) use `createPortal(content, document.body)` with `position: fixed` / `zIndex: 9999`.

- Position calculated at **click time** via `getBoundingClientRect()`.
- Single `mousedown + touchstart` outside-click handler covers all three menus.
- Click-to-toggle (works on touchscreen, not just hover).

---

## Search → DocumentBrowser Navigation

Card click navigates to `/documents?ws=<projectId>&folder=<folderId>&doc=<docId>` — URL params, not `location.state`, so the link is shareable, survives refresh, and opens correctly in a second browser window. DocumentBrowser derives `selectedFolderId` from the `folder` param (validated against the loaded tree — stale params resolve to null), derives `highlightedDocId` from `doc`, and switches scope from `ws` once the G03 workspace list loads.

---

## Data Layer (React Query + MSW)

All server data flows through HTTP even in the prototype:

- `src/api/` — typed fetch client (`client.ts`, RFC 7807 `ApiError`), endpoint functions (`workspaces` G03, `folders` G05, `documents` G06, `search` G19, `briefcase` `/user/briefcase`), `queryKeys.ts` key factory (these keys are the ADR-010 G31 invalidation targets), `queryClient.ts`.
- `src/hooks/` — `useWorkspaces`, `useFolderTree(wsId)`, `useDocuments(wsId, params)` (useInfiniteQuery, cursor pagination per ADR-011, exposes flattened `documents` + `totalApprox`), `useSearch(wsId, request)`.
- `src/mocks/handlers.ts` — MSW handlers serve the `src/data` mock sets through the real G03/G05/G06/G19 + `/user/briefcase` contracts (keyset cursors, server-side filter/sort, 350 ms latency, RFC 7807 errors). Started from `index.tsx` unless `VITE_API_MODE=real`. The briefcase handlers persist to the `flux.briefcase` localStorage key (the mock server's durable store).
- **Briefcase** is user-scoped, not workspace-scoped — `BriefcaseContext` adapts React Query to the stable `useBriefcase()` interface with optimistic mutations; consumers never talk HTTP directly.
- **DocumentBrowser**: folder scope/status/type filters + sort + pagination are server-side; category (tag) chips and column text filters remain client-side over loaded pages (marked `[TODO-ENG]`). Grouping fetches everything (limit 1000) because subtotals need the full set.
- `msw` is installed from the public npm registry — the Idox Nexus proxy does not carry it (404).

---

## FILENAME SANITISATION & ENCODING RULES

These rules apply to any code handling file uploads, filename display, database storage, or download preparation.

### 1. Preserve Engineering Unit Symbols
Do **not** strip feet (`′`) or inches (`″`) symbols. These are valid in engineering filenames (e.g. `12″ Pipe Spool Drawing.pdf`).

### 2. Unicode Workarounds for Quotes

| Symbol | Unicode | Meaning | Example |
|---|---|---|---|
| Double Prime | `″` U+2033 | inches | `6″ flange detail` |
| Two single quotes | `''` ASCII 39×2 | inches (fallback) | `6'' flange detail` |
| Right double quote | `"` U+201D | inches (smart quote) | `6" flange detail` |
| Single Prime | `′` U+2032 | feet | `10′ beam` |

### 3. Core Requirements

- **UTF-8 everywhere.** Do not use Latin-1 or Windows-1252.
- **Safe conversion on Windows download.** Convert `"` → `″` or `''` rather than deleting it.
- **Validation regex** must explicitly permit `′″'"`.

```ts
function sanitiseFilenameForWindows(name: string): string {
  return name
    .replace(/"/g, '″')          // double-quote → Double Prime (U+2033)
    .replace(/[<>:/\\|?*]/g, '_'); // other Windows-blocked chars → underscore
}
```

---

## Pre-existing TypeScript Warnings (not introduced by recent work)

These are known, non-blocking, and pre-date recent sessions:
- `PackageIcon` unused in `LeftRail.tsx`
- `onChatClick` prop mismatch in `SearchResults.tsx`
- PNG type declarations missing for `BrandBanner.tsx` asset imports
- Several `React` unused import warnings across files
- ~~`Dashboard.tsx` callable expression errors~~ — FIXED 2026-06-10: these were real runtime crashes (`.map((t) =>` shadowed the `t()` translation function; clicking the To Do section white-screened the app). Never name a callback param `t` in this codebase.

---

## Testing status

**Vitest is installed and 180 tests pass.** Coverage is deliberately narrow: the business
rules that a new team cannot re-derive from the UI, the mock generators, the icon geometry,
and two component suites. The rest of the rendering is still unverified — see the manual
checklist in **MDR_AND_PROGRESS.md §5b**.

Component tests opt in per-file with `// @vitest-environment jsdom` on the first line. The
suite runs `globals: false`, so **each such file must call `afterEach(cleanup)` itself** —
Testing Library does not auto-register it, and without it renders accumulate and queries
start matching duplicates from earlier tests.

**`npm run check` runs typecheck → lint → test in one command, and is now enforced in two
places** (added 2026-08-09 — previously nothing ran automatically):

- **Pre-commit hook** — `.githooks/pre-commit`, wired up by the `prepare` npm script
  (`git config core.hooksPath .githooks`), which npm runs automatically after `npm install`.
  Zero-dependency, no husky. Bypass deliberately with `git commit --no-verify`.
- **CI** — `.github/workflows/check.yml` runs `npm ci && npm run check` on every push and PR.

⚠️ When `.githooks/pre-commit` is first committed, set its executable bit or it will be
ignored on macOS/Linux clones (Windows is unaffected):
`git add .githooks/pre-commit && git update-index --chmod=+x .githooks/pre-commit`

| check | scope | gated? |
|-------|-------|--------|
| `npm run typecheck` | whole project, **clean** | via `check` |
| `npm run lint` | whole project, **0 errors, 0 warnings** | via `check` |
| `npm test` | **180 tests**, 10 files (see below) | via `check` |
| `npm run check` | all three, sequential, fails fast | **yes** — pre-commit hook + CI |

| test file | covers |
|-----------|--------|
| `src/utils/distributionEngine.test.ts` | AD rules: priority conflicts, rule warnings, draft/published and version diffs, condition and trigger rendering, category-scoped field widening |
| `src/utils/search.test.ts` | query normalisation, what drives a match, `matchedFields`, snippet fallbacks, facet counts |
| `src/components/flintGeometry.test.ts` | icon containment at every tier × state over 360°, rotation rigidity, tier boundaries, spoke/centre colour invariant |
| `src/types/document.test.ts` | `isPlaceholder` / `isOverdue` — the predicates every content affordance keys off instead of a (customer-renamable) status string |
| `src/utils/journey.test.ts` | which journey node is "current" (last status match, so a post-rejection revisit wins) and what a document has earned when it lands on a non-rung |
| `src/data/mockJourneys.test.ts` | journey determinism, revision progression, the review-rejection loop, version-stack ordering and placeholder-on-top-of-stack |
| `src/data/documentCorpus.test.ts` | corpus invariants: status vocabulary, placeholder field rules, folder-count exclusion, search classification |
| `src/data/mockMarkups.test.ts` | viewer markup/comment generators — sweeps the corpus for `undefined` fields from hashed array indexing (a signed-shift bug shipped once this way) |
| `src/components/DocumentJourney.test.tsx` | **jsdom** — current-status badge tracks the document state, red confined to the rejection path, no hard-coded width |
| `src/components/VersionStack.test.tsx` | **jsdom** — placeholder version disables view/download, current row marked once, view opens the framed viewer for that revision |

**Why these two engines first:** `distributionEngine` and `search` are pure functions with no
DOM, no async and no mocking required — the cheapest possible coverage — and they encode
decisions that are invisible from the UI. Some pinned behaviours are genuinely non-obvious:
search filters on `searchableText` alone while the snippet is built from a *different* list of
labelled fields, so the two can legitimately disagree; and a priority conflict requires equal
priority **and** differing reasons, because unequal priorities are resolved by definition.

**Keep lint at zero — errors and warnings.** This matters more than the findings did: a
lint that always reports something is indistinguishable from a newly-broken one, so if
`npm run lint` never comes back clean, running it regularly carries no signal. At zero,
anything new is unambiguously something just introduced.

The old 6-warning baseline was burned down to zero on 2026-08-10. For the record, since the
same shapes recur: the 3 × `react-hooks/exhaustive-deps` on `useUserPref` setters
(`CollapsibleFilterPanel`, `Chat`, `DocumentBrowser`) were fixed by adding the setter to the
dep array — it's `useCallback(…, [])`, referentially stable, so the effect still subscribes
once. `FeedbackWidget`'s `handleClose` warning was fixed by **inlining** its body into the
Escape effect (a local function recreated each render would re-subscribe if added to deps).
The 2 × `react-refresh/only-export-components` (`DocumentCard`, `RuleEditor`) were fixed by
moving the non-component helper to a sibling module (`fileTypeIcon.tsx`, `ruleTemplate.ts`);
the extracted `.tsx` must itself stay component-free (the DWG glyph was inlined as an
anonymous factory, not a named component).

✅ `npm run check` now runs automatically — the `.githooks/pre-commit` hook on commit and
`.github/workflows/check.yml` on push/PR (see the enforcement note above). Running it by hand
is still the fastest local feedback loop.

### Highest-value gaps, in order

1. ~~**CI**~~ — **done** (`.github/workflows/check.yml`, `npm ci → npm run check` on every push
   and PR). It closed the class of bug local checks structurally cannot catch: an uncommitted
   file that everything imports — `flintGeometry.ts` was untracked for a while and every local
   check passed because the file was on disk; a fresh clone would have failed instantly.
   The remote is currently GitHub; the move to GitLab happens at handover, so the equivalent
   GitLab pipeline should be written when the repo actually moves, running the same
   `npm ci → npm run check`.
2. **Contexts and `useUserPref`** — persistence, the localStorage parse-failure fallbacks, and
   the cross-window `storage` event sync. All have real edge cases and are currently only
   verifiable by clicking through the app. Needs `jsdom` and `@testing-library/react`, which
   are deliberately **not** installed yet — the current suite is pure functions and needs
   neither, so the install was kept minimal.
3. ~~**The 6 lint warnings**~~ — **done** (burned down to zero, 2026-08-10). See the note above.

### Deliberately not tested

Animation timing and hover-state DOM behaviour. Those assertions are timing-dependent and
flaky, and a suite people learn to ignore is worse than no suite. The Flint spin is covered by
its geometry invariants instead, which is both stronger and stable. Visual regression testing
needs infrastructure that is not worth it at this stage.

### A caution for whoever adds the first tests

The Flint containment check earned its place by catching real bugs (a 14 px tier overflowing
the frame, two overlapping nodes, a network escaping under rotation). But an earlier version of
it was itself broken in a way that still *looked* correct: a PowerShell `$DEG` constant collided
with the `$deg` loop counter — variable names are case-insensitive — so the angle sweep was
garbage, yet it sampled enough of the circle that the reported maximum was accidentally right.

Prefer checks that assert an **invariant** with a known expected value over checks that merely
report a number that looks plausible.

That validator has since been deleted. It was replaced by `flintGeometry.test.ts`, which is
strictly better on three counts: it imports the geometry rather than re-parsing the source with
regexes, it asserts invariants instead of reporting numbers, and — the decisive one — **it can
actually run in CI.** The PowerShell script never could: GitHub and GitLab runners are Linux.
A check that cannot run on the build machine is not a gate, however good its logic.
