// toViewerTarget — builds a ViewerTarget from a Document record.
//
// Moved out of DocumentBrowser.tsx (where it was a local const) so it's
// shared, testable, and easy to find alongside the rest of the viewer module
// rather than buried in a 3,000+ line page component.
import type { Document } from '../types/document';
import type { ViewerTarget } from '../types/viewer';

/** Everything the framed viewer needs. The page raster stands in for the
 *  rendered PDF the real Apryse viewer would load over G07. */
export function toViewerTarget(doc: Document): ViewerTarget {
  return {
    docId: doc.id,
    title: doc.title,
    revision: doc.revisionNumber,
    project: doc.project,
    fileType: doc.fileType,
    pageImage: doc.thumbnail || undefined,
  };
}
