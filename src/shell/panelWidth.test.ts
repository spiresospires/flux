import { describe, it, expect } from 'vitest';
import { clampPanelWidth, isDeskIntent, type PanelWidthBounds } from './panelWidth';
import type { ViewportClass } from './viewport';

// The real detail panel. Its min (260) sits below every class ceiling, which is
// the ordinary case.
const PANEL: PanelWidthBounds = { min: 260, max: 640, fallback: 360 };

// A panel whose minimum is WIDER than the tablet ceilings. Contrived, but it is
// the case where two rules genuinely disagree, and the answer has to be stated
// rather than discovered.
const WIDE_MIN: PanelWidthBounds = { min: 420, max: 640, fallback: 480 };

const CLASSES: ViewportClass[] = ['phone', 'tablet-portrait', 'tablet-landscape', 'desktop'];

describe('clampPanelWidth', () => {
  it('leaves a desk width alone', () => {
    expect(clampPanelWidth(360, 'desktop', PANEL)).toBe(360);
    expect(clampPanelWidth(500, 'desktop', PANEL)).toBe(500);
  });

  it('holds a desk width to the panel’s own bounds', () => {
    expect(clampPanelWidth(900, 'desktop', PANEL)).toBe(640);
    expect(clampPanelWidth(10, 'desktop', PANEL)).toBe(260);
  });

  it('caps a desk width down to what a tablet can spare', () => {
    expect(clampPanelWidth(640, 'tablet-landscape', PANEL)).toBe(360);
    expect(clampPanelWidth(640, 'tablet-portrait', PANEL)).toBe(300);
  });

  it('does not widen a panel the user had set narrow', () => {
    // Ceilings are ceilings, not targets — 280 is under both and stays put.
    expect(clampPanelWidth(280, 'tablet-portrait', PANEL)).toBe(280);
  });

  it('lets the usable minimum win over a class ceiling', () => {
    // 420 min vs a 300 ceiling: crowding the list beats rendering a panel too
    // narrow to read. Asserted because it is a deliberate choice, not a
    // consequence of the arithmetic falling out one way.
    expect(clampPanelWidth(480, 'tablet-portrait', WIDE_MIN)).toBe(420);
  });

  it('falls back when localStorage hands back something that is not a number', () => {
    // useUserPref does no validation, so this is reachable, not theoretical.
    expect(clampPanelWidth(NaN, 'desktop', PANEL)).toBe(360);
    expect(clampPanelWidth(Number.POSITIVE_INFINITY, 'desktop', PANEL)).toBe(360);
    expect(clampPanelWidth(undefined as unknown as number, 'desktop', PANEL)).toBe(360);
  });

  it('always returns a width inside the panel’s bounds, on every class', () => {
    const stored = [-500, 0, 1, 259, 260, 300, 360, 500, 640, 641, 5000, NaN];
    for (const viewport of CLASSES) {
      for (const w of stored) {
        const got = clampPanelWidth(w, viewport, PANEL);
        expect(got, `${viewport} @ ${w}`).toBeGreaterThanOrEqual(PANEL.min);
        expect(got, `${viewport} @ ${w}`).toBeLessThanOrEqual(PANEL.max);
      }
    }
  });

  it('never gives a narrower screen a wider panel', () => {
    // Pins the ceiling table's ordering. Editing one ceiling without looking at
    // its neighbours is exactly the mistake this catches.
    for (const w of [260, 300, 360, 420, 500, 640]) {
      const phone = clampPanelWidth(w, 'phone', PANEL);
      const portrait = clampPanelWidth(w, 'tablet-portrait', PANEL);
      const landscape = clampPanelWidth(w, 'tablet-landscape', PANEL);
      const desktop = clampPanelWidth(w, 'desktop', PANEL);
      expect(phone, `@ ${w}`).toBeLessThanOrEqual(portrait);
      expect(portrait, `@ ${w}`).toBeLessThanOrEqual(landscape);
      expect(landscape, `@ ${w}`).toBeLessThanOrEqual(desktop);
    }
  });

  it('gives the desk width back untouched after a narrow visit', () => {
    // The whole point of P7: whatever a tablet drew, the stored value is
    // unchanged, so widening the window restores the layout exactly.
    const desk = 600;
    clampPanelWidth(desk, 'phone', PANEL);
    clampPanelWidth(desk, 'tablet-portrait', PANEL);
    expect(clampPanelWidth(desk, 'desktop', PANEL)).toBe(600);
  });
});

describe('isDeskIntent', () => {
  it('is true only at desktop', () => {
    expect(isDeskIntent('desktop')).toBe(true);
    expect(isDeskIntent('tablet-landscape')).toBe(false);
    expect(isDeskIntent('tablet-portrait')).toBe(false);
    expect(isDeskIntent('phone')).toBe(false);
  });
});
