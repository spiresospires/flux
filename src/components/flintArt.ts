// flintArt — the Flint mark and wordmark as path data, from the design team's
// 2026-09-15 iconography refresh (`FusionLive AI chat mockups.zip`).
//
// The supplied SVGs ship both artworks as a single merged `<path>`. They are
// split here because the six spark rays have to be animated independently on
// the Chat screen — a merged path can only be animated as one lump. The split
// is lossless: every subpath below is copied verbatim from the source file,
// only divided at its `Z` terminators.
//
// The source files also carry a large embedded metadata block (~7.7KB on the
// mark alone, more than five times the artwork itself). It is dropped here —
// it has no rendering effect and would otherwise ship in every bundle.
//
// Both artworks are authored against `currentColor`, so a single copy themes
// itself from CSS: nav state, dark mode and the brand navy are all just a
// `color` on an ancestor. The navy/white/slate variants in the zip exist for
// contexts that cannot supply one, and are not needed here.

/** The mark's own coordinate system, as authored. */
export const FLINT_MARK_VIEWBOX_WIDTH = 14.59;
export const FLINT_MARK_VIEWBOX_HEIGHT = 16;

/** Square viewBox for icon slots: the mark is slightly taller than it is wide,
 *  so it is centred in a 16×16 box rather than stretched. This keeps it
 *  drop-in compatible with the square Lucide icons it sits beside. */
export const FLINT_MARK_SQUARE_VIEWBOX = '-0.705 0 16 16';

/** Centre of the mark, in mark coordinates. The rays scale from this point, so
 *  they read as radiating outward rather than each growing in place. */
export const FLINT_MARK_CENTRE = { x: 7.295, y: 8 } as const;

/** The hexagon container — two subpaths, the outer and inner edge of its
 *  stroke. Static in every presentation. */
export const FLINT_HEX_PATHS: readonly string[] = [
  'M6.69,14.87l-5.09-2.91c-.38-.22-.61-.62-.61-1.05v-5.81c0-.44.23-.84.61-1.05L6.69,1.13c.37-.21.83-.21,1.2,0l5.09,2.91c.38.22.61.62.61,1.05v5.81c0,.43-.23.84-.61,1.05l-5.09,2.91c-.37.21-.83.21-1.2,0Z',
  'M13.47,12.8c.68-.39,1.1-1.11,1.1-1.89v-5.81c0-.78-.42-1.51-1.1-1.89L8.38.29c-.67-.38-1.49-.38-2.17,0L1.12,3.2C.44,3.59.02,4.32.02,5.1v5.81c0,.78.42,1.51,1.1,1.89l5.09,2.91c.67.38,1.49.38,2.17,0l5.09-2.91Z',
];

/** The six spark rays, ordered CLOCKWISE FROM 12 O'CLOCK. The order is the
 *  animation's stagger order, so it sweeps around the mark instead of jumping
 *  about — it is not the order they appear in the source path. */
export const FLINT_RAY_PATHS: readonly string[] = [
  // 12 o'clock — short vertical, above centre
  'M7.79,5.97v-1.37c0-.28-.22-.5-.5-.5s-.5.22-.5.5v1.37c0,.28.22.5.5.5s.5-.22.5-.5Z',
  // 2 o'clock — long diagonal, upper right
  'M8.89,7.68l1.97-1.14c.24-.14.32-.44.18-.68-.14-.24-.44-.32-.68-.18l-1.97,1.14c-.24.14-.32.44-.18.68.09.16.26.25.43.25.08,0,.17-.02.25-.07Z',
  // 4 o'clock — stub, lower right
  'M10.03,9.6c.14-.24.06-.55-.18-.68l-.39-.23c-.24-.14-.55-.06-.68.18-.14.24-.06.55.18.68l.39.23c.08.05.16.07.25.07.17,0,.34-.09.43-.25Z',
  // 6 o'clock — long vertical, below centre
  'M7.79,11.39v-1.82c0-.28-.22-.5-.5-.5s-.5.22-.5.5v1.82c0,.28.22.5.5.5s.5-.22.5-.5Z',
  // 8 o'clock — stub, lower left
  'M5.4,9.69l.79-.46c.24-.14.32-.44.18-.68-.14-.24-.44-.32-.68-.18l-.79.46c-.24.14-.32.44-.18.68.09.16.26.25.43.25.08,0,.17-.02.25-.07Z',
  // 10 o'clock — long diagonal, upper left
  'M6,7.27c.14-.24.06-.55-.18-.68l-2.37-1.37c-.24-.14-.55-.06-.68.18-.14.24-.06.55.18.68l2.37,1.37c.08.05.16.07.25.07.17,0,.34-.09.43-.25Z',
];

/** The lockup (mark + "Flint" wordmark) in the design team's own layout. */
export const FLINT_LOCKUP_VIEWBOX = '0 0 432 170';

/** "Flint", as five letter paths, in lockup coordinates. */
export const FLINT_WORDMARK_PATHS: readonly string[] = [
  'M195.43,130V39.97h55.95v10.55h-43.09v29.2h36.01v10.29h-36.01v40h-12.86Z',
  'M263.21,130V39.97h12.86v90.03h-12.86Z',
  'M299.86,52.96c-2.49,0-4.52-.77-6.11-2.31-1.59-1.54-2.38-3.52-2.38-5.92s.79-4.22,2.38-5.72c1.58-1.5,3.62-2.25,6.11-2.25s4.42.75,6.05,2.25c1.63,1.5,2.44,3.41,2.44,5.72s-.81,4.37-2.44,5.92c-1.63,1.54-3.64,2.31-6.05,2.31ZM293.31,130v-64.82h12.86v64.82h-12.86Z',
  'M323.27,130v-64.82h11.58l.77,11.06c2.06-3.86,4.97-6.92,8.75-9.2,3.77-2.27,8.1-3.41,12.99-3.41,5.14,0,9.56,1.03,13.25,3.09,3.68,2.06,6.56,5.17,8.62,9.32,2.06,4.16,3.09,9.37,3.09,15.63v38.33h-12.86v-37.04c0-6-1.33-10.55-3.99-13.63-2.66-3.09-6.52-4.63-11.57-4.63-3.35,0-6.35.79-9,2.38-2.66,1.59-4.78,3.92-6.37,7.01-1.59,3.09-2.38,6.86-2.38,11.32v34.6h-12.86Z',
  'M420.38,130c-4.12,0-7.67-.64-10.67-1.93-3-1.29-5.32-3.43-6.95-6.43-1.63-3-2.44-7.07-2.44-12.22v-33.31h-11.19v-10.93h11.19l1.54-16.2h11.32v16.2h18.39v10.93h-18.39v33.44c0,3.69.77,6.2,2.32,7.52,1.54,1.33,4.2,1.99,7.97,1.99h7.46v10.93h-10.55Z',
];

/** Where the mark sits inside the lockup. Derived from the source file and
 *  verified against all eight subpath origins to sub-pixel accuracy, so the
 *  composed lockup is geometrically identical to the supplied artwork. */
export const FLINT_LOCKUP_MARK_SLOT = { x: 0.25, y: 0, width: 155, height: 170 } as const;
