// In-app document viewer. FusionLive currently opens documents in the Apryse
// (PDFTron) WebViewer in a NEW BROWSER TAB; this models the same experience
// framed inside FLUX instead, reachable from every eye icon in the app.
//
// [API] [TBD] The real viewer is served by
// `OpenPdfTronViewerServlet?vid=…&docId=…&objectType=DOCUMENT&formatCode=pdf`
// and loads content via G07. Markups and comments come from the annotation
// store, not from the document record.
// [TODO-ENG] Decide whether the framed viewer embeds the existing servlet in an
// iframe or moves to the Apryse WebViewer SDK mounted directly in the SPA. The
// second is what makes markup state shareable with the rest of the UI.

/** What the viewer is asked to open. Deliberately not a `Document` — the viewer
 *  is also opened for a single revision from the version stack, which is not a
 *  document record of its own. */
export interface ViewerTarget {
  docId: string;
  title: string;
  revision?: string;
  project?: string;
  fileType?: string;
  /** Page raster shown on the canvas. [MOCK] stands in for the rendered PDF. */
  pageImage?: string;
}

/** An annotation layer entry, as listed in the viewer's left Markup panel. */
export interface ViewerMarkup {
  id: string;
  label: string;
  author: string;
  /** Pre-formatted for display — the real store returns a timestamp. */
  createdAt: string;
  /** Unread/unsaved marker, shown as "New" in the list. */
  isNew?: boolean;
}

/** A review comment pinned to a page, listed in the right Comments panel. */
export interface ViewerComment {
  id: string;
  author: string;
  createdAt: string;
  page: number;
  body: string;
}
