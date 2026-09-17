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

/** The widths a finger can choose between, narrowest first (decision P8).
 *
 *  Dragging is a mouse interaction: the handle is a 12px strip, and porting it
 *  to touch means either a target too thin to hit or one so fat it swallows its
 *  neighbours. Presets replace it rather than emulate it — three stops, so the
 *  choice is "how much room do I want", not a pixel hunt.
 *
 *  Derived from each panel's own limits rather than hard-coded, so a panel that
 *  needs 260px to be readable never offers 240, and every stop is a width that
 *  panel and this viewport can both honour. Deduplicated: where the usable
 *  minimum meets the class ceiling there may be fewer than three real choices,
 *  and offering the same width twice makes the control look broken. */
export function panelWidthPresets(viewport: ViewportClass, bounds: PanelWidthBounds): number[] {
  const narrow = clampPanelWidth(bounds.min, viewport, bounds);
  const wide = clampPanelWidth(bounds.max, viewport, bounds);
  const middle = clampPanelWidth(Math.round((narrow + wide) / 2), viewport, bounds);
  return [...new Set([narrow, middle, wide])].sort((a, b) => a - b);
}

/** The next preset after the current width, wrapping at the widest.
 *
 *  Matches on the nearest stop rather than an exact one, because the current
 *  width is usually a number dragged at a desk, not a preset — so the first tap
 *  moves somewhere predictable instead of jumping to the start of the list. */
export function nextPanelWidth(
  current: number,
  viewport: ViewportClass,
  bounds: PanelWidthBounds
): number {
  const presets = panelWidthPresets(viewport, bounds);
  const here = clampPanelWidth(current, viewport, bounds);
  let nearest = 0;
  for (let i = 1; i < presets.length; i++) {
    if (Math.abs(presets[i] - here) < Math.abs(presets[nearest] - here)) nearest = i;
  }
  return presets[(nearest + 1) % presets.length];
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
