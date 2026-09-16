// panelWidth — how wide a resizable side panel is drawn, and whether a drag is
// the user's desk intent. This is docs/responsive-architecture.md §5, the
// persistence rule, reduced to two pure functions.
//
// The problem it exists to prevent: useUserPref writes on every value change
// with no dirty guard, so the moment a viewport-derived width passes through it
// the user's desk layout is overwritten — silently, permanently, and (once
// preferences move to the Oracle user table, G02) across every device they own,
// with no undo. A thirty-second glance on a phone should not cost someone the
// panel widths they have had at their desk for a year.
//
// Pure, no React, no DOM — tested in the cheap `node` environment alongside
// viewport.ts. See §11's testing policy for why that matters here.

import type { ViewportClass } from './viewport';

export interface PanelWidthBounds {
  /** Narrowest the panel stays usable. Applied last so it always wins: a panel
   *  squeezed to nothing is less use than one that crowds the list. */
  min: number;
  /** Widest a desk drag may take it. */
  max: number;
  /** Used when nothing is stored yet, and when what is stored is not a number.
   *  useUserPref does no validation, so anything can come back out of
   *  localStorage — the same reason Chat's effort mode goes through
   *  normaliseEffortMode on every read. */
  fallback: number;
}

/** The widest a fixed-width side panel may be DRAWN on each class, whatever the
 *  user stored at their desk. `null` = no ceiling beyond the panel's own max.
 *
 *  These are ceilings, not targets — a desk user never meets one. They exist so
 *  that a 640px panel set on a 27" monitor does not arrive on a 768px tablet and
 *  leave ~70px for the document list.
 *
 *  Phone never draws a fixed-width side panel at all — it gets a full-width
 *  sheet (see CollapsibleFilterPanel's `variant`). Its entry is a floor under
 *  any caller that asks anyway, not a layout a user sees. */
const CLASS_CEILING: Record<ViewportClass, number | null> = {
  desktop: null,
  'tablet-landscape': 360,
  'tablet-portrait': 300,
  phone: 300,
};

/** The width to draw right now.
 *
 *  The stored value is desk intent and this never changes it: it is read, capped
 *  to what the screen in front of the user can spare, and handed back. Widening
 *  the window restores the stored width exactly, because nothing was lost. */
export function clampPanelWidth(
  stored: number,
  viewport: ViewportClass,
  bounds: PanelWidthBounds
): number {
  const intent = Number.isFinite(stored) ? stored : bounds.fallback;
  const ceiling = CLASS_CEILING[viewport] ?? bounds.max;
  return Math.max(Math.min(intent, ceiling), bounds.min);
}

/** Whether a width the user just dragged to is desk intent, and so may be
 *  written to the stored preference (decision P7).
 *
 *  Everything below desktop is a visit rather than an intent — a half-width
 *  window, a tablet, a phone. The user is telling us about right now, not about
 *  how they want to work. */
export function isDeskIntent(viewport: ViewportClass): boolean {
  return viewport === 'desktop';
}
