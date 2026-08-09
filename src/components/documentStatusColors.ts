// Single source for status chip styling. **Do not copy this map.**
//
// Until 2026-08-09 five near-identical copies lived in ClipboardPanel,
// DetailSlidePanel, Dashboard, MyBriefcase and SearchResults, and every status
// vocabulary change had to touch all six or those surfaces rendered an unstyled
// chip (`statusColors[status]` → undefined). Two changes in one week hit that
// trap, so they are consolidated here.
import type { DocumentStatus } from '../types/document';

/** Document statuses — the PM ladder. Keyed by DocumentStatus so removing or
 *  adding a value is a compile error here rather than a blank chip at runtime. */
export const statusColors: Record<DocumentStatus, string> = {
  // 0% on the Rules of Credit ladder — scheduled on the MDR, no content yet.
  // Dashed + neutral on purpose: a placeholder is a planned deliverable, not an
  // alert, and the dashes echo the empty-content cue used across the views.
  Placeholder: 'bg-neutral-50 text-neutral-600 border-dashed border-neutral-300',
  New: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'Under Review': 'bg-warning-50 text-warning-700 border-warning-200',
  Approved: 'bg-success-50 text-success-700 border-success-200',
  Issued: 'bg-sky-50 text-sky-700 border-sky-200',
};

/** States the detail panel can be handed that are NOT document statuses — they
 *  belong to transmittals, reviews and workflows. Kept separate so the document
 *  ladder above stays exactly the DocumentStatus union. */
const activityStatusColors: Record<string, string> = {
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  'Due Today': 'bg-amber-50 text-amber-700 border-amber-200',
  'Due Soon': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Pending: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  Returned: 'bg-rose-50 text-rose-700 border-rose-200',
};

/** Everything DetailSlidePanel can render — documents plus activity states. */
export const panelStatusColors: Record<string, string> = {
  ...statusColors,
  ...activityStatusColors,
};

/** Fallback for a status the maps don't know, so an unexpected value degrades to
 *  a neutral chip instead of an unstyled one. */
export const UNKNOWN_STATUS_COLOR = 'bg-neutral-100 text-neutral-600 border-neutral-200';

/**
 * Chip classes for a status of unknown provenance — briefcase snapshots, search
 * results, dashboard feeds, anything typed as a plain string. Use `statusColors`
 * directly where the value is known to be a `DocumentStatus`, so a vocabulary
 * change fails the build instead of degrading silently.
 */
export function statusChipClass(status?: string): string {
  return (status && panelStatusColors[status]) || UNKNOWN_STATUS_COLOR;
}
