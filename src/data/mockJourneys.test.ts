import { describe, it, expect } from 'vitest';
import { buildJourney, buildVersionStack } from './mockJourneys';
import { mockPlaceholdersByProject } from './mockPlaceholders';
import { mockDocumentsByProject } from './mockDocuments';
import { isPlaceholder } from '../types/document';
import type { Document } from '../types/document';
import { PROJECTS } from './projects';

// Journey and version-stack rules. These encode domain behaviour from
// MDR_AND_PROGRESS.md that cannot be re-derived by reading the UI: the loop a
// document takes when a review closes with comments, what earns progress, and
// what "current version" means for the stack.

const PROJECT = PROJECTS[0];

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'TEST-DOC-001-R1',
    title: 'Test Document',
    revisionNumber: 'R1',
    status: 'New',
    author: 'Test Author',
    dateCreated: '2025-01-01',
    dateModified: '2025-06-01',
    project: PROJECT.name,
    tags: [],
    fileType: 'PDF',
    fileSize: '1.0 MB',
    documentType: 'Drawing',
    description: 'Fixture',
    thumbnail: '/thumb.png',
    relationships: [],
    ...overrides,
  };
}

/** The four seeded documents that came back from a review with comments. */
const revisionCyclePlaceholder = mockPlaceholdersByProject['marra-ridge']
  .find((d) => d.id === 'MR-PRO-DWG-203-R1')!;

/** A first-issue MDR placeholder — registered, never yet uploaded to. */
const firstIssuePlaceholder = mockPlaceholdersByProject['marra-ridge']
  .find((d) => d.id === 'MR-PRO-DWG-201-R1')!;

describe('buildJourney', () => {
  it('is deterministic — the same document always yields the same journey', () => {
    // The demo must not reshuffle on reload, which is why the data layer hashes
    // the document id instead of using Math.random.
    const doc = makeDocument({ status: 'Approved', revisionNumber: 'R3' });
    expect(buildJourney(doc)).toEqual(buildJourney(doc));
  });

  it('marks only reached stages with a date, revision and actor', () => {
    const steps = buildJourney(makeDocument({ status: 'Under Review' }));
    const dated = steps.filter((s) => s.date);
    const undatedAfter = steps.slice(dated.length);

    expect(dated.length).toBeGreaterThan(0);
    dated.forEach((s) => {
      expect(s.revision).toBeTruthy();
      expect(s.actor).toBeTruthy();
    });
    // Nothing ahead of the document claims a revision it has not reached.
    undatedAfter.forEach((s) => {
      expect(s.revision).toBeUndefined();
      expect(s.actor).toBeUndefined();
    });
  });

  it('walks the revision number up across reached stages', () => {
    // The timeline must agree with the version stack: early stages happened at
    // R1, not at today's R3.
    const steps = buildJourney(makeDocument({ status: 'Approved', revisionNumber: 'R3' }));
    const revisions = steps.filter((s) => s.date && s.revision).map((s) => Number(s.revision!.replace(/\D/g, '')));

    expect(revisions.length).toBeGreaterThan(1);
    expect(revisions[0]).toBe(1);
    expect(revisions[revisions.length - 1]).toBe(3);
    revisions.forEach((r, i) => {
      if (i > 0) expect(r).toBeGreaterThanOrEqual(revisions[i - 1]);
    });
  });

  it('never emits a stage carrying a retired status', () => {
    // Neither exists in FusionLive — see types/document.ts.
    PROJECTS.forEach((project) => {
      mockDocumentsByProject[project.id].slice(0, 200).forEach((doc) => {
        buildJourney(doc).forEach((step) => {
          expect(step.status).not.toBe('Superseded');
          expect(step.status).not.toBe('Archived');
        });
      });
    });
  });

  it('gives a first-issue placeholder the opening rung and nothing more', () => {
    const steps = buildJourney(firstIssuePlaceholder);

    expect(steps[0].status).toBe('Placeholder');
    expect(steps[0].earnedPercent).toBe(0);
    expect(steps[0].date).toBeTruthy();
    expect(steps.some((s) => s.branch === 'rejection')).toBe(false);
    // Every later rung is still ahead of it.
    steps.slice(1).forEach((s) => expect(s.date).toBeUndefined());
  });

  describe('the review-rejection loop', () => {
    it('records the rejection as a branch, not a rung', () => {
      const steps = buildJourney(revisionCyclePlaceholder);
      const rejections = steps.filter((s) => s.branch === 'rejection');

      expect(rejections).toHaveLength(1);
      // A rejection sends the document backwards, so it earns nothing and has no
      // ladder position of its own.
      expect(rejections[0].earnedPercent).toBeUndefined();
      expect(rejections[0].status).toBeUndefined();
      expect(rejections[0].note).toBeTruthy();
    });

    it('returns the document to a placeholder rung after the rejection', () => {
      const steps = buildJourney(revisionCyclePlaceholder);
      const rejectionIdx = steps.findIndex((s) => s.branch === 'rejection');
      const placeholderIdxs = steps
        .map((s, i) => (s.status === 'Placeholder' ? i : -1))
        .filter((i) => i !== -1);

      // Two placeholder rungs: the original, and the one awaiting the revision.
      expect(placeholderIdxs.length).toBe(2);
      expect(placeholderIdxs[0]).toBeLessThan(rejectionIdx);
      expect(placeholderIdxs[1]).toBeGreaterThan(rejectionIdx);
      // Earned value drops back to zero for the revision that has not arrived.
      expect(steps[placeholderIdxs[1]].earnedPercent).toBe(0);
      expect(steps[placeholderIdxs[1]].date).toBeTruthy();
    });

    it('leaves the rungs after the loop unreached', () => {
      const steps = buildJourney(revisionCyclePlaceholder);
      const lastPlaceholderIdx = steps.map((s) => s.status).lastIndexOf('Placeholder');

      steps.slice(lastPlaceholderIdx + 1).forEach((s) => {
        expect(s.date).toBeUndefined();
        expect(s.revision).toBeUndefined();
      });
    });
  });
});

