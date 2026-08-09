import { describe, it, expect } from 'vitest';
import { isPlaceholder, isOverdue } from './document';

// The two predicates every placeholder-aware surface keys off. They are the
// reason content affordances (upload vs view/download/rendition) never depend on
// a status string — FusionLive customers rename their status ladders, so a
// string comparison would silently break per workspace.

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

describe('isPlaceholder', () => {
  it('treats a record with no contentState as having content', () => {
    // Every document that predates the field has a file — the field is optional
    // precisely so legacy records (old briefcase snapshots) are unaffected.
    expect(isPlaceholder({})).toBe(false);
    expect(isPlaceholder({ contentState: undefined })).toBe(false);
  });

  it('is true only for an explicit placeholder', () => {
    expect(isPlaceholder({ contentState: 'placeholder' })).toBe(true);
    expect(isPlaceholder({ contentState: 'content' })).toBe(false);
  });
});

describe('isOverdue', () => {
  it('is false for records with content, whatever date they carry', () => {
    // A delivered document cannot be overdue — it arrived.
    expect(isOverdue({ contentState: 'content', dateExpected: yesterday })).toBe(false);
    expect(isOverdue({ dateExpected: yesterday })).toBe(false);
  });

  it('is true for a placeholder past its expected date', () => {
    expect(isOverdue({ contentState: 'placeholder', dateExpected: yesterday })).toBe(true);
  });

  it('is false for a placeholder still within its schedule', () => {
    expect(isOverdue({ contentState: 'placeholder', dateExpected: tomorrow })).toBe(false);
  });

  it('is not overdue on the due date itself', () => {
    // Strictly-before comparison: a deliverable due today is not yet late.
    expect(isOverdue({ contentState: 'placeholder', dateExpected: today })).toBe(false);
  });

  it('is false for a placeholder with no delivery date', () => {
    expect(isOverdue({ contentState: 'placeholder' })).toBe(false);
  });
});
