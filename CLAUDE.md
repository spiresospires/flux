# Flux — Project Notes for Claude Code

## Project Overview

Flux is a React 18 + TypeScript front-end prototype for a FusionLive EDMS (Engineering Document Management System). Built with Vite, Tailwind CSS 3, Framer Motion, Lucide React, and React Router v6. All data is currently mocked — no live API.

**Run locally:** `npm run dev` (or double-click `flux-dev.bat`) → http://localhost:5173

---

## Architecture

```
src/
  components/     UI components (BrandBanner, LeftRail, FlintIcon, ColorCustomizer, etc.)
  contexts/       React context providers
  data/           Mock data (mockDashboard, mockDocuments, mockFolders, projects, etc.)
  hooks/          Custom React hooks (useUserPref)
  pages/          Route-level pages (Dashboard, DocumentBrowser, Chat, SearchResults, etc.)
  types/          Shared TypeScript types
  utils/          Utility functions (search, etc.)
```

### Key context providers

| Context | Purpose |
|---|---|
| `ScopeContext` | Enterprise vs project mode. Controls dashboard filtering and left-rail visibility. |
| `LocalizationContext` | `t()` translation helper. Locale files in `public/locales/`. |
| `ShellLayoutContext` | Left-rail visibility toggle. |
| `WorkspaceContext` | Active workspace state. |
| `ClipboardContext` | Cross-page document clipboard (pinned docs shared between pages). |
| `ViewStyleContext` | Global appearance (`light`/`dark`/`basic`) and layout (`floating`/`flush`). Always active — not gated by project. |
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
| Home | `enterprise` | Dashboard shows all-projects data; Documents hidden from left rail |
| Any project | `project` | Dashboard filters to that project; Documents visible in left rail |

**Resetting to Home:** `setScope({ kind: 'enterprise' })` + `navigate('/')`. The Dashboard `useEffect` watching `scope` resets `selectedSection` to `'overview'`.

**Single source of truth for projects:** `src/data/projects.ts` — exports `PROJECTS` array (ids: shard, skyline, tower, empire). All mock data imports from here.

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

Shared animated SVG component used in LeftRail nav and Chat empty state.

**Structure:** 1 centre node + 8 outer nodes connected by spokes. ViewBox `0 0 24 24`, radius 8.2, centre at (12, 12).

**Node colours:** `['#F472B6','#34D399','#FBBF24','#A78BFA', '#F472B6','#34D399','#FBBF24','#A78BFA']`

**Centre node:** `#0461BA`, r=2.1 (inactive), r=2.3 (active).

**Idle animation:** Each outer node drifts independently (`motion.g` + `FLINT_DRIFT_ANIMS` / `FLINT_DRIFT_TRANS` — **module-level constants** so Framer Motion never restarts the loop on parent re-render).

**Hover animation sequence (~1.1 s total):**
1. 8 spokes draw outward (`pathLength [0→1]`), staggered 38 ms each
2. Outer nodes radius-pulse
3. Centre node pulses
4. White corona ring expands and fades (`r → centreR+7`, opacity `[0, 0.9, 0]`, delay 0.5 s)
5. 4 white sparkle dots flash at cardinal midpoints (delay 0.52 s + stagger)

**Props:** `isHovered: boolean`, `isActive?: boolean`, `size?: number` (default 20).

**Used in:**
- `LeftRail`: size=20, `isActive` tied to route, `isHovered` tied to `hoveredId === 'chat'`
- `Chat` empty state: size=88, auto-plays once on mount via `useEffect` on `activeId`

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
- Panel renders as a `w-[360px] shrink-0 h-full` flex sibling of `content-panel` inside `browser-layout`.
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

Card click calls `navigate('/documents', { state: { folderId, selectedDocId, projectId, projectName } })`.
DocumentBrowser `useEffect` reads state, calls `setScope()`, pre-selects folder/doc.

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
- `Dashboard.tsx` lines ~394/453 callable expression errors
