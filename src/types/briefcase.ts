// [MOCK] Briefcase domain types — see BRIEFCASE_PLAN.md.
// [API] User-scoped (not workspace-scoped): GET/POST/DELETE /api/user/briefcase
// [AUTH]
// [PHASE-1]
// A briefcase item is a lightweight *reference* to a source document that lives in
// its original workspace — never an independent copy. It pins a specific revision and
// may go stale; `isDynamic` items instead always follow the latest revision (idea I-425/I-640).
import { ProjectId } from '../data/projects';

/** Source-document availability / freshness state, surfaced as a badge on each item. */
export type BriefcaseState =
  | 'current' // points at the latest revision
  | 'newer-available' // a newer revision exists in the source workspace
  | 'checked-out' // source is checked out / locked by another user
  | 'unavailable'; // source has been deleted or is no longer accessible

/** A held reference to a source document. Stores a snapshot of display fields at add-time. */
export interface BriefcaseItem {
  /** Source document id — also the de-duplication key. */
  docId: string;
  title: string;
  reference: string;
  /** Revision captured when the item was added. */
  pinnedRevision: string;
  status: string;
  fileType: string;
  fileSize?: string;
  author?: string;
  /** Resolved source workspace identity. Null if the project name could not be matched. */
  sourceProjectId: ProjectId | null;
  sourceWorkspaceName: string;
  /** Source folder, where known — used by the folder-icon nav (idea I-157, a later stage). */
  folderId?: string;
  /** When true the item follows the latest revision instead of the pinned one. */
  isDynamic: boolean;
  /** ISO timestamp the item was added. */
  addedAt: string;
  /** Freshness/availability state (seed data sets this explicitly to exercise the badges). */
  state: BriefcaseState;
}

/** Loose shape accepted by `add` — entry points pass whatever fields they have. */
export interface BriefcaseInput {
  docId: string;
  title: string;
  reference?: string;
  revision?: string;
  status?: string;
  fileType?: string;
  fileSize?: string;
  author?: string;
  /** Source workspace name (resolved to a ProjectId by the context). */
  projectName?: string;
  folderId?: string;
}
