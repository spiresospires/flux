// [MOCK] Document placeholders â€” pre-registered Oracle records with metadata but
// no file in the content store (NFS today, S3 planned). In FusionLive these are
// created singly or in bulk by document controllers, usually against a delivery
// schedule, so suppliers/contractors/vendors have a target to upload their EPC
// deliverables into. They live in the folder they were targeted at and appear in
// the document grid alongside records that do have content.
//
// [API] G06:GET /workspaces/{wsId}/documents â€” placeholders come back from the
// SAME endpoint as everything else, discriminated by `contentState`, not from a
// separate resource. Filterable server-side via ?contentState=placeholder.
// [PHASE-1]
//
// Shaped as full `Document`s (not a parallel PlaceholderRecord type) so the grid,
// the detail panel and the search corpus all read one shape. `fileType`,
// `fileSize` and `thumbnail` are intentionally empty â€” the UI renders '--' rather
// than inventing values for a file that does not exist yet.
import type { Document, DocumentCategory, DocumentType } from '../types/document';
import { PROJECTS, ProjectId } from './projects';

interface PlaceholderSpec {
  id: string;
  title: string;
  revisionNumber: string;
  /** Normal PM status â€” always 'Placeholder', the 0% rung of the
   *  Rules of Credit ladder. A record cannot be both 'Placeholder' and 'New' —
   *  it becomes 'New' the moment content lands on it (MDR_AND_PROGRESS.md). */
  status: Extract<Document['status'], 'Placeholder'>;
  documentType: DocumentType;
  category: DocumentCategory;
  discipline: string;
  folderId: string;
  author: string;
  /** Who owes the file. Shown in the 'Responsible' column (column chooser). */
  responsibleParty: string;
  dateCreated: string;
  dateModified: string;
  /** Scheduled delivery date. Anything before today renders as overdue. */
  dateExpected: string;
  tags: string[];
  description: string;
}

