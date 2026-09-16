import { describe, it, expect } from 'vitest';
import {
  FLINT_HEX_PATHS,
  FLINT_LOCKUP_MARK_SLOT,
  FLINT_MARK_CENTRE,
  FLINT_MARK_VIEWBOX_HEIGHT,
  FLINT_MARK_VIEWBOX_WIDTH,
  FLINT_RAY_PATHS,
  FLINT_WORDMARK_PATHS,
} from './flintArt';

const allPaths = [...FLINT_HEX_PATHS, ...FLINT_RAY_PATHS, ...FLINT_WORDMARK_PATHS];

describe('flint artwork', () => {
  it('has the hexagon as exactly two subpaths', () => {
    // These two are the outer and inner edge of the hexagon's stroke, and they
    // must be rendered inside ONE <path> element so the nonzero fill rule
    // punches the middle out. Rendered as two separate elements each fills
    // independently and the mark becomes a solid blob — a real regression that
    // reached the browser once. If this count ever changes, re-check FlintIcon's
    // HexPaths, which joins them.
    expect(FLINT_HEX_PATHS).toHaveLength(2);
  });

  it('has six spark rays', () => {
    expect(FLINT_RAY_PATHS).toHaveLength(6);
  });

  it('has five wordmark letters for "Flint"', () => {
    expect(FLINT_WORDMARK_PATHS).toHaveLength(5);
  });

  it('holds only well-formed, closed subpaths', () => {
    for (const d of allPaths) {
      expect(d.startsWith('M'), `should start with a moveto: ${d.slice(0, 24)}`).toBe(true);
      expect(d.endsWith('Z'), `should be closed: …${d.slice(-24)}`).toBe(true);
    }
  });

  it('keeps every ray a single subpath, so each animates independently', () => {
    for (const d of FLINT_RAY_PATHS) {
      expect((d.match(/M/g) ?? []).length, `one moveto per ray: ${d.slice(0, 24)}`).toBe(1);
    }
  });

  it('places the rays around the centre of the mark', () => {
    // Cheap sanity check that centre and artwork have not drifted apart: the
    // centre must sit inside the mark's own viewBox, not at its origin.
    expect(FLINT_MARK_CENTRE.x).toBeCloseTo(FLINT_MARK_VIEWBOX_WIDTH / 2, 2);
    expect(FLINT_MARK_CENTRE.y).toBeCloseTo(FLINT_MARK_VIEWBOX_HEIGHT / 2, 2);
  });

  it('gives the lockup mark slot the mark\'s own aspect ratio', () => {
    // The lockup places the mark in a nested viewport. If the slot's aspect
    // drifts from the mark's, the composed lockup stops matching the artwork
    // the design team supplied.
    const slotAspect = FLINT_LOCKUP_MARK_SLOT.width / FLINT_LOCKUP_MARK_SLOT.height;
    const markAspect = FLINT_MARK_VIEWBOX_WIDTH / FLINT_MARK_VIEWBOX_HEIGHT;
    expect(slotAspect).toBeCloseTo(markAspect, 3);
  });
});
