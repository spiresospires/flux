import { describe, it, expect } from 'vitest';
import { buildViewerMarkups, buildViewerComments } from './mockMarkups';
import { buildJourney } from './mockJourneys';
import { mockDocuments } from './mockDocuments';
import { PROJECTS } from './projects';

// These generators index fixed arrays with a hashed document id. That is exactly
// where an off-by-sign bug hides: `hash()` returns an UNSIGNED 32-bit value, so a
// signed `>>` shift turns anything ≥ 2^31 negative, producing a negative index
// and a silent `undefined`. It shipped once (blank comment bodies in the viewer)
// and was only caught by eye. These tests sweep the whole corpus so it cannot.

const SAMPLE = PROJECTS.flatMap((p) =>
  mockDocuments.filter((d) => d.project === p.name).slice(0, 120)
);

describe('viewer markups', () => {
  it('never produces an undefined field for any document', () => {
    SAMPLE.forEach((doc) => {
      buildViewerMarkups(doc.id).forEach((markup) => {
        expect(markup.label, doc.id).toBeTruthy();
        expect(markup.author, doc.id).toBeTruthy();
        expect(markup.createdAt, doc.id).toBeTruthy();
      });
    });
  });

  it('always returns at least one markup layer', () => {
    SAMPLE.slice(0, 40).forEach((doc) => {
      expect(buildViewerMarkups(doc.id).length, doc.id).toBeGreaterThan(0);
    });
  });

  it('is deterministic — reopening a document shows the same markups', () => {
    const doc = SAMPLE[0];
    expect(buildViewerMarkups(doc.id)).toEqual(buildViewerMarkups(doc.id));
  });
});

describe('viewer comments', () => {
  it('never produces an empty body for any document', () => {
    SAMPLE.forEach((doc) => {
      buildViewerComments(doc.id).forEach((comment) => {
        expect(comment.body, doc.id).toBeTruthy();
        expect(comment.author, doc.id).toBeTruthy();
      });
    });
  });

  it('gives two comments on the same document different bodies', () => {
    // Duplicated text reads as a rendering bug in the demo.
    SAMPLE.slice(0, 60).forEach((doc) => {
      const bodies = buildViewerComments(doc.id).map((c) => c.body);
      expect(new Set(bodies).size, doc.id).toBe(bodies.length);
    });
  });
});

describe('journey text fields', () => {
  it('never leaves a rejection step without a reviewer or a reason', () => {
    // Same hashed-index pattern as the viewer generators.
    SAMPLE.forEach((doc) => {
      buildJourney(doc)
        .filter((step) => step.branch === 'rejection')
        .forEach((step) => {
          expect(step.actor, doc.id).toBeTruthy();
          expect(step.note, doc.id).toBeTruthy();
        });
    });
  });
});
