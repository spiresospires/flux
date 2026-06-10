// [MOCK] Per-project folder trees consumed by DocumentBrowser / FolderTree.
// [API] G05:GET /workspaces/{wsId}/folders/tree
// [AUTH]
// [PHASE-1]
// Replace with useFolderTree(wsId). Folder CRUD (create/rename/move/delete) is also
// G05 — writes need Idempotency-Key (POST) and ETag/If-Match (PATCH); see ARCHITECTURE.md.
//
// Every project shares the same controlled EPC top-level taxonomy (01 Project
// Management … 08 Handover & Operations); subfolders are themed per asset type
// (mine / port / process plant / rail). documentCount is computed from
// mockDocuments at the bottom of this file — never hand-edit counts.
import { Folder } from '../types/document';
import { mockDocuments } from './mockDocuments';
import { PROJECTS, ProjectId } from './projects';

interface SubfolderDef {
  /** Suffix appended to `${projectId}-` to form the folder id — must match the folderId used in mockDocuments PROJECT_SPECS. */
  key: string;
  name: string;
}

/** Standard EPC top level — identical names and order for every project. */
const EPC_TOP_LEVEL: ReadonlyArray<{ key: string; name: string }> = [
  { key: 'pm', name: '01 Project Management' },
  { key: 'eng', name: '02 Engineering' },
  { key: 'proc', name: '03 Procurement' },
  { key: 'con', name: '04 Construction' },
  { key: 'comm', name: '05 Commissioning' },
  { key: 'hse', name: '06 HSE' },
  { key: 'qa', name: '07 Quality' },
  { key: 'ops', name: '08 Handover & Operations' },
];

/** Project-specific subfolders per EPC top-level key. */
const PROJECT_SUBFOLDERS: Record<ProjectId, Record<string, SubfolderDef[]>> = {
  'marra-ridge': {
    pm: [
      { key: 'pm-docs', name: 'Project Controls & Reporting' },
      { key: 'pm-contracts', name: 'Contracts & Variations' },
    ],
    eng: [
      { key: 'eng-mining', name: 'Mining Infrastructure' },
      { key: 'eng-process', name: 'Crushing & Screening Plant' },
      { key: 'eng-tailings', name: 'Tailings & Water Management' },
      { key: 'eng-npi', name: 'Non-Process Infrastructure' },
      { key: 'eng-specs', name: 'Specifications' },
    ],
    proc: [
      { key: 'proc-datasheets', name: 'Vendor Data' },
      { key: 'proc-specs', name: 'Purchase Specifications' },
    ],
    con: [
      { key: 'con-earthworks', name: 'Bulk Earthworks' },
      { key: 'con-smp', name: 'SMP Installation' },
      { key: 'con-ei', name: 'E&I Installation' },
    ],
    comm: [
      { key: 'comm-dry', name: 'Dry Commissioning' },
      { key: 'comm-wet', name: 'Wet Commissioning & Ramp-Up' },
    ],
    hse: [
      { key: 'hse-safety', name: 'Safety Procedures' },
      { key: 'hse-enviro', name: 'Environmental Approvals & Monitoring' },
    ],
    qa: [
      { key: 'qa-itp', name: 'ITPs & Inspection Records' },
      { key: 'qa-ncr', name: 'NCRs & Audits' },
    ],
    ops: [
      { key: 'ops-manuals', name: 'Operating & Maintenance Manuals' },
      { key: 'ops-asbuilt', name: 'As-Built Records' },
    ],
  },
  hedland: {
    pm: [
      { key: 'pm-docs', name: 'Project Controls & Reporting' },
      { key: 'pm-contracts', name: 'Contracts & Variations' },
    ],
    eng: [
      { key: 'eng-marine', name: 'Marine Structures' },
      { key: 'eng-dredging', name: 'Dredging & Reclamation' },
      { key: 'eng-mh', name: 'Materials Handling' },
      { key: 'eng-specs', name: 'Specifications' },
    ],
    proc: [
      { key: 'proc-datasheets', name: 'Vendor Data' },
      { key: 'proc-specs', name: 'Purchase Specifications' },
    ],
    con: [
      { key: 'con-piling', name: 'Piling & Wharf Works' },
      { key: 'con-topside', name: 'Topside & Services' },
      { key: 'con-mh', name: 'Shiploader & Conveyor Erection' },
    ],
    comm: [
      { key: 'comm-cold', name: 'Cold Commissioning' },
      { key: 'comm-load', name: 'Load Trials' },
    ],
    hse: [
      { key: 'hse-safety', name: 'Safety Procedures' },
      { key: 'hse-marine', name: 'Marine & Environmental Permits' },
    ],
    qa: [
      { key: 'qa-itp', name: 'ITPs & Inspection Records' },
      { key: 'qa-weld', name: 'Welding & NDT Records' },
    ],
    ops: [
      { key: 'ops-manuals', name: 'Operating & Maintenance Manuals' },
      { key: 'ops-asbuilt', name: 'As-Built Records' },
    ],
  },
  kwinana: {
    pm: [
      { key: 'pm-docs', name: 'Project Controls & Reporting' },
      { key: 'pm-contracts', name: 'Contracts & Variations' },
    ],
    eng: [
      { key: 'eng-process', name: 'Process (PFDs & P&IDs)' },
      { key: 'eng-piping', name: 'Piping & Isometrics' },
      { key: 'eng-ei', name: 'Electrical & Instrumentation' },
      { key: 'eng-civil', name: 'Civil & Structural' },
      { key: 'eng-specs', name: 'Specifications' },
    ],
    proc: [
      { key: 'proc-datasheets', name: 'Vendor Data' },
      { key: 'proc-specs', name: 'Purchase Specifications' },
    ],
    con: [
      { key: 'con-smp', name: 'SMP Installation' },
      { key: 'con-ei', name: 'E&I Installation' },
    ],
    comm: [
      { key: 'comm-pre', name: 'Pre-Commissioning' },
      { key: 'comm-sys', name: 'Systems Completion' },
      { key: 'comm-perf', name: 'Performance Testing' },
    ],
    hse: [
      { key: 'hse-safety', name: 'Safety Procedures' },
      { key: 'hse-hazop', name: 'HAZOP & Process Safety' },
    ],
    qa: [
      { key: 'qa-itp', name: 'ITPs & Inspection Records' },
      { key: 'qa-ncr', name: 'NCRs & Audits' },
    ],
    ops: [
      { key: 'ops-manuals', name: 'Operating & Maintenance Manuals' },
      { key: 'ops-asbuilt', name: 'As-Built Records' },
    ],
  },
  goldfields: {
    pm: [
      { key: 'pm-docs', name: 'Project Controls & Reporting' },
      { key: 'pm-contracts', name: 'Contracts & Variations' },
    ],
    eng: [
      { key: 'eng-track', name: 'Track & Alignment' },
      { key: 'eng-structures', name: 'Bridges & Structures' },
      { key: 'eng-signalling', name: 'Signalling & Communications' },
      { key: 'eng-specs', name: 'Specifications' },
    ],
    proc: [
      { key: 'proc-datasheets', name: 'Vendor Data' },
      { key: 'proc-specs', name: 'Purchase Specifications' },
    ],
    con: [
      { key: 'con-earthworks', name: 'Earthworks & Formation' },
      { key: 'con-track', name: 'Track Laying' },
      { key: 'con-structures', name: 'Structures Construction' },
    ],
    comm: [
      { key: 'comm-test', name: 'Testing & Commissioning' },
    ],
    hse: [
      { key: 'hse-safety', name: 'Safety Procedures' },
      { key: 'hse-enviro', name: 'Environmental & Heritage' },
    ],
    qa: [
      { key: 'qa-itp', name: 'ITPs & Inspection Records' },
      { key: 'qa-ncr', name: 'NCRs & Audits' },
    ],
    ops: [
      { key: 'ops-asbuilt', name: 'As-Built Records' },
      { key: 'ops-manuals', name: 'Operating & Maintenance Manuals' },
    ],
  },
};

