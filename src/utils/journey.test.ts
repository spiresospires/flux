import { describe, it, expect } from 'vitest';
import { resolveCurrentIndex, earnedAt } from './journey';
import type { JourneyStep } from '../types/journey';

// How the journey decides which node is "you are here". The subtle rule is the
// LAST status match rather than the first: a rejected document revisits an
// earlier stage at a new revision, so the same status legitimately appears twice
// and the later occurrence is the live one.

function step(overrides: Partial<JourneyStep> & { key: string }): JourneyStep {
  return { label: overrides.key, icon: 'upload', ...overrides };
}

const LINEAR: JourneyStep[] = [
  step({ key: 'placeholder', status: 'Placeholder', date: '2026-01-01' }),
  step({ key: 'uploaded', status: 'New', date: '2026-02-01' }),
  step({ key: 'review', status: 'Under Review', date: '2026-03-01' }),
  step({ key: 'approval', status: 'Approved' }),
  step({ key: 'asBuilt' }),
];

/** The loop: placeholder → review → rejected → placeholder again. */
const LOOPED: JourneyStep[] = [
  step({ key: 'placeholder-a', status: 'Placeholder', date: '2026-01-01' }),
  step({ key: 'uploaded-a', status: 'New', date: '2026-02-01' }),
  step({ key: 'review-a', status: 'Under Review', date: '2026-03-01' }),
  step({ key: 'rejected', branch: 'rejection', icon: 'rejected', date: '2026-03-15' }),
  step({ key: 'placeholder-b', status: 'Placeholder', date: '2026-04-01' }),
  step({ key: 'uploaded-b', status: 'New' }),
];

describe('resolveCurrentIndex', () => {
  it('matches the document status to its rung', () => {
    expect(resolveCurrentIndex(LINEAR, 'Under Review')).toBe(2);
    expect(resolveCurrentIndex(LINEAR, 'Placeholder')).toBe(0);
  });

  it('picks the LAST match when a status recurs after a rejection', () => {
    // Picking the first would strand the marker on the original placeholder and
    // report the document as further along than it is.
    expect(resolveCurrentIndex(LOOPED, 'Placeholder')).toBe(4);
  });

  it('never lands on a rejection branch', () => {
    // A rejection is not a rung — the document does not sit there.
    const idx = resolveCurrentIndex(LOOPED, 'Placeholder');
    expect(LOOPED[idx].branch).toBeUndefined();
  });

  it('falls back to the most recent dated step when the status matches nothing', () => {
    expect(resolveCurrentIndex(LINEAR, 'Issued')).toBe(2);
    expect(resolveCurrentIndex(LOOPED, 'Issued')).toBe(4);
  });

  it('falls back to the most recent dated step when no status is given', () => {
    expect(resolveCurrentIndex(LINEAR)).toBe(2);
  });

  it('lets an explicit step key win over the status', () => {
    expect(resolveCurrentIndex(LOOPED, 'Placeholder', 'placeholder-a')).toBe(0);
  });

  it('ignores an unknown step key rather than losing the marker', () => {
    expect(resolveCurrentIndex(LINEAR, 'Under Review', 'no-such-step')).toBe(2);
  });

  it('returns the first step when nothing has happened yet', () => {
    const untouched = [step({ key: 'a' }), step({ key: 'b' })];
    expect(resolveCurrentIndex(untouched)).toBe(0);
  });
});

describe('earnedAt', () => {
  const WEIGHTED: JourneyStep[] = [
    step({ key: 'placeholder', earnedPercent: 0 }),
    step({ key: 'uploaded', earnedPercent: 10 }),
    step({ key: 'review', earnedPercent: 25 }),
    step({ key: 'rejected', branch: 'rejection', icon: 'rejected' }),
    step({ key: 'approval', earnedPercent: 50 }),
  ];

  it('reports the percentage of the current rung', () => {
    expect(earnedAt(WEIGHTED, 2)).toBe(25);
    expect(earnedAt(WEIGHTED, 4)).toBe(50);
  });

  it('walks back past steps that earn nothing', () => {
    // Landing on a rejection must not read as "0% earned" — the document keeps
    // what its last real rung was worth.
    expect(earnedAt(WEIGHTED, 3)).toBe(25);
  });

  it('reports zero when nothing has been earned yet', () => {
    expect(earnedAt([step({ key: 'rejected', branch: 'rejection' })], 0)).toBe(0);
    expect(earnedAt([], 0)).toBe(0);
  });
});
