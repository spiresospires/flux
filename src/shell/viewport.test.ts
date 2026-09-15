import { describe, it, expect } from 'vitest';
import {
  VIEWPORT_QUERIES,
  classifyFromMatches,
  classifyViewport,
  resolveNavMode,
} from './viewport';

describe('classifyViewport', () => {
  it('classifies phone below 768', () => {
    expect(classifyViewport(0)).toBe('phone');
    expect(classifyViewport(375)).toBe('phone');
    expect(classifyViewport(767)).toBe('phone');
  });

  it('classifies tablet-portrait 768-1023', () => {
    expect(classifyViewport(768)).toBe('tablet-portrait');
    expect(classifyViewport(1023)).toBe('tablet-portrait');
  });

  it('classifies tablet-landscape 1024-1279', () => {
    expect(classifyViewport(1024)).toBe('tablet-landscape');
    expect(classifyViewport(1279)).toBe('tablet-landscape');
  });

  it('classifies desktop at 1280 and above', () => {
    expect(classifyViewport(1280)).toBe('desktop');
    expect(classifyViewport(2560)).toBe('desktop');
  });
});

describe('resolveNavMode', () => {
  it('is always mobile on phone, regardless of collapse preference', () => {
    expect(resolveNavMode('phone', false)).toBe('mobile');
    expect(resolveNavMode('phone', true)).toBe('mobile');
  });

  it('is always rail-icon on tablet-portrait, regardless of collapse preference', () => {
    expect(resolveNavMode('tablet-portrait', false)).toBe('rail-icon');
    expect(resolveNavMode('tablet-portrait', true)).toBe('rail-icon');
  });

  it('follows the collapse preference on tablet-landscape and desktop', () => {
    expect(resolveNavMode('tablet-landscape', false)).toBe('rail');
    expect(resolveNavMode('tablet-landscape', true)).toBe('rail-icon');
    expect(resolveNavMode('desktop', false)).toBe('rail');
    expect(resolveNavMode('desktop', true)).toBe('rail-icon');
  });
});

describe('classifyFromMatches', () => {
  // The three queries are nested max-widths, so a phone matches all three and
  // a desktop matches none. These are the only shapes matchMedia can produce.
  it('takes the narrowest matching class', () => {
    expect(classifyFromMatches({ phone: true, tabletPortrait: true, tabletLandscape: true })).toBe('phone');
    expect(classifyFromMatches({ phone: false, tabletPortrait: true, tabletLandscape: true })).toBe('tablet-portrait');
    expect(classifyFromMatches({ phone: false, tabletPortrait: false, tabletLandscape: true })).toBe('tablet-landscape');
    expect(classifyFromMatches({ phone: false, tabletPortrait: false, tabletLandscape: false })).toBe('desktop');
  });

  it('agrees with the width-based fallback on either side of every boundary', () => {
    const widths = [0, 375, 767, 768, 1023, 1024, 1279, 1280, 2560];
    for (const w of widths) {
      const viaMatches = classifyFromMatches({
        phone: w <= 767.98,
        tabletPortrait: w <= 1023.98,
        tabletLandscape: w <= 1279.98,
      });
      expect(viaMatches, `width ${w}`).toBe(classifyViewport(w));
    }
  });
});

describe('VIEWPORT_QUERIES', () => {
  // The guarantee that the CSS tier and the JS tier cannot disagree rests on
  // these being the SAME strings index.css uses in its @media blocks.
  //
  // This is a tripwire, not a cross-file check: it fails if the JS strings are
  // edited, forcing whoever did it to read this comment and update index.css in
  // the same commit. Reading index.css from here was tried and rejected —
  // `?raw` returns empty for CSS under Vite's node transform, and node:fs would
  // mean adding "node" to tsconfig's `types`, leaking Node globals into every
  // browser file to protect one assertion.
  //
  // The matching @media blocks live under "Shell responsive breakpoints" in
  // src/index.css, which carries the same warning pointing back here.
  it('matches the @media blocks in index.css verbatim', () => {
    expect(VIEWPORT_QUERIES.phone).toBe('(max-width: 767.98px)');
    expect(VIEWPORT_QUERIES.tabletPortrait).toBe('(max-width: 1023.98px)');
    // No @media block exists for the tablet-landscape/desktop boundary yet —
    // nothing in the CSS tier changes there. If one is ever added it must use
    // this string verbatim.
    expect(VIEWPORT_QUERIES.tabletLandscape).toBe('(max-width: 1279.98px)');
  });
});