// Per project: 7 placeholders. Four are concentrated in one engineering folder so
// the grid can be demoed with placeholders and content documents side by side in
// the same folder; the rest are spread across procurement / vendor / QA folders
// where late deliverables actually accumulate.
// dateModified is spread either side of the content set's 2026-06-01 ceiling so a
// few surface on page 1 of the default (dateModified desc) sort and the remainder
// interleave further down rather than all clumping at the top.
const PLACEHOLDER_SPECS: Record<ProjectId, PlaceholderSpec[]> = {
  'marra-ridge': [
    {
      id: 'MR-PRO-DWG-201-R1', title: 'Crushing Plant - Primary Crusher GA', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Mechanical',
      folderId: 'marra-ridge-eng-process', author: 'Sarah Johnson', responsibleParty: 'Metso Outotec',
      dateCreated: '2026-05-18', dateModified: '2026-08-04', dateExpected: '2026-09-15',
      tags: ['mechanical', 'crushing', 'drawing'],
      description: 'Placeholder raised for the primary crusher general arrangement â€” vendor drawing due with the equipment package.'
    },
    {
      id: 'MR-PRO-DWG-202-R1', title: 'Crushing Plant - Screen Deck Layout', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Mechanical',
      folderId: 'marra-ridge-eng-process', author: 'Sarah Johnson', responsibleParty: 'Metso Outotec',
      dateCreated: '2026-05-18', dateModified: '2026-07-22', dateExpected: '2026-09-15',
      tags: ['mechanical', 'screening', 'drawing'],
      description: 'Screen deck layout reserved against the crushing and screening package schedule.'
    },
    {
      id: 'MR-PRO-DWG-203-R1', title: 'Crushing Plant - Conveyor CV-104 Profile', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Mechanical',
      folderId: 'marra-ridge-eng-process', author: 'Mike Chen', responsibleParty: 'Metso Outotec',
      dateCreated: '2026-03-02', dateModified: '2026-05-14', dateExpected: '2026-07-31',
      tags: ['mechanical', 'conveyor', 'drawing'],
      description: 'Conveyor profile placeholder â€” first issue overdue against the SMP design schedule.'
    },
    {
      id: 'MR-PRO-SPEC-204-R1', title: 'Crushing Plant - Wear Liner Specification', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'SPECIFICATION', discipline: 'Mechanical',
      folderId: 'marra-ridge-eng-process', author: 'Lisa Wong', responsibleParty: 'Ausenco',
      dateCreated: '2026-04-11', dateModified: '2026-05-02', dateExpected: '2026-10-01',
      tags: ['mechanical', 'specification', 'wear'],
      description: 'Wear liner specification pre-registered ahead of the materials handling design freeze.'
    },
    {
      id: 'MR-VDR-311-R1', title: 'Vendor Data - Apron Feeder AF-101', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'VENDOR - SUPPLIER', discipline: 'Mechanical',
      folderId: 'marra-ridge-proc-datasheets', author: 'David Kumar', responsibleParty: 'Sandvik',
      dateCreated: '2026-02-20', dateModified: '2026-04-26', dateExpected: '2026-06-30',
      tags: ['vendor', 'datasheet', 'mechanical'],
      description: 'Apron feeder vendor data pack â€” placeholder created at PO award, upload overdue.'
    },
    {
      id: 'MR-EI-DWG-118-R1', title: 'Substation SS-02 Single Line Diagram', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Electrical',
      folderId: 'marra-ridge-con-ei', author: 'Emily Rodriguez', responsibleParty: 'UGL Electrical',
      dateCreated: '2026-05-30', dateModified: '2026-08-01', dateExpected: '2026-09-30',
      tags: ['electrical', 'substation', 'drawing'],
      description: 'SLD placeholder targeted at E&I installation for contractor as-built markup.'
    },
    {
      id: 'MR-ITP-077-R1', title: 'Tailings Cell Liner ITP', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Technical Report', category: 'QUALITY', discipline: 'Civil',
      folderId: 'marra-ridge-qa-itp', author: 'Robert Lee', responsibleParty: 'MACA Civil',
      dateCreated: '2026-04-03', dateModified: '2026-05-21', dateExpected: '2026-08-29',
      tags: ['quality', 'ITP', 'civil'],
      description: 'Inspection and test plan placeholder issued to the civil contractor for the tailings cell liner.'
    },
  ],
  hedland: [
    {
      id: 'PH-MAR-DWG-341-R1', title: 'Berth 3 Fender System GA', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Structural',
      folderId: 'hedland-eng-marine', author: 'James Wilson', responsibleParty: 'Trelleborg Marine',
      dateCreated: '2026-05-22', dateModified: '2026-08-06', dateExpected: '2026-09-18',
      tags: ['marine', 'structural', 'drawing'],
      description: 'Fender system general arrangement reserved against the berth 3 supply package.'
    },
    {
      id: 'PH-MAR-DWG-342-R1', title: 'Berth 3 Mooring Layout', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Structural',
      folderId: 'hedland-eng-marine', author: 'James Wilson', responsibleParty: 'Trelleborg Marine',
      dateCreated: '2026-05-22', dateModified: '2026-07-19', dateExpected: '2026-09-18',
      tags: ['marine', 'mooring', 'drawing'],
      description: 'Mooring layout placeholder created with the berth 3 deliverables schedule.'
    },
    {
      id: 'PH-MAR-CALC-343-R1', title: 'Berth 3 Berthing Energy Calculation', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Technical Report', category: 'DRAWING', discipline: 'Structural',
      folderId: 'hedland-eng-marine', author: 'Patricia Brown', responsibleParty: 'Aurecon',
      dateCreated: '2026-02-28', dateModified: '2026-05-09', dateExpected: '2026-07-24',
      tags: ['marine', 'structural', 'calculation'],
      description: 'Berthing energy calculation â€” placeholder overdue against the marine design schedule.'
    },
    {
      id: 'PH-MAR-SPEC-344-R1', title: 'Berth 3 Cathodic Protection Specification', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'SPECIFICATION', discipline: 'Structural',
      folderId: 'hedland-eng-marine', author: 'Nancy Miller', responsibleParty: 'Aurecon',
      dateCreated: '2026-04-16', dateModified: '2026-05-01', dateExpected: '2026-10-09',
      tags: ['marine', 'specification', 'corrosion'],
      description: 'Cathodic protection specification pre-registered ahead of the marine structures design freeze.'
    },
    {
      id: 'PH-VDR-402-R1', title: 'Vendor Data - Shiploader Luffing Cylinder', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'VENDOR - SUPPLIER', discipline: 'Mechanical',
      folderId: 'hedland-proc-datasheets', author: 'Thomas Anderson', responsibleParty: 'ThyssenKrupp',
      dateCreated: '2026-02-11', dateModified: '2026-04-18', dateExpected: '2026-06-26',
      tags: ['vendor', 'datasheet', 'mechanical'],
      description: 'Shiploader hydraulic vendor data â€” placeholder raised at PO award, upload overdue.'
    },
    {
      id: 'PH-MH-DWG-215-R1', title: 'Stacker Reclaimer Rail Alignment', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Civil',
      folderId: 'hedland-eng-mh', author: 'Maria Garcia', responsibleParty: 'Monadelphous',
      dateCreated: '2026-06-02', dateModified: '2026-07-30', dateExpected: '2026-10-16',
      tags: ['materials handling', 'civil', 'drawing'],
      description: 'Rail alignment placeholder targeted at the materials handling contractor.'
    },
    {
      id: 'PH-WLD-061-R1', title: 'Berth 3 Pile Weld Procedure Qualification', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Procedure', category: 'QUALITY', discipline: 'Structural',
      folderId: 'hedland-qa-weld', author: 'Kevin White', responsibleParty: 'Civmec',
      dateCreated: '2026-03-25', dateModified: '2026-05-16', dateExpected: '2026-08-21',
      tags: ['quality', 'welding', 'structural'],
      description: 'Weld procedure qualification record placeholder issued to the piling contractor.'
    },
  ],
  kwinana: [
    {
      id: 'KW-PRC-PID-512-R1', title: 'Cooling Water Return P&ID', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Mechanical',
      folderId: 'kwinana-eng-process', author: 'Laura Thompson', responsibleParty: 'Wood',
      dateCreated: '2026-05-25', dateModified: '2026-08-07', dateExpected: '2026-09-11',
      tags: ['process', 'P&ID', 'drawing'],
      description: 'P&ID placeholder raised for the cooling water return loop ahead of the IFD issue.'
    },
    {
      id: 'KW-PRC-PID-513-R1', title: 'Reagent Dosing P&ID', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Mechanical',
      folderId: 'kwinana-eng-process', author: 'Laura Thompson', responsibleParty: 'Wood',
      dateCreated: '2026-05-25', dateModified: '2026-07-17', dateExpected: '2026-09-11',
      tags: ['process', 'P&ID', 'drawing'],
      description: 'Reagent dosing P&ID reserved against the process design deliverables schedule.'
    },
    {
      id: 'KW-PRC-DWG-514-R1', title: 'Heat Exchanger HX-201 Datasheet', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'SPECIFICATION', discipline: 'Mechanical',
      folderId: 'kwinana-eng-process', author: 'Michael Chang', responsibleParty: 'Alfa Laval',
      dateCreated: '2026-03-09', dateModified: '2026-05-12', dateExpected: '2026-07-17',
      tags: ['process', 'datasheet', 'mechanical'],
      description: 'Exchanger datasheet placeholder â€” vendor issue overdue against the process package.'
    },
    {
      id: 'KW-PRC-SPEC-515-R1', title: 'Process Line List - Unit 200', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'SPECIFICATION', discipline: 'Plumbing',
      folderId: 'kwinana-eng-process', author: 'Daniel Kim', responsibleParty: 'Wood',
      dateCreated: '2026-04-20', dateModified: '2026-05-04', dateExpected: '2026-10-23',
      tags: ['process', 'piping', 'specification'],
      description: 'Line list pre-registered ahead of the Unit 200 piping design freeze.'
    },
    {
      id: 'KW-VDR-618-R1', title: 'Vendor Manual - Feed Pump P-204A', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Manual', category: 'VENDOR - SUPPLIER', discipline: 'Mechanical',
      folderId: 'kwinana-proc-datasheets', author: 'Susan Taylor', responsibleParty: 'Flowserve',
      dateCreated: '2026-02-06', dateModified: '2026-04-14', dateExpected: '2026-06-19',
      tags: ['vendor', 'manual', 'mechanical'],
      description: 'O&M manual placeholder created at PO award â€” vendor upload overdue.'
    },
    {
      id: 'KW-EI-DWG-330-R1', title: 'Loop Sheet - FT-205', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Technical Report', category: 'DRAWING', discipline: 'Electrical',
      folderId: 'kwinana-eng-ei', author: 'Christopher Davis', responsibleParty: 'SAGE Automation',
      dateCreated: '2026-06-04', dateModified: '2026-07-26', dateExpected: '2026-10-02',
      tags: ['electrical', 'instrumentation', 'loop'],
      description: 'Instrument loop sheet placeholder targeted at the E&I design contractor.'
    },
    {
      id: 'KW-HZP-044-R1', title: 'HAZOP Close-Out Report - Unit 200', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Technical Report', category: 'HSE & ENVIRONMENT', discipline: 'Mechanical',
      folderId: 'kwinana-hse-hazop', author: 'Margaret Robinson', responsibleParty: 'Wood',
      dateCreated: '2026-03-30', dateModified: '2026-05-19', dateExpected: '2026-08-14',
      tags: ['HSE', 'HAZOP', 'safety'],
      description: 'HAZOP close-out placeholder held open until all Unit 200 actions are signed off.'
    },
  ],
  goldfields: [
    {
      id: 'GF-SIG-DWG-712-R1', title: 'Interlocking Diagram - Kalgoorlie North', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Electrical',
      folderId: 'goldfields-eng-signalling', author: 'John Smith', responsibleParty: 'Siemens Mobility',
      dateCreated: '2026-05-28', dateModified: '2026-08-05', dateExpected: '2026-09-25',
      tags: ['signalling', 'electrical', 'drawing'],
      description: 'Interlocking diagram placeholder raised against the signalling design deliverables list.'
    },
    {
      id: 'GF-SIG-DWG-713-R1', title: 'Level Crossing Control Schematic - LC-14', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Electrical',
      folderId: 'goldfields-eng-signalling', author: 'John Smith', responsibleParty: 'Siemens Mobility',
      dateCreated: '2026-05-28', dateModified: '2026-07-21', dateExpected: '2026-09-25',
      tags: ['signalling', 'level crossing', 'drawing'],
      description: 'Level crossing control schematic reserved for the LC-14 upgrade package.'
    },
    {
      id: 'GF-SIG-SPEC-714-R1', title: 'Train Control Interface Specification', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'SPECIFICATION', discipline: 'Electrical',
      folderId: 'goldfields-eng-signalling', author: 'Sarah Johnson', responsibleParty: 'Siemens Mobility',
      dateCreated: '2026-03-06', dateModified: '2026-05-08', dateExpected: '2026-07-10',
      tags: ['signalling', 'specification', 'communications'],
      description: 'Train control interface specification â€” placeholder overdue against the signalling schedule.'
    },
    {
      id: 'GF-SIG-DWG-715-R1', title: 'Comms Network Architecture - Section 4', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Electrical',
      folderId: 'goldfields-eng-signalling', author: 'Mike Chen', responsibleParty: 'Downer Rail',
      dateCreated: '2026-04-24', dateModified: '2026-05-06', dateExpected: '2026-10-30',
      tags: ['communications', 'signalling', 'drawing'],
      description: 'Communications architecture placeholder pre-registered for the section 4 design package.'
    },
    {
      id: 'GF-VDR-508-R1', title: 'Vendor Data - Points Machine PM-88', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Specification', category: 'VENDOR - SUPPLIER', discipline: 'Mechanical',
      folderId: 'goldfields-proc-datasheets', author: 'Lisa Wong', responsibleParty: 'Voestalpine',
      dateCreated: '2026-02-17', dateModified: '2026-04-21', dateExpected: '2026-06-12',
      tags: ['vendor', 'datasheet', 'signalling'],
      description: 'Points machine vendor data pack â€” placeholder created at PO award, upload overdue.'
    },
    {
      id: 'GF-STR-DWG-266-R1', title: 'Bridge BR-07 Girder Erection Plan', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Drawing', category: 'DRAWING', discipline: 'Structural',
      folderId: 'goldfields-eng-structures', author: 'David Kumar', responsibleParty: 'Georgiou Group',
      dateCreated: '2026-06-01', dateModified: '2026-07-28', dateExpected: '2026-10-07',
      tags: ['structures', 'bridge', 'drawing'],
      description: 'Girder erection plan placeholder targeted at the structures contractor.'
    },
    {
      id: 'GF-ITP-129-R1', title: 'Track Formation ITP - Section 4', revisionNumber: 'R1',
      status: 'Placeholder', documentType: 'Technical Report', category: 'QUALITY', discipline: 'Civil',
      folderId: 'goldfields-qa-itp', author: 'Emily Rodriguez', responsibleParty: 'Fulton Hogan',
      dateCreated: '2026-04-07', dateModified: '2026-05-23', dateExpected: '2026-08-28',
      tags: ['quality', 'ITP', 'formation'],
      description: 'Formation inspection and test plan placeholder issued to the earthworks contractor.'
    },
  ],
};

