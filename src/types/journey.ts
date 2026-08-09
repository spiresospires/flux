// Document journey + version stack — the shapes behind the two new tabs in the
// properties side panel.
//
// The journey is the document's history audit re-imagined as a visualisation
// rather than the grid of audit rows FusionLive shows today: where a deliverable
// has been, where it is now, and what is still ahead of it.
//
// [API] [TBD] Source endpoint unconfirmed — likely the document history/audit
// trail alongside G06 revisions (`GET /workspaces/{wsId}/documents/{docId}/revisions`).
// [TODO-ENG] Confirm whether the ladder definition comes back with the document,
// or is fetched once per workspace as configuration and joined client-side.
//
// ⚠ The step vocabulary is **workspace configuration**, not a constant. Admins
// name their own stages (Issued for Review / Squad Check / IDC Review …) and set
// their own Rules of Credit percentages — see MDR_AND_PROGRESS.md §3.1. Nothing
// in the UI may switch on `label`. `status` is the only field safe to match on,
// and only because it is the prototype's internal ladder position.
import type { DocumentStatus } from './document';

/** Semantic icon slot. Maps to a concrete icon in DocumentJourney — kept
 *  symbolic so the data layer never imports an icon library. */
export type JourneyStepIcon =
  | 'placeholder'
  | 'upload'
  | 'review'
  | 'approval'
  | 'construction'
  | 'asBuilt'
  | 'rejected';

export interface JourneyStep {
  /** Stable identity for React keys and tests. Never rendered. */
  key: string;
  /** What the workspace calls this stage. Rendered verbatim. */
  label: string;
  icon: JourneyStepIcon;
  /** Rules of Credit weighting earned on reaching this stage (0–100).
   *  [MOCK] Real percentages are workspace configuration.
   *  Omitted on steps that are not rungs and therefore earn nothing — today
   *  that means rejection branches, which send the document backwards. */
  earnedPercent?: number;
  /** Internal ladder position, used to resolve which step is current from the
   *  document's status. Absent on branch steps and on terminal stages that have
   *  no corresponding DocumentStatus (e.g. As-Built). */
  status?: DocumentStatus;
  /** ISO yyyy-mm-dd the document reached this stage. Absent = not reached yet. */
  date?: string;
  /** Revision the document was at when it reached this stage. */
  revision?: string;
  /** Who actioned it. */
  actor?: string;
  /** Secondary line — comment counts, reasons, notes. */
  note?: string;
  /** Steps that hang off the main spine rather than sitting on it. A rejection
   *  is not a rung: the document does not progress, it goes back for revision. */
  branch?: 'rejection';
}

/** One entry in a document's version stack. Newest first; `isCurrent` marks the
 *  top of the stack, which may itself be a placeholder awaiting the next
 *  revision (MDR_AND_PROGRESS.md §4). */
export interface VersionStackEntry {
  /** Stable identity — revision strings can repeat across a rejection cycle. */
  id: string;
  revision: string;
  status: DocumentStatus;
  /** ISO yyyy-mm-dd. */
  date: string;
  author: string;
  /** Empty on a placeholder version — there is no file behind it. */
  fileType: string;
  fileSize: string;
  /** Mirrors Document.contentState for this specific version. */
  contentState: 'content' | 'placeholder';
  isCurrent: boolean;
  /** Short reason/outcome, e.g. 'Rejected with 6 comments'. */
  note?: string;
}