function buildProjectTree(projectId: ProjectId): Folder[] {
  return EPC_TOP_LEVEL.map((top) => {
    const topId = `${projectId}-${top.key}`;
    const subs = PROJECT_SUBFOLDERS[projectId][top.key] ?? [];
    return {
      id: topId,
      name: top.name,
      parentId: null,
      children: subs.map((sub) => ({
        id: `${projectId}-${sub.key}`,
        name: sub.name,
        parentId: topId,
        children: [],
        documentCount: 0,
      })),
      documentCount: 0,
    };
  });
}

// ── Computed counts ──
// documentCount = documents whose folderId matches this folder, plus the
// totals of all child folders (parents aggregate their subtree).
const docsPerFolder = new Map<string, number>();
for (const doc of mockDocuments) {
  if (doc.folderId) {
    docsPerFolder.set(doc.folderId, (docsPerFolder.get(doc.folderId) ?? 0) + 1);
  }
}

function withComputedCounts(folder: Folder): Folder {
  const children = folder.children.map(withComputedCounts);
  const own = docsPerFolder.get(folder.id) ?? 0;
  const fromChildren = children.reduce((sum, child) => sum + child.documentCount, 0);
  return { ...folder, children, documentCount: own + fromChildren };
}

/** Folder tree per project — DocumentBrowser selects the active project's tree via scope.id. */
export const mockFoldersByProject: Record<ProjectId, Folder[]> = {
  'marra-ridge': buildProjectTree('marra-ridge').map(withComputedCounts),
  hedland: buildProjectTree('hedland').map(withComputedCounts),
  kwinana: buildProjectTree('kwinana').map(withComputedCounts),
  goldfields: buildProjectTree('goldfields').map(withComputedCounts),
};

/** All projects' trees combined — used by searchData to resolve folder paths across projects. */
export const mockFolders: Folder[] = PROJECTS.flatMap((p) => mockFoldersByProject[p.id]);