describe('buildVersionStack', () => {
  it('returns exactly one current version, at the top', () => {
    const entries = buildVersionStack(makeDocument({ revisionNumber: 'R3' }));

    expect(entries.filter((e) => e.isCurrent)).toHaveLength(1);
    expect(entries[0].isCurrent).toBe(true);
  });

  it('is ordered newest first', () => {
    // Regression guard: stepping forward from dateCreated by a fixed interval
    // used to overshoot dateModified on short-lived documents and put R2 after R3.
    PROJECTS.forEach((project) => {
      mockDocumentsByProject[project.id].slice(0, 150).forEach((doc) => {
        const dates = buildVersionStack(doc).map((e) => e.date);
        const sortedDesc = [...dates].sort().reverse();
        expect(dates).toEqual(sortedDesc);
      });
    });
  });

  it('shows earlier revisions by position, not by a superseded status', () => {
    // FusionLive has no 'Superseded' status — being replaced is expressed by
    // where a revision sits in the stack. Older entries keep the status they
    // held when they were replaced.
    const entries = buildVersionStack(makeDocument({ revisionNumber: 'R3', status: 'Approved' }));

    expect(entries.map((e) => e.revision)).toEqual(['R3', 'R2', 'R1']);
    expect(entries[0].status).toBe('Approved');
    entries.forEach((e) => expect(e.status).not.toBe('Superseded'));
    entries.slice(1).forEach((e) => expect(e.isCurrent).toBe(false));
  });

  it('never claims a file for a placeholder version', () => {
    const entries = buildVersionStack(firstIssuePlaceholder);

    expect(entries[0].contentState).toBe('placeholder');
    expect(entries[0].fileType).toBe('');
    expect(entries[0].fileSize).toBe('');
    expect(entries[0].isCurrent).toBe(true);
  });

  it('puts a revision-cycle placeholder on top of the revision that has content', () => {
    // The case from MDR_AND_PROGRESS.md §4: "no content" and "has history" are
    // both true at once, so an empty top row must not read as an empty stack.
    const entries = buildVersionStack(revisionCyclePlaceholder);

    expect(entries.length).toBeGreaterThan(1);
    expect(entries[0].contentState).toBe('placeholder');
    expect(entries[1].contentState).toBe('content');
    expect(entries[1].fileType).not.toBe('');
    expect(entries[1].isCurrent).toBe(false);
  });

  it('bumps the revision label for a placeholder awaiting a re-issue', () => {
    // The supplier uploads the NEXT revision into it, not the rejected one.
    const entries = buildVersionStack(revisionCyclePlaceholder);
    expect(entries[0].revision).not.toBe(revisionCyclePlaceholder.revisionNumber);
    expect(entries[1].revision).toBe(revisionCyclePlaceholder.revisionNumber);
  });

  it('gives every entry a stable unique id', () => {
    const doc = makeDocument({ revisionNumber: 'R3' });
    const ids = buildVersionStack(doc).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(buildVersionStack(doc).map((e) => e.id)).toEqual(ids);
  });
});

describe('placeholder journeys across the whole corpus', () => {
  it('starts every placeholder at zero earned', () => {
    PROJECTS.forEach((project) => {
      mockPlaceholdersByProject[project.id].forEach((doc) => {
        expect(isPlaceholder(doc)).toBe(true);
        const steps = buildJourney(doc);
        const current = steps.filter((s) => s.date).pop()!;
        expect(current.earnedPercent).toBe(0);
      });
    });
  });
});
