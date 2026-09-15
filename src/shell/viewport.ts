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
