// Tests for the Flint effort-mode domain module and its locale keys.
//
// Deliberately node-env, with no component test alongside it. Two reasons:
//
// 1. EffortModeMenu's non-trivial logic is viewport arithmetic built on
//    getBoundingClientRect / visualViewport, both of which jsdom reports as
//    zeroes — a jsdom test would assert nothing about the part most likely to
//    break, while its open/close/keyboard behaviour was verified against a real
//    browser at 375 px and desktop.
// 2. vitest.config.ts documents an intermittent worker-start failure that hits
//    only the jsdom files and aborts commits. A third jsdom file buys a third
//    exposure to it for coverage that would be largely theatre.
//
// What IS worth pinning here is the pure logic and the locale contract, because
// both fail silently: a bad stored pref renders an undefined icon, and a missing
// translation key renders the key itself in the UI.
import { describe, it, expect } from 'vitest';
// Imported with Vite's `?raw` rather than node:fs — tsconfig sets
// `types: ["vite/client"]`, so node's module types are not in this program.
import enUSRaw from '../../public/locales/en-US.json?raw';
import frFRRaw from '../../public/locales/fr-FR.json?raw';
import {
  ADVANCED_REPLY_MS,
  DEFAULT_EFFORT_MODE,
  EFFORT_MODE_IDS,
  REGULAR_REPLY_MS,
  STEP_MS,
  TAIL_MS,
  TRACE_STEP_KEYS,
  normaliseEffortMode,
  replyDelayMs,
} from './effort';

describe('normaliseEffortMode', () => {
  it('passes through every known mode', () => {
    for (const id of EFFORT_MODE_IDS) {
      expect(normaliseEffortMode(id)).toBe(id);
    }
  });

  // useUserPref returns unvalidated JSON.parse output typed as T, and never
  // clears a key it failed to understand — so these are the values that
  // genuinely reach this function from a stale or hand-edited localStorage.
  it.each([
    ['an unknown string', 'turbo'],
    ['the old capitalised label', 'Advanced'],
    ['undefined', undefined],
    ['null', null],
    ['a number', 2],
    ['an object', { id: 'advanced' }],
    ['an array', ['advanced']],
    ['an empty string', ''],
  ])('falls back to the default for %s', (_label, value) => {
    expect(normaliseEffortMode(value)).toBe(DEFAULT_EFFORT_MODE);
  });

  it('defaults to the cheaper mode', () => {
    expect(DEFAULT_EFFORT_MODE).toBe('regular');
  });
});

describe('reply timing', () => {
  it('leaves the regular delay at the original canned-reply value', () => {
    expect(replyDelayMs('regular')).toBe(1200);
    expect(REGULAR_REPLY_MS).toBe(1200);
  });

  it('derives the advanced delay from the step list so the two cannot drift', () => {
    expect(ADVANCED_REPLY_MS).toBe(TRACE_STEP_KEYS.length * STEP_MS + TAIL_MS);
    expect(replyDelayMs('advanced')).toBe(ADVANCED_REPLY_MS);
  });

  // The whole point of the mode is that it costs more. If this ever inverts,
  // the slower mode would return first and the transcript would interleave.
  it('makes advanced strictly slower than regular', () => {
    expect(replyDelayMs('advanced')).toBeGreaterThan(replyDelayMs('regular'));
  });

  it('keeps the advanced wait short enough to demo', () => {
    expect(ADVANCED_REPLY_MS).toBeLessThan(5000);
  });
});

describe('locale coverage', () => {
  const RAW: Record<string, string> = { 'en-US': enUSRaw, 'fr-FR': frFRRaw };
  const load = (locale: string) => JSON.parse(RAW[locale]) as Record<string, unknown>;

  const lookup = (dict: Record<string, unknown>, path: string): unknown =>
    path.split('.').reduce<unknown>((node, part) => {
      if (node && typeof node === 'object') return (node as Record<string, unknown>)[part];
      return undefined;
    }, dict);

  const REQUIRED_KEYS = [
    'chat.effort.triggerAria',
    'chat.effort.menuAria',
    'chat.effort.regular.label',
    'chat.effort.regular.description',
    'chat.effort.advanced.label',
    'chat.effort.advanced.description',
    'chat.effort.simulated',
    'chat.effort.traceRunning',
    'chat.effort.traceSummary',
    ...TRACE_STEP_KEYS,
  ];

  // A missing key is not an exception — LocalizationContext renders the key
  // string itself, so "chat.effort.advanced.label" would appear on the pill.
  it.each(['en-US', 'fr-FR'])('%s translates every effort key', (locale) => {
    const dict = load(locale);
    for (const key of REQUIRED_KEYS) {
      const value = lookup(dict, key);
      expect(typeof value, `${locale} is missing ${key}`).toBe('string');
      expect((value as string).length, `${locale} has an empty ${key}`).toBeGreaterThan(0);
    }
  });

  it('keeps the interpolation placeholders intact in both locales', () => {
    for (const locale of ['en-US', 'fr-FR']) {
      const dict = load(locale);
      expect(lookup(dict, 'chat.effort.triggerAria')).toContain('{{mode}}');
      expect(lookup(dict, 'chat.effort.traceSummary')).toContain('{{count}}');
    }
  });

  it('gives each mode a distinct label in both locales', () => {
    for (const locale of ['en-US', 'fr-FR']) {
      const dict = load(locale);
      expect(lookup(dict, 'chat.effort.regular.label')).not.toBe(
        lookup(dict, 'chat.effort.advanced.label')
      );
    }
  });
});
