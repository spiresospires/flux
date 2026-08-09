// [MOCK] Markups and review comments for the in-app viewer.
// [API] [TBD] Real data lives in the Apryse annotation store, keyed by document
// and revision — not on the document record. Delete with the rest of src/data.
import type { ViewerComment, ViewerMarkup } from '../types/viewer';

/** Stable pseudo-random integer from a document id — the viewer must show the
 *  same markups every time it is opened, without Math.random. */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

const MARKUP_AUTHORS = ['Oliver Spires', 'Sarah Johnson', 'Marco Rossi', 'Priya Natarajan'];

const COMMENT_BODIES = [
  'This is my comment not for BURN in on review',
  'Confirm the pipe spec against the isometric — A2 shown here, BOM says A-1.',
  'Support spacing does not match the stress report. Please revise before IFC.',
  'Weld detail on this joint needs the NDT callout adding.',
  'Elevation clashes with the cable tray run on drawing 003-DA-004-002.',
];

const MARKUP_LABELS = [
  'Reviewed and Accepted — Work May Proceed',
  'Code 1 stamp',
  'Redline — revise support spacing',
  'Highlight — pipe spec query',
];

/** Markup layers for the viewer's left panel. */
export function buildViewerMarkups(docId: string): ViewerMarkup[] {
  const h = hash(docId);
  const count = (h % 3) + 1;

  return Array.from({ length: count }, (_, i) => {
    const seed = hash(`${docId}-m${i}`);
    return {
      id: `${docId}-markup-${i}`,
      label: MARKUP_LABELS[(seed + i) % MARKUP_LABELS.length],
      // >>> not >> : hash() returns an unsigned 32-bit value, and a SIGNED shift
      // turns anything ≥ 2^31 negative, giving a negative index and `undefined`.
      author: MARKUP_AUTHORS[((seed >>> 3) + i) % MARKUP_AUTHORS.length],
      // Display strings, matching the viewer's own formatting.
      createdAt: `Aug ${((seed % 9) + 1)} 2026 ${((seed % 12) + 1)}:${String(seed % 60).padStart(2, '0')} PM`,
      isNew: i === 0,
    };
  });
}

/** Review comments for the viewer's right panel. */
export function buildViewerComments(docId: string): ViewerComment[] {
  const h = hash(docId);
  const count = (h % 3) + 1;

  return Array.from({ length: count }, (_, i) => {
    const seed = hash(`${docId}-c${i}`);
    return {
      id: `${docId}-comment-${i}`,
      author: MARKUP_AUTHORS[seed % MARKUP_AUTHORS.length],
      createdAt: `Feb ${((seed % 27) + 1)}, ${((seed % 11) + 1)}:${String(seed % 60).padStart(2, '0')} PM`,
      page: 1,
      // + i so two comments on the same document never collide on the same body.
      // >>> not >> — see the note in buildViewerMarkups.
      body: COMMENT_BODIES[((seed >>> 5) + i) % COMMENT_BODIES.length],
    };
  });
}
