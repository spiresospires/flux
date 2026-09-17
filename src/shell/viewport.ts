// viewport — the viewport→class mapping the whole responsive shell is built on.
// Pure functions, no React, no DOM: tested in the cheap `node` vitest
// environment with zero jsdom exposure. That matters because jsdom is slow to
// cold-import here (~80s), and vitest's per-worker start timeout is a hardcoded
// 60s that no config can raise — so a new jsdom test file can abort a commit
// via the local pre-commit hook. (The GitHub CI runner is ubuntu-latest; an
// earlier comment here blamed "Windows CI", which was wrong. The gate that
// actually bites is local.) See docs/responsive-architecture.md §2 and §11.
//
// Boundaries mirror Tailwind's UNMODIFIED default breakpoints (md 768 /
// lg 1024 / xl 1280), so the ~18 existing `md:`/`lg:`/`xl:` usages elsewhere in
// the app keep their current meaning. Do NOT add `theme.screens` to
// tailwind.config.js — see docs/responsive-architecture.md §3.
export type ViewportClass = 'phone' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

/** The canonical media queries, character-identical to the @media blocks in
 *  index.css. viewportStore hands these to matchMedia so the CSS tier and the
 *  JS tier are evaluated by the same engine against the same value — see the
 *  breakpoint comment in index.css for why they end in `.98` and why the two
 *  files must be changed together. */
export const VIEWPORT_QUERIES = {
  phone: '(max-width: 767.98px)',
  tabletPortrait: '(max-width: 1023.98px)',
  tabletLandscape: '(max-width: 1279.98px)',
} as const;

/** Where a pointer genuinely cannot hover, so drag affordances are unusable.
 *
 *  Character-identical to the `@media (pointer: coarse) and (hover: none)`
 *  block in index.css, for the same reason the width queries are — the CSS tier
 *  hides drag handles under it and the JS tier mounts their replacement, and a
 *  device matching one but not the other gets either two resize controls or
 *  none.
 *
 *  `hover: none` is load-bearing, not belt-and-braces: bare `pointer: coarse`
 *  also matches a touchscreen laptop or Surface at 1920px, which is ordinary
 *  hardware in a site office and squarely the desktop experience (decision P1).
 *  Those keep dragging, because they can. */
export const TOUCH_ONLY_QUERY = '(pointer: coarse) and (hover: none)';

export type ViewportMatches = { phone: boolean; tabletPortrait: boolean; tabletLandscape: boolean };

/** Map the three max-width matches to a class. The queries nest — phone implies
 *  tabletPortrait implies tabletLandscape — so the first match wins. */
export function classifyFromMatches(m: ViewportMatches): ViewportClass {
  if (m.phone) return 'phone';
  if (m.tabletPortrait) return 'tablet-portrait';
  if (m.tabletLandscape) return 'tablet-landscape';
  return 'desktop';
}

/** Width-based fallback for the one place matchMedia may be unavailable: an SSR
 *  probe, jsdom, an old webview. Its only non-test caller is viewportStore's
 *  fallback branch, and it should stay that way — `innerWidth` is
 *  integer-rounded while `@media` evaluates the fractional CSS viewport width,
 *  so a second caller would reintroduce exactly the tier disagreement the
 *  matchMedia path exists to prevent. Do not reach for this to get "the current
 *  width"; ask for the class, or read innerWidth at the call site knowing why. */
export function classifyViewport(width: number): ViewportClass {
  if (width < 768) return 'phone';
  if (width < 1024) return 'tablet-portrait';
  if (width < 1280) return 'tablet-landscape';
  return 'desktop';
}

/** How primary navigation is PRESENTED. Derived from viewport class plus a
 *  user preference (rail collapse) — never persisted itself. */
export type NavMode =
  | 'rail'      // 88px vertical rail, icon + label   (desktop, tablet-landscape)
  | 'rail-icon' // 56px vertical rail, icon only      (tablet-portrait, or user-collapsed)
  | 'mobile';   // rail unmounted; bottom tabs + drawer (phone)

export function resolveNavMode(viewport: ViewportClass, isRailCollapsed: boolean): NavMode {
  if (viewport === 'phone') return 'mobile';
  if (viewport === 'tablet-portrait') return 'rail-icon';
  return isRailCollapsed ? 'rail-icon' : 'rail';
}

/** How the object-properties panel is PRESENTED. */
export type DetailPanelVariant =
  | 'split'   // inline third column, caller owns the width  (desktop, tablet-landscape)
  | 'drawer'  // right-hand overlay with a backdrop          (tablet-portrait)
  | 'sheet';  // bottom sheet with a backdrop                (phone)

/** Chosen by the caller, never by the panel — see §7. The panel's subtree holds
 *  two of the repo's only jsdom-tested components, and this keeps viewport
 *  logic out of it.
 *
 *  `sheet` is not a nicety: the drawer is `w-1/2 min-w-[380px]`, and on a 375px
 *  phone the minimum beats the half, so the drawer renders WIDER than the
 *  screen. A side panel is the wrong shape for a phone regardless — vertical
 *  space is what a phone has. */
export function resolveDetailPanelVariant(viewport: ViewportClass): DetailPanelVariant {
  if (viewport === 'phone') return 'sheet';
  if (viewport === 'tablet-portrait') return 'drawer';
  return 'split';
}

/** How the folder-tree / filter pane is PRESENTED. */
export type FilterPaneMode =
  | 'inline'  // a column in the browser layout        (desktop, tablet-landscape)
  | 'drawer'  // overlay beside the rail, with backdrop (tablet-portrait)
  | 'sheet';  // full-bleed overlay                     (phone)

/** Same shape as the detail panel, one tier apart, and for the same reason:
 *  at 768px the document table cannot spare 320px to a tree AND stay a usable
 *  list, so the pane stops being a column and starts being something you open.
 *
 *  Both overlay modes close when a folder is picked (decision P10) — picking is
 *  one decision, and the point of it is to see what you picked. */
export function resolveFilterPaneMode(viewport: ViewportClass): FilterPaneMode {
  if (viewport === 'phone') return 'sheet';
  if (viewport === 'tablet-portrait') return 'drawer';
  return 'inline';
}
