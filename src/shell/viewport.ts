// viewport — the width→class mapping the whole responsive shell is built on.
// Pure function, no React, no DOM: tested in the cheap `node` vitest
// environment with zero jsdom exposure (see docs/responsive-architecture.md
// §2 and §11 — jsdom 29.1.1 has no matchMedia, and every new jsdom test file
// costs a 60s-gated worker start on this repo's Windows CI).
//
// Boundaries mirror Tailwind's UNMODIFIED default breakpoints (md 768 / lg
// 1024 / xl 1280) so the CSS tier (index.css @media blocks) and this JS tier
// can never disagree, and the ~18 existing `md:`/`lg:`/`xl:` usages elsewhere
// in the app keep their current meaning. Do NOT add `theme.screens` to
// tailwind.config.js — see docs/responsive-architecture.md §3.
export type ViewportClass = 'phone' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

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
