// [MOCK] Document journeys and version stacks for the properties side panel.
//
// The journey is FusionLive's document history audit re-imagined as a timeline
// instead of a grid of audit rows. It is CHRONOLOGICAL, not a fixed ladder: the
// steps a document has actually taken, in order, followed by the rungs still
// ahead of it. That matters because a document can revisit a stage — a review
// that closes with comments pushes a fresh placeholder onto the version stack,
// dropping the new revision back to 0% earned (MDR_AND_PROGRESS.md §4).
//
// [API] [TBD] No confirmed endpoint. Delete this file when the real history/audit
// and revisions contracts land.
// [TODO-ENG] Ladder definitions (labels + Rules of Credit percentages) are
// workspace configuration in real FusionLive. Here they are hardcoded per project
// specifically to demonstrate that they differ per workspace — compare the four
// LADDERS below. Nothing in the UI may switch on a label.
import type { Document, DocumentStatus } from '../types/document';
import { isPlaceholder } from '../types/document';
import type { JourneyStep, JourneyStepIcon, VersionStackEntry } from '../types/journey';
import { PROJECTS, ProjectId } from './projects';

interface LadderStage {
  key: string;
  label: string;
  icon: JourneyStepIcon;
  earnedPercent: number;
  /** Ladder position in the prototype's internal DocumentStatus vocabulary.
   *  Absent on the terminal stage, which has no status of its own. */
  status?: DocumentStatus;
}

// Four workspaces, four vocabularies, identical mechanics. This is the point:
// admins name their own stages and set their own Rules of Credit weightings.
const LADDERS: Record<ProjectId, LadderStage[]> = {
  'marra-ridge': [
    { key: 'placeholder', label: 'Placeholder', icon: 'placeholder', earnedPercent: 0, status: 'Placeholder' },
    { key: 'uploaded', label: 'Uploaded (New)', icon: 'upload', earnedPercent: 10, status: 'New' },
    { key: 'review', label: 'Issued for Review', icon: 'review', earnedPercent: 25, status: 'Under Review' },
    { key: 'approval', label: 'Issued for Approval', icon: 'approval', earnedPercent: 50, status: 'Approved' },
    { key: 'construction', label: 'Issued for Construction', icon: 'construction', earnedPercent: 85, status: 'Issued' },
    { key: 'asBuilt', label: 'As-Built', icon: 'asBuilt', earnedPercent: 100 },
  ],
  hedland: [
    { key: 'placeholder', label: 'Scheduled', icon: 'placeholder', earnedPercent: 0, status: 'Placeholder' },
    { key: 'uploaded', label: 'Received', icon: 'upload', earnedPercent: 10, status: 'New' },
    { key: 'review', label: 'Squad Check', icon: 'review', earnedPercent: 30, status: 'Under Review' },
    { key: 'approval', label: 'Client Approval', icon: 'approval', earnedPercent: 55, status: 'Approved' },
    { key: 'construction', label: 'Approved for Construction', icon: 'construction', earnedPercent: 85, status: 'Issued' },
    { key: 'asBuilt', label: 'As-Built', icon: 'asBuilt', earnedPercent: 100 },
  ],
  kwinana: [
    { key: 'placeholder', label: 'Placeholder', icon: 'placeholder', earnedPercent: 0, status: 'Placeholder' },
    { key: 'uploaded', label: 'Uploaded', icon: 'upload', earnedPercent: 15, status: 'New' },
    { key: 'review', label: 'IDC Review', icon: 'review', earnedPercent: 25, status: 'Under Review' },
    { key: 'approval', label: 'Issued for Approval (IFA)', icon: 'approval', earnedPercent: 50, status: 'Approved' },
    { key: 'construction', label: 'Issued for Construction (IFC)', icon: 'construction', earnedPercent: 85, status: 'Issued' },
    { key: 'asBuilt', label: 'As-Built', icon: 'asBuilt', earnedPercent: 100 },
  ],
  goldfields: [
    { key: 'placeholder', label: 'Registered', icon: 'placeholder', earnedPercent: 0, status: 'Placeholder' },
    { key: 'uploaded', label: 'Submitted', icon: 'upload', earnedPercent: 10, status: 'New' },
    { key: 'review', label: 'Discipline Check', icon: 'review', earnedPercent: 25, status: 'Under Review' },
    { key: 'approval', label: 'Design Approval', icon: 'approval', earnedPercent: 50, status: 'Approved' },
    { key: 'construction', label: 'Construction Issue', icon: 'construction', earnedPercent: 85, status: 'Issued' },
    { key: 'asBuilt', label: 'Final Handover', icon: 'asBuilt', earnedPercent: 100 },
  ],
};