function toPlaceholderDocument(spec: PlaceholderSpec, projectId: ProjectId): Document {
  const project = PROJECTS.find((p) => p.id === projectId)!;
  return {
    id: spec.id,
    title: spec.title,
    revisionNumber: spec.revisionNumber,
    status: spec.status,
    author: spec.author,
    dateCreated: spec.dateCreated,
    dateModified: spec.dateModified,
    project: project.name,
    tags: [...spec.tags, 'placeholder'],
    // No content in the store yet â€” the grid renders '--' for these rather than
    // guessing a filetype/size and rendering a broken thumbnail.
    fileType: '',
    fileSize: '',
    thumbnail: '',
    documentType: spec.documentType,
    category: spec.category,
    discipline: spec.discipline,
    description: spec.description,
    folderId: spec.folderId,
    relationships: [],
    contentState: 'placeholder',
    dateExpected: spec.dateExpected,
    responsibleParty: spec.responsibleParty,
  };
}

/** Placeholders keyed by project â€” merged into mockDocumentsByProject so G06 serves
 *  them from the same list the grid already reads. */
export const mockPlaceholdersByProject: Record<ProjectId, Document[]> = {
  'marra-ridge': PLACEHOLDER_SPECS['marra-ridge'].map((s) => toPlaceholderDocument(s, 'marra-ridge')),
  hedland: PLACEHOLDER_SPECS.hedland.map((s) => toPlaceholderDocument(s, 'hedland')),
  kwinana: PLACEHOLDER_SPECS.kwinana.map((s) => toPlaceholderDocument(s, 'kwinana')),
  goldfields: PLACEHOLDER_SPECS.goldfields.map((s) => toPlaceholderDocument(s, 'goldfields')),
};

/** All projects' placeholders â€” used by searchData and anywhere enterprise-wide. */
export const mockPlaceholders: Document[] = PROJECTS.flatMap((p) => mockPlaceholdersByProject[p.id]);
