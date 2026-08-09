// Journey logic, kept out of DocumentJourney.tsx so it can be exported and
// tested without costing that file its fast-refresh boundary (and matching where
// the rest of the project's business rules live — see distributionEngine.ts).
import type { DocumentStatus } from '../types/document';
import type { JourneyStep } from '../types/journey';

/**
 * Resolve which step of a journey is the active one.
 *
 *  1. an explicit `currentStepKey`, else
 *  2. the LAST step whose `status` matches `currentStatus` — "last" is the
 *     subtle part: a document rejected at review returns to an earlier stage at
 *     a new revision, so the same status legitimately appears twice and the
 *     later occurrence is the live one. Taking the first would report the
 *     document as further along than it is, else
 *  3. the last step that has a date — the most recent thing that happened.
 *
 * Rejection branches are never selected: a rejection is not a rung, the document
 * does not sit there.
 */
export function resolveCurrentIndex(
  steps: JourneyStep[],
  currentStatus?: DocumentStatus,
  currentStepKey?: string
): number {
  if (currentStepKey) {
    const byKey = steps.findIndex((s) => s.key === currentStepKey);
    if (byKey !== -1) return byKey;
  }
  if (currentStatus) {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (!steps[i].branch && steps[i].status === currentStatus) return i;
    }
  }
  for (let i = steps.length - 1; i >= 0; i--) {
    if (!steps[i].branch && steps[i].date) return i;
  }
  return 0;
}

/**
 * The document's earned Rules of Credit total: the percentage of its current
 * rung. Steps that are not rungs (rejection branches) earn nothing, so walk back
 * to the last real rung rather than reporting zero.
 */
export function earnedAt(steps: JourneyStep[], currentIndex: number): number {
  for (let i = currentIndex; i >= 0; i--) {
    const pct = steps[i]?.earnedPercent;
    if (typeof pct === 'number') return pct;
  }
  return 0;
}