/** Placeholders that got there the *second* way — a review closed with comments
 *  and FusionLive pushed a fresh placeholder onto the top of the version stack.
 *  These demo the loop: prior revisions with content underneath, earned value
 *  back at 0% for the revision that has not arrived yet. */
const REVISION_CYCLE_PLACEHOLDER_IDS = new Set([
  'MR-PRO-DWG-203-R1',
  'PH-MAR-CALC-343-R1',
  'KW-PRC-DWG-514-R1',
  'GF-SIG-SPEC-714-R1',
]);

const REVIEWERS = ['Priya Natarajan', 'Mark Doyle', 'Aisha Khan', 'Hugo Martinez', 'Marco Rossi'];
const REJECTION_NOTES = [
  'Rejected with 6 comments — clashes with structural steel',
  'Rejected with 3 comments — tag numbering does not match the P&ID',
  'Rejected with 11 comments — missing load cases',
  'Rejected with 4 comments — client redlines not incorporated',
];

/** Stable pseudo-random integer from a document id — keeps the demo identical
 *  across reloads without Math.random. */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function projectIdFor(doc: Document): ProjectId {
  return PROJECTS.find((p) => p.name === doc.project)?.id ?? 'marra-ridge';
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Evenly space `count` dates between two ISO dates (inclusive of `from`). */
function spreadDates(from: string, to: string, count: number): string[] {
  if (count <= 1) return [from];
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  const span = Math.max(end - start, count * 86400000);
  return Array.from({ length: count }, (_, i) =>
    new Date(start + Math.round((span * i) / (count - 1))).toISOString().slice(0, 10)
  );
}

/** Revision label one cycle on from `rev` — R1 → R2, A → A1, P01 → P02. */
function nextRevision(rev: string): string {
  const m = rev.match(/^(.*?)(\d+)$/);
  if (m) return `${m[1]}${String(Number(m[2]) + 1).padStart(m[2].length, '0')}`;
  return `${rev}1`;
}

/** Where the document currently sits on its ladder. Grid documents are current
 *  versions, so every status they can carry maps to a rung; the fallback only
 *  guards against a vocabulary the ladder doesn't cover. */
function ladderIndexForStatus(ladder: LadderStage[], status: DocumentStatus): number {
  const direct = ladder.findIndex((s) => s.status === status);
  return direct !== -1 ? direct : 0;
}

/**
 * Chronological history + remaining rungs for one document.
 * [MOCK] Derived from the document's status and dates; the real thing is the
 * audit trail.
 */
export function buildJourney(doc: Document): JourneyStep[] {
  const ladder = LADDERS[projectIdFor(doc)];
  const h = hash(doc.id);
  const revisionCycle = REVISION_CYCLE_PLACEHOLDER_IDS.has(doc.id);
  const steps: JourneyStep[] = [];

  if (revisionCycle) {
    // Went out for review, came back with comments, and is now sitting as a
    // fresh placeholder waiting for the revised deliverable.
    const priorRev = doc.revisionNumber;
    const dates = spreadDates(doc.dateCreated, doc.dateModified, 5);
    const reviewer = REVIEWERS[h % REVIEWERS.length];

    ladder.slice(0, 3).forEach((stage, i) => {
      steps.push({
        key: `${stage.key}-a`,
        label: stage.label,
        icon: stage.icon,
        earnedPercent: stage.earnedPercent,
        status: stage.status,
        date: dates[i],
        revision: priorRev,
        actor: i === 2 ? reviewer : doc.author,
      });
    });
    steps.push({
      key: 'rejected',
      label: 'Rejected w/ Comments (Revision Required)',
      icon: 'rejected',
      date: dates[3],
      revision: priorRev,
      actor: reviewer,
      note: REJECTION_NOTES[h % REJECTION_NOTES.length],
      branch: 'rejection',
    });
    // Back to 0% for the revision that hasn't arrived. This second placeholder
    // step is the current one — the component resolves the LAST status match.
    const nextRev = nextRevision(doc.revisionNumber);
    steps.push({
      key: 'placeholder-b',
      label: `${ladder[0].label} (${nextRev})`,
      icon: 'placeholder',
      earnedPercent: 0,
      status: 'Placeholder',
      date: dates[4],
      revision: nextRev,
      actor: doc.responsibleParty ?? doc.author,
      note: 'Awaiting revised content from the supplier',
    });
    // Rungs still ahead carry no revision/date — they haven't happened.
    ladder.slice(1).forEach((stage) => {
      steps.push({
        key: `${stage.key}-b`,
        label: stage.label,
        icon: stage.icon,
        earnedPercent: stage.earnedPercent,
        status: stage.status,
      });
    });
    return steps;
  }

  const currentIdx = ladderIndexForStatus(ladder, doc.status);
  const reached = currentIdx + 1;
  const dates = spreadDates(doc.dateCreated, doc.dateModified, Math.max(reached, 2));

  // Walk the revision number up across the reached stages so the timeline agrees
  // with the version stack — the early stages happened at R1, not at today's R3.
  const depth = Math.max(Number(doc.revisionNumber.replace(/\D/g, '')) || 1, 1);
  const revisionAt = (i: number) =>
    `R${Math.min(depth, Math.floor((i * depth) / Math.max(reached - 1, 1)) + 1)}`;

  ladder.forEach((stage, i) => {
    steps.push({
      key: stage.key,
      label: stage.label,
      icon: stage.icon,
      earnedPercent: stage.earnedPercent,
      status: stage.status,
      date: i <= currentIdx ? dates[i] : undefined,
      revision: i <= currentIdx ? revisionAt(i) : undefined,
      actor: i <= currentIdx ? doc.author : undefined,
    });
  });

  // Roughly a third of documents that got past review carry a rejection in their
  // history — enough that the branch is easy to find in the demo.
  const reviewIdx = ladder.findIndex((s) => s.key === 'review');
  if (currentIdx > reviewIdx && h % 3 === 0) {
    // >>> not >> : hash() is unsigned 32-bit, and a SIGNED shift turns anything
    // ≥ 2^31 negative, giving a negative index and an `undefined` reviewer.
    const reviewer = REVIEWERS[(h >>> 3) % REVIEWERS.length];
    steps.splice(reviewIdx + 1, 0, {
      key: 'rejected',
      label: 'Rejected w/ Comments (Revision Required)',
      icon: 'rejected',
      date: addDays(dates[reviewIdx], 6),
      revision: doc.revisionNumber,
      actor: reviewer,
      note: REJECTION_NOTES[(h >>> 5) % REJECTION_NOTES.length],
      branch: 'rejection',
    });
  }

  return steps;
}

/**
 * Version stack, newest first. `isCurrent` marks the top — which may be a
 * placeholder with real revisions underneath it.
 * [MOCK] Real data comes from G06 revisions.
 */
export function buildVersionStack(doc: Document): VersionStackEntry[] {
  const h = hash(doc.id);
  const entries: VersionStackEntry[] = [];
  const revisionCycle = REVISION_CYCLE_PLACEHOLDER_IDS.has(doc.id);

  if (isPlaceholder(doc)) {
    const nextRev = revisionCycle ? nextRevision(doc.revisionNumber) : doc.revisionNumber;
    entries.push({
      id: `${doc.id}-v-current`,
      revision: nextRev,
      status: 'Placeholder',
      date: doc.dateModified,
      author: doc.responsibleParty ?? doc.author,
      fileType: '',
      fileSize: '',
      contentState: 'placeholder',
      isCurrent: true,
      note: revisionCycle ? 'Awaiting revised content after review' : 'Awaiting first upload',
    });

    if (revisionCycle) {
      // The revision that went through review and came back with comments.
      entries.push({
        id: `${doc.id}-v-1`,
        revision: doc.revisionNumber,
        status: 'Under Review',
        date: doc.dateCreated,
        author: doc.author,
        fileType: 'PDF',
        fileSize: `${((h % 40) / 10 + 0.6).toFixed(1)} MB`,
        contentState: 'content',
        isCurrent: false,
        note: 'Review closed — rejected with comments',
      });
    }
    return entries;
  }

  // Content documents: mockDocuments generates ids ending -R1/-R2/-R3, so the
  // revision number tells us how deep the stack is.
  const depth = Math.max(Number(doc.revisionNumber.replace(/\D/g, '')) || 1, 1);
  // Space revision dates across the document's own lifespan so the stack is
  // strictly newest-first. Stepping forward from dateCreated by a fixed interval
  // could overshoot dateModified on short-lived documents and put R2 after R3.
  const revisionDates = spreadDates(doc.dateCreated, doc.dateModified, Math.max(depth, 2));
  for (let i = depth; i >= 1; i--) {
    const isCurrent = i === depth;
    entries.push({
      id: `${doc.id}-v-${i}`,
      revision: `R${i}`,
      // Earlier revisions keep the status they held when they were replaced —
      // there is no 'Superseded' status in FusionLive. Being replaced is shown
      // by position in the stack, not by a chip. A revision that gets superseded
      // has normally been issued, so that is the realistic mock value.
      status: isCurrent ? doc.status : 'Issued',
      date: isCurrent ? doc.dateModified : revisionDates[i - 1],
      author: doc.author,
      fileType: doc.fileType || 'PDF',
      fileSize: isCurrent
        ? doc.fileSize || '2.4 MB'
        : `${((hash(`${doc.id}${i}`) % 40) / 10 + 0.6).toFixed(1)} MB`,
      contentState: 'content',
      isCurrent,
    });
  }
  return entries;
}
