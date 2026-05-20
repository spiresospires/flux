# Flux — Project Notes for Claude Code

## Project Overview

Flux is a React 18 + TypeScript front-end prototype for a document management system (EDMS). It is built with Vite, Tailwind CSS 3, Framer Motion, Lucide React icons, and React Router v6. All data is currently mocked (no live API).

**Run locally:** `npm run dev` (or double-click `flux-dev.bat`) → http://localhost:5173

---

## Architecture

```
src/
  components/     UI components (BrandBanner, LeftRail, DetailSlidePanel, etc.)
  contexts/       React context providers (ScopeContext, LocalizationContext, etc.)
  data/           Mock data (mockDashboard, mockDocuments, mockFolders, etc.)
  pages/          Route-level pages (Dashboard, DocumentBrowser, SearchResults, etc.)
  types/          Shared TypeScript types
  utils/          Utility functions (search, etc.)
```

Key context providers:
- **ScopeContext** — tracks whether the user is in `enterprise` (Home / all projects) or `project` (single project) mode. Controls dashboard data filtering and left-rail visibility rules.
- **LocalizationContext** — provides the `t()` translation helper.
- **ShellLayoutContext** — controls left-rail visibility toggle.

---

## UI Conventions

- Brand colour: `#0461BA` (blue), used for active states, focus rings, links.
- Background colour: `#EAEEF6` (page bg), `#E8F1FB` (active nav/chip bg).
- All panels use `bg-white border border-neutral-200 rounded-xl shadow-sm`.
- Search inputs: `h-7 pl-8 pr-2 rounded-md border border-neutral-200 bg-[#F0F4F8] text-xs ... focus:ring-2 focus:ring-[#0461BA] focus:bg-white`.
- The top banner is fixed at `h-[45px]`; page content uses `mt-[45px]`.

---

## Scope / Workspace Behaviour

The top-banner workspace dropdown sets `ScopeContext`:

| Selection | `scope.kind` | Effect |
|-----------|-------------|--------|
| Home      | `enterprise` | Dashboard shows all-projects data; Documents hidden from left rail |
| Any project | `project` | Dashboard filters to that project; Documents visible in left rail |

**Resetting to Home** (e.g. clicking the company logo in the left rail) must:
1. Call `setScope({ kind: 'enterprise' })`.
2. Navigate to `/`.
3. The Dashboard `useEffect` watching `scope` will reset `selectedSection` to `'overview'`.

---

## Left Rail

Order of nav items (top to bottom): **Chat → Search → Documents**

- **Documents** is conditionally rendered — only when `scope.kind === 'project'`.
- The company logo button is the Home / dashboard shortcut. Clicking it resets scope to enterprise and navigates to `/`.

---

## Recent UI Changes (session log)

### Dashboard (`src/pages/Dashboard.tsx`)
- Grid container: added `items-start` so both the nav panel (left) and content panel (right) align to the top of the row.
- Left nav panel: changed `sticky top-3` → `sticky top-0` to prevent the 12 px downward offset caused by the sticky threshold pushing the panel below the grid row top.
- "Highlights Overview" header button: active-state background changed from `bg-[#E8F1FB]` to `bg-white` so the header is always white, consistent with the rest of the panel.
- Added `useEffect` on `scope`: when scope reverts to `enterprise`, `selectedSection` resets to `'overview'`.

### BrandBanner (`src/components/BrandBanner.tsx`)
- Scope dropdown button width: dynamically sized to the longest project name using a hidden measurement `<span>` + `ResizeObserver`. Capped so the button's right edge never comes within 100 px of the search input's left edge.
- Chevron: pushed to the far right of the button via `flex-1 min-w-0` on the label span and `ml-auto` on the chevron icon.
- Replaced the static "PROJECTS" divider label in the dropdown with a live search input (same styling as app search boxes). Filters the project list in real time; clears on close.

### LeftRail (`src/components/LeftRail.tsx`)
- Nav order changed to: Chat → Search → Documents.
- Documents item is now conditionally included based on `scope.kind === 'project'` (hidden on enterprise/Home scope).
- Logo button onClick now calls `setScope({ kind: 'enterprise' })` in addition to `navigate('/')`.
- Imported `useScope` from `ScopeContext`.

---

## FILENAME SANITISATION & ENCODING RULES (EDMS Engineering Requirements)

These rules apply to any code that handles file uploads, filename display, database storage, or file download preparation.

### 1. Preserve Engineering Unit Symbols
Do **not** strip feet (`′`) or inches (`″`) symbols during sanitisation. These are valid, meaningful characters in engineering document filenames (e.g. `12″ Pipe Spool Drawing.pdf`).

### 2. Recognised Unicode Workarounds for Quotes in Filenames
Engineers commonly use the following safe substitutes for the double-quote character (`"`, which is blocked by Windows OS in filenames):

| Symbol | Unicode | Meaning | Example |
|--------|---------|---------|---------|
| Double Prime | `″` U+2033 | inches | `6″ flange detail` |
| Two single quotes | `''` ASCII 39×2 | inches (fallback) | `6'' flange detail` |
| Right double quotation mark | `"` U+201D | inches (smart quote) | `6" flange detail` |
| Single Prime | `′` U+2032 | feet | `10′ beam` |

### 3. Core System Requirements

**UTF-8 everywhere**
All filename handling, storage, and database schemas must use strict UTF-8 encoding. Do not use Latin-1 or Windows-1252 code pages — these cause silent text corruption (mojibake) when prime/double-prime characters are stored or retrieved.

**Safe conversion on Windows download**
When preparing a filename for download on Windows (where `"` is a forbidden OS character), automatically convert the raw double-quote to its safe engineering equivalent (`″` Double Prime or `''` two single quotes) rather than simply deleting it. Deletion destroys the engineering meaning of the filename.

**Backend validation regex**
Ensure any server-side or client-side filename validation regex explicitly permits these Unicode engineering symbols. A regex that only allows `[a-zA-Z0-9._\-\s]` will incorrectly reject valid engineering filenames. Extend the allowlist to include at minimum: `′″'"`.

**Example safe sanitisation function (TypeScript)**
```ts
// Convert OS-blocked characters to safe engineering equivalents
function sanitiseFilenameForWindows(name: string): string {
  return name
    .replace(/"/g, '″')   // true double-quote → Double Prime (U+2033)
    .replace(/[<>:/\\|?*]/g, '_'); // other Windows-blocked chars → underscore
}
```
