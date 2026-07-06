// [MOCK] Per-project document sets consumed by DocumentBrowser, DocumentDetail, Chat and searchData.
// [API] G06:GET /workspaces/{wsId}/documents
// [AUTH]
// [PHASE-1]
// Replace with useDocuments(wsId, params) — server-side pagination, sort and filtering.
// Query params: folderId, status, documentType, limit, cursor, sort, order (cursor
// pagination per ADR-011 — response { items, nextCursor, totalApprox }, no offset paging).
// `Document.id` stays a string (UUID per ADR-009 — never integer IDs in the SPA).
//
// Each project generates its own themed document set from the category specs below
// (mine / port / process plant / rail). Per-project totals: Marra Ridge 1140,
// Port Hedland 920, Kwinana 1060, Goldfields 840 — 3960 documents overall.
// Folder counts in mockFolders.ts are computed from this data — never hand-edit them.
import { Document, DocumentType } from '../types/document';
import { PROJECTS, ProjectId } from './projects';

const authors = [
  'John Smith',
  'Sarah Johnson',
  'Mike Chen',
  'Lisa Wong',
  'David Kumar',
  'Emily Rodriguez',
  'Robert Lee',
  'Maria Garcia',
  'James Wilson',
  'Patricia Brown',
  'Thomas Anderson',
  'Nancy Miller',
  'Jennifer Martinez',
  'Michael Chang',
  'Daniel Kim',
  'Susan Taylor',
  'Kevin White',
  'Laura Thompson',
  'Christopher Davis',
  'Margaret Robinson'];

const statuses: Array<
  'Draft' | 'In Review' | 'Approved' | 'Superseded' | 'Archived'> =
  ['Draft', 'In Review', 'Approved', 'Superseded', 'Archived'];

const thumbnails = [
  '/eng_drawing_1_1779057915112.png',
  '/eng_drawing_2_1779057926523.png',
  '/eng_drawing_3_1779057939893.png'
];

const getRandomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).
    toISOString().
    split('T')[0];

const categoryCycle = [
  'Structural',
  'Electrical',
  'Mechanical',
  'Civil',
  'Architectural',
  'Plumbing',
  'HVAC'] as const;

const inferPrimaryCategory = (doc: Document, index: number) => {
  const haystack = `${doc.title} ${doc.description} ${doc.tags.join(' ')}`.toLowerCase();

  if (haystack.includes('electrical') || haystack.includes('power') || haystack.includes('cable') || haystack.includes('lighting') || haystack.includes('control panel') || haystack.includes('signalling')) {
    return 'Electrical';
  }
  if (haystack.includes('mechanical') || haystack.includes('pump') || haystack.includes('compressor') || haystack.includes('heat exchanger') || haystack.includes('piping') || haystack.includes('conveyor') || haystack.includes('crush')) {
    return 'Mechanical';
  }
  if (haystack.includes('civil') || haystack.includes('site') || haystack.includes('grading') || haystack.includes('concrete') || haystack.includes('earthworks') || haystack.includes('dredg') || haystack.includes('formation')) {
    return 'Civil';
  }
  if (haystack.includes('structural') || haystack.includes('steel') || haystack.includes('stress') || haystack.includes('fatigue') || haystack.includes('foundation') || haystack.includes('wharf') || haystack.includes('piling') || haystack.includes('bridge')) {
    return 'Structural';
  }
  if (haystack.includes('architectural') || haystack.includes('room') || haystack.includes('finish') || haystack.includes('as-built') || haystack.includes('camp')) {
    return 'Architectural';
  }
  if (haystack.includes('plumbing') || haystack.includes('fixture') || haystack.includes('sanitary') || haystack.includes('drainage') || haystack.includes('water')) {
    return 'Plumbing';
  }
  if (haystack.includes('hvac') || haystack.includes('ventilation') || haystack.includes('air') || haystack.includes('cooling') || haystack.includes('duct')) {
    return 'HVAC';
  }

  return categoryCycle[index % categoryCycle.length];
};

const buildCategoryFields = (category: string, index: number) => {
  switch (category) {
    case 'Structural':
      return {
        beamSize: ['203x133 UB', '254x146 UB', '305x165 UC', '356x171 UC'][index % 4],
        materialGrade: ['S275', 'S355', 'A572 Gr 50', 'A992'][index % 4],
        loadRating: ['25 kN', '40 kN', '60 kN', '85 kN'][index % 4],
        connectionType: ['Bolted', 'Welded', 'Moment', 'Pinned'][index % 4],
      };
    case 'Electrical':
      return {
        voltage: ['230 V', '400 V', '690 V', '11 kV'][index % 4],
        circuitNumber: `CCT-${String(index + 1).padStart(3, '0')}`,
        panel: ['PANEL-A', 'PANEL-B', 'MCC-1', 'SWBD-2'][index % 4],
        protectionType: ['MCB', 'MCCB', 'RCBO', 'Relay'][index % 4],
      };
    case 'Mechanical':
      return {
        equipmentTag: `EQ-${String(index + 101).padStart(4, '0')}`,
        powerRating: ['5 kW', '11 kW', '22 kW', '45 kW'][index % 4],
        manufacturer: ['Sulzer', 'Flowserve', 'Grundfos', 'KSB'][index % 4],
        serviceMedium: ['Steam', 'Cooling Water', 'Condensate', 'Process Gas'][index % 4],
      };
    case 'Civil':
      return {
        concreteType: ['C30/37', 'C35/45', 'C40/50', 'C50/60'][index % 4],
        rebarSize: ['T12', 'T16', 'T20', 'T25'][index % 4],
        soilClass: ['Class 2', 'Class 3', 'Class 4', 'Rock'][index % 4],
        foundationType: ['Strip Footing', 'Pad Footing', 'Raft', 'Pile Cap'][index % 4],
      };
    case 'Architectural':
      return {
        finishType: ['Painted', 'Epoxy', 'Ceramic Tile', 'Acoustic Panel'][index % 4],
        roomNumber: `R-${String((index % 60) + 1).padStart(3, '0')}`,
        ceilingHeight: ['2.7 m', '3.0 m', '3.3 m', '4.2 m'][index % 4],
        fireRating: ['30 min', '60 min', '90 min', '120 min'][index % 4],
      };
    case 'Plumbing':
      return {
        pipeSize: ['25 mm', '50 mm', '80 mm', '150 mm'][index % 4],
        fixtureType: ['Floor Drain', 'Sink', 'Valve Set', 'Pump Skid'][index % 4],
        flowRate: ['0.8 L/s', '1.5 L/s', '3.2 L/s', '6.0 L/s'][index % 4],
        pressureClass: ['PN10', 'PN16', 'PN25', 'PN40'][index % 4],
      };
    case 'HVAC':
      return {
        ductSize: ['300x200', '500x300', '800x400', '1000x500'][index % 4],
        airflow: ['500 L/s', '1200 L/s', '2500 L/s', '4000 L/s'][index % 4],
        unitType: ['AHU', 'FCU', 'Exhaust Fan', 'Chiller'][index % 4],
        zone: ['North Wing', 'South Wing', 'Plant Room', 'Control Suite'][index % 4],
      };
    default:
      return {};
  }
};

const withCategoryAttributes = (doc: Document, index: number): Document => {
  const category = inferPrimaryCategory(doc, index);
  const normalizedCategory = category.toLowerCase();

  return {
    ...doc,
    tags: doc.tags.includes(normalizedCategory) ? doc.tags : [...doc.tags, normalizedCategory],
    ...buildCategoryFields(category, index),
  };
};

// ── Per-project category specs ──────────────────────────────────────────────
// One spec per leaf folder. `folderId` must match a leaf in mockFolders.ts.

interface DocCategorySpec {
  folderId: string;
  idPrefix: string;
  count: number;
  titlePrefix: string;
  variants: string[];
  documentType: DocumentType;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'DWG';
  tags: string[];
  description: string;
}

const PROJECT_ASSETS: Record<ProjectId, string[]> = {
  'marra-ridge': ['ROM Pad', 'Crusher Station CR-01', 'TSF Cell 1', 'NPI & Camp', 'Conveyor CV-02'],
  hedland: ['Berth 6', 'Shiploader SL-3', 'Stockyard', 'Transfer Station TS-2', 'Tug Pen'],
  kwinana: ['Train 1', 'Train 2', 'Reagents Area', 'Utilities', 'Product Handling'],
  goldfields: ['Section A (0–40 km)', 'Section B (40–85 km)', 'Bridge B-04', 'Loop Siding LS-2', 'Comms Hut CH-7'],
};

const PROJECT_SPECS: Record<ProjectId, DocCategorySpec[]> = {
  'marra-ridge': [
    { folderId: 'marra-ridge-pm-docs', idPrefix: 'MR-PMC', count: 60, titlePrefix: 'Project Controls', variants: ['Monthly Report', 'Cost Report', 'Schedule Update', 'Risk Register', 'Progress Claim'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['project management', 'reporting'], description: 'Project controls and reporting documentation' },
    { folderId: 'marra-ridge-pm-contracts', idPrefix: 'MR-CON', count: 40, titlePrefix: 'Contract', variants: ['Variation Notice', 'Site Instruction', 'Extension of Time Claim', 'Subcontract Scope'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['contracts', 'commercial'], description: 'Contract and variation documentation' },
    { folderId: 'marra-ridge-eng-mining', idPrefix: 'MR-MIN-DWG', count: 90, titlePrefix: 'Mining Infrastructure Drawing', variants: ['ROM Pad Layout', 'Haul Road Section', 'Dump Wall Profile', 'Drainage Plan', 'Magazine Compound'], documentType: 'Drawing', fileType: 'PDF', tags: ['mining', 'drawing', 'earthworks'], description: 'Mining infrastructure engineering drawing' },
    { folderId: 'marra-ridge-eng-process', idPrefix: 'MR-PRC-DWG', count: 100, titlePrefix: 'Crushing & Screening Drawing', variants: ['Crusher Station GA', 'Screen House Layout', 'Conveyor Profile', 'Transfer Chute Detail', 'Surge Bin Section'], documentType: 'Drawing', fileType: 'PDF', tags: ['crushing', 'mechanical', 'drawing'], description: 'Crushing and screening plant drawing' },
    { folderId: 'marra-ridge-eng-tailings', idPrefix: 'MR-TSF-DWG', count: 70, titlePrefix: 'Tailings & Water Drawing', variants: ['TSF Embankment Section', 'Decant Tower Detail', 'Return Water Pipeline', 'Seepage Monitoring Plan'], documentType: 'Drawing', fileType: 'PDF', tags: ['tailings', 'water', 'civil'], description: 'Tailings storage facility and water management drawing' },
    { folderId: 'marra-ridge-eng-npi', idPrefix: 'MR-NPI-DWG', count: 80, titlePrefix: 'NPI Drawing', variants: ['Camp Layout', 'Workshop GA', 'Fuel Farm Layout', 'Airstrip Plan', 'Power Station GA'], documentType: 'Drawing', fileType: 'PDF', tags: ['NPI', 'infrastructure', 'drawing'], description: 'Non-process infrastructure drawing' },
    { folderId: 'marra-ridge-eng-specs', idPrefix: 'MR-SPEC', count: 90, titlePrefix: 'Specification', variants: ['Earthworks Spec', 'Concrete Spec', 'Structural Steel Spec', 'Conveyor Design Spec', 'HV Reticulation Spec'], documentType: 'Specification', fileType: 'PDF', tags: ['specification', 'engineering'], description: 'Engineering design specification' },
    { folderId: 'marra-ridge-proc-datasheets', idPrefix: 'MR-VDR', count: 80, titlePrefix: 'Vendor Data', variants: ['Crusher Datasheet', 'Vibrating Screen Datasheet', 'Conveyor Drive Datasheet', 'Pump Datasheet', 'Transformer Datasheet'], documentType: 'Specification', fileType: 'PDF', tags: ['vendor', 'datasheet', 'procurement'], description: 'Vendor equipment data and drawings' },
    { folderId: 'marra-ridge-proc-specs', idPrefix: 'MR-PSPEC', count: 50, titlePrefix: 'Purchase Specification', variants: ['Mobile Plant Package', 'Crushing Package', 'Electrical Package', 'Camp Services Package'], documentType: 'Specification', fileType: 'PDF', tags: ['procurement', 'purchasing'], description: 'Procurement package specification' },
    { folderId: 'marra-ridge-con-earthworks', idPrefix: 'MR-EW', count: 70, titlePrefix: 'Earthworks', variants: ['Cut/Fill Report', 'Compaction Test Record', 'Survey Conformance Report', 'Dust Management Plan'], documentType: 'Technical Report', fileType: 'PDF', tags: ['earthworks', 'construction', 'civil'], description: 'Bulk earthworks construction record' },
    { folderId: 'marra-ridge-con-smp', idPrefix: 'MR-SMP', count: 70, titlePrefix: 'SMP Installation', variants: ['Steel Erection Procedure', 'Mechanical Installation Procedure', 'Platework Work Pack', 'Alignment Record'], documentType: 'Procedure', fileType: 'PDF', tags: ['SMP', 'construction', 'mechanical'], description: 'Structural, mechanical and piping installation document' },
    { folderId: 'marra-ridge-con-ei', idPrefix: 'MR-EI', count: 60, titlePrefix: 'E&I Installation', variants: ['Cable Pull Schedule', 'Termination Record', 'Instrument Loop Folder', 'Switchroom Work Pack'], documentType: 'Procedure', fileType: 'PDF', tags: ['electrical', 'instrumentation', 'construction'], description: 'Electrical and instrumentation installation document' },
    { folderId: 'marra-ridge-comm-dry', idPrefix: 'MR-CDRY', count: 50, titlePrefix: 'Dry Commissioning', variants: ['Motor Solo Run Record', 'Conveyor No-Load Test', 'Interlock Function Test', 'Pre-Start Checklist'], documentType: 'Procedure', fileType: 'PDF', tags: ['commissioning', 'dry'], description: 'Dry commissioning test procedure and record' },
    { folderId: 'marra-ridge-comm-wet', idPrefix: 'MR-CWET', count: 40, titlePrefix: 'Wet Commissioning', variants: ['Ore Commissioning Plan', 'Ramp-Up Report', 'Performance Test Procedure'], documentType: 'Procedure', fileType: 'PDF', tags: ['commissioning', 'ramp-up'], description: 'Wet commissioning and ramp-up document' },
    { folderId: 'marra-ridge-hse-safety', idPrefix: 'MR-HSE', count: 45, titlePrefix: 'Safety', variants: ['Take 5 Procedure', 'Isolation Procedure', 'Working at Heights Procedure', 'Emergency Response Plan'], documentType: 'Procedure', fileType: 'DOCX', tags: ['safety', 'HSE'], description: 'Site safety procedure' },
    { folderId: 'marra-ridge-hse-enviro', idPrefix: 'MR-ENV', count: 35, titlePrefix: 'Environmental', variants: ['Clearing Permit', 'Dust Monitoring Report', 'Groundwater Monitoring Report', 'Heritage Survey'], documentType: 'Technical Report', fileType: 'PDF', tags: ['environmental', 'compliance'], description: 'Environmental approval and monitoring document' },
    { folderId: 'marra-ridge-qa-itp', idPrefix: 'MR-ITP', count: 35, titlePrefix: 'Quality', variants: ['Concrete ITP', 'Steel Erection ITP', 'Mechanical ITP', 'E&I ITP'], documentType: 'Technical Report', fileType: 'PDF', tags: ['quality', 'ITP', 'inspection'], description: 'Inspection and test plan record' },
    { folderId: 'marra-ridge-qa-ncr', idPrefix: 'MR-NCR', count: 25, titlePrefix: 'Non-Conformance', variants: ['NCR Report', 'Corrective Action Report', 'Audit Finding'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['quality', 'NCR'], description: 'Non-conformance and audit record' },
    { folderId: 'marra-ridge-ops-manuals', idPrefix: 'MR-OM', count: 30, titlePrefix: 'O&M Manual', variants: ['Crusher O&M Manual', 'Conveyor O&M Manual', 'Water Services O&M Manual'], documentType: 'Manual', fileType: 'PDF', tags: ['operations', 'manual'], description: 'Operating and maintenance manual' },
    { folderId: 'marra-ridge-ops-asbuilt', idPrefix: 'MR-AB', count: 20, titlePrefix: 'As-Built', variants: ['Civil As-Built', 'Mechanical As-Built', 'E&I As-Built'], documentType: 'Drawing', fileType: 'PDF', tags: ['as-built', 'handover'], description: 'As-built record drawing' },
  ],
  hedland: [
    { folderId: 'hedland-pm-docs', idPrefix: 'PH-PMC', count: 50, titlePrefix: 'Project Controls', variants: ['Monthly Report', 'Cost Report', 'Schedule Update', 'Risk Register'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['project management', 'reporting'], description: 'Project controls and reporting documentation' },
    { folderId: 'hedland-pm-contracts', idPrefix: 'PH-CON', count: 30, titlePrefix: 'Contract', variants: ['Variation Notice', 'Site Instruction', 'Marine Spread Daywork Record'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['contracts', 'commercial'], description: 'Contract and variation documentation' },
    { folderId: 'hedland-eng-marine', idPrefix: 'PH-MAR-DWG', count: 100, titlePrefix: 'Marine Structures Drawing', variants: ['Wharf Deck GA', 'Pile Layout', 'Fender System Detail', 'Mooring Dolphin GA', 'Berthing Analysis Sketch'], documentType: 'Drawing', fileType: 'PDF', tags: ['marine', 'wharf', 'structural'], description: 'Marine structures engineering drawing' },
    { folderId: 'hedland-eng-dredging', idPrefix: 'PH-DRG', count: 60, titlePrefix: 'Dredging Drawing', variants: ['Dredge Pocket Plan', 'Reclamation Layout', 'Spoil Ground Plan', 'Bathymetric Survey'], documentType: 'Drawing', fileType: 'PDF', tags: ['dredging', 'marine', 'civil'], description: 'Dredging and reclamation drawing' },
    { folderId: 'hedland-eng-mh', idPrefix: 'PH-MH-DWG', count: 90, titlePrefix: 'Materials Handling Drawing', variants: ['Shiploader GA', 'Conveyor Gallery Section', 'Transfer Tower GA', 'Stacker Layout', 'Sample Station Detail'], documentType: 'Drawing', fileType: 'PDF', tags: ['materials handling', 'conveyor', 'mechanical'], description: 'Materials handling engineering drawing' },
    { folderId: 'hedland-eng-specs', idPrefix: 'PH-SPEC', count: 70, titlePrefix: 'Specification', variants: ['Marine Concrete Spec', 'Piling Spec', 'Conveyor Design Spec', 'Corrosion Protection Spec'], documentType: 'Specification', fileType: 'PDF', tags: ['specification', 'engineering'], description: 'Engineering design specification' },
    { folderId: 'hedland-proc-datasheets', idPrefix: 'PH-VDR', count: 70, titlePrefix: 'Vendor Data', variants: ['Shiploader Datasheet', 'Winch Datasheet', 'Fender Datasheet', 'Drive Package Datasheet'], documentType: 'Specification', fileType: 'PDF', tags: ['vendor', 'datasheet', 'procurement'], description: 'Vendor equipment data and drawings' },
    { folderId: 'hedland-proc-specs', idPrefix: 'PH-PSPEC', count: 40, titlePrefix: 'Purchase Specification', variants: ['Piling Package', 'Shiploader Package', 'Navigation Aids Package'], documentType: 'Specification', fileType: 'PDF', tags: ['procurement', 'purchasing'], description: 'Procurement package specification' },
    { folderId: 'hedland-con-piling', idPrefix: 'PH-PIL', count: 80, titlePrefix: 'Piling & Wharf', variants: ['Pile Driving Record', 'Pile Integrity Test', 'Deck Pour Record', 'Marine Lift Plan'], documentType: 'Technical Report', fileType: 'PDF', tags: ['piling', 'wharf', 'construction'], description: 'Piling and wharf construction record' },
    { folderId: 'hedland-con-topside', idPrefix: 'PH-TOP', count: 60, titlePrefix: 'Topside Works', variants: ['Services Installation Pack', 'Walkway Erection Procedure', 'Deck Furniture Layout'], documentType: 'Procedure', fileType: 'PDF', tags: ['topside', 'construction'], description: 'Topside and services construction document' },
    { folderId: 'hedland-con-mh', idPrefix: 'PH-MHE', count: 50, titlePrefix: 'MH Erection', variants: ['Shiploader Erection Procedure', 'Conveyor Splice Record', 'Gallery Lift Study'], documentType: 'Procedure', fileType: 'PDF', tags: ['materials handling', 'erection', 'construction'], description: 'Shiploader and conveyor erection document' },
    { folderId: 'hedland-comm-cold', idPrefix: 'PH-CCOM', count: 40, titlePrefix: 'Cold Commissioning', variants: ['No-Load Run Record', 'Interlock Test', 'Belt Tracking Record'], documentType: 'Procedure', fileType: 'PDF', tags: ['commissioning', 'cold'], description: 'Cold commissioning test record' },
    { folderId: 'hedland-comm-load', idPrefix: 'PH-LOAD', count: 30, titlePrefix: 'Load Trials', variants: ['First Ore Plan', 'Loading Rate Test', 'Vessel Trial Report'], documentType: 'Technical Report', fileType: 'PDF', tags: ['commissioning', 'load trials'], description: 'Load trial and performance document' },
    { folderId: 'hedland-hse-safety', idPrefix: 'PH-HSE', count: 40, titlePrefix: 'Safety', variants: ['Over-Water Work Procedure', 'Isolation Procedure', 'Cyclone Response Plan', 'Diving Operations Procedure'], documentType: 'Procedure', fileType: 'DOCX', tags: ['safety', 'HSE'], description: 'Site safety procedure' },
    { folderId: 'hedland-hse-marine', idPrefix: 'PH-ENV', count: 30, titlePrefix: 'Marine Environment', variants: ['Dredge Plume Monitoring', 'Marine Fauna Observation Report', 'Sea Dumping Permit'], documentType: 'Technical Report', fileType: 'PDF', tags: ['environmental', 'marine', 'compliance'], description: 'Marine environmental permit and monitoring document' },
    { folderId: 'hedland-qa-itp', idPrefix: 'PH-ITP', count: 35, titlePrefix: 'Quality', variants: ['Piling ITP', 'Marine Concrete ITP', 'Structural Steel ITP'], documentType: 'Technical Report', fileType: 'PDF', tags: ['quality', 'ITP', 'inspection'], description: 'Inspection and test plan record' },
    { folderId: 'hedland-qa-weld', idPrefix: 'PH-WLD', count: 25, titlePrefix: 'Welding', variants: ['Weld Procedure Qualification', 'NDT Report', 'Weld Map'], documentType: 'Technical Report', fileType: 'PDF', tags: ['welding', 'NDT', 'quality'], description: 'Welding and NDT record' },
    { folderId: 'hedland-ops-manuals', idPrefix: 'PH-OM', count: 12, titlePrefix: 'O&M Manual', variants: ['Shiploader O&M Manual', 'Conveyor O&M Manual'], documentType: 'Manual', fileType: 'PDF', tags: ['operations', 'manual'], description: 'Operating and maintenance manual' },
    { folderId: 'hedland-ops-asbuilt', idPrefix: 'PH-AB', count: 8, titlePrefix: 'As-Built', variants: ['Wharf As-Built', 'MH As-Built'], documentType: 'Drawing', fileType: 'PDF', tags: ['as-built', 'handover'], description: 'As-built record drawing' },
  ],
  kwinana: [
    { folderId: 'kwinana-pm-docs', idPrefix: 'KW-PMC', count: 50, titlePrefix: 'Project Controls', variants: ['Monthly Report', 'Cost Report', 'Schedule Update', 'Risk Register'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['project management', 'reporting'], description: 'Project controls and reporting documentation' },
    { folderId: 'kwinana-pm-contracts', idPrefix: 'KW-CON', count: 30, titlePrefix: 'Contract', variants: ['Variation Notice', 'Site Instruction', 'Claim Assessment'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['contracts', 'commercial'], description: 'Contract and variation documentation' },
    { folderId: 'kwinana-eng-process', idPrefix: 'KW-PID', count: 100, titlePrefix: 'Process Drawing', variants: ['P&ID Leach Circuit', 'P&ID Purification', 'PFD Train Overview', 'Mass Balance Diagram', 'Utility Flow Diagram'], documentType: 'Drawing', fileType: 'PDF', tags: ['process', 'P&ID', 'PFD'], description: 'Process engineering drawing' },
    { folderId: 'kwinana-eng-piping', idPrefix: 'KW-ISO', count: 110, titlePrefix: 'Piping Drawing', variants: ['Piping Isometric', 'Pipe Rack GA', 'Stress Sketch', 'Tie-In Detail', 'Support Standard'], documentType: 'Drawing', fileType: 'PDF', tags: ['piping', 'isometric', 'mechanical'], description: 'Piping engineering drawing' },
    { folderId: 'kwinana-eng-ei', idPrefix: 'KW-EI-DWG', count: 100, titlePrefix: 'E&I Drawing', variants: ['Single Line Diagram', 'Loop Diagram', 'Cable Block Diagram', 'Hazardous Area Layout', 'Control Architecture'], documentType: 'Drawing', fileType: 'PDF', tags: ['electrical', 'instrumentation', 'drawing'], description: 'Electrical and instrumentation drawing' },
    { folderId: 'kwinana-eng-civil', idPrefix: 'KW-CIV-DWG', count: 60, titlePrefix: 'Civil & Structural Drawing', variants: ['Foundation Plan', 'Steel Structure GA', 'Bund Detail', 'Tank Farm Layout'], documentType: 'Drawing', fileType: 'PDF', tags: ['civil', 'structural', 'drawing'], description: 'Civil and structural engineering drawing' },
    { folderId: 'kwinana-eng-specs', idPrefix: 'KW-SPEC', count: 80, titlePrefix: 'Specification', variants: ['Piping Material Spec', 'Instrumentation Spec', 'Coatings Spec', 'Acid Brick Lining Spec', 'Insulation Spec'], documentType: 'Specification', fileType: 'PDF', tags: ['specification', 'engineering'], description: 'Engineering design specification' },
    { folderId: 'kwinana-proc-datasheets', idPrefix: 'KW-VDR', count: 70, titlePrefix: 'Vendor Data', variants: ['Autoclave Datasheet', 'Crystalliser Datasheet', 'Pump Datasheet', 'Valve Datasheet', 'Analyser Datasheet'], documentType: 'Specification', fileType: 'PDF', tags: ['vendor', 'datasheet', 'procurement'], description: 'Vendor equipment data and drawings' },
    { folderId: 'kwinana-proc-specs', idPrefix: 'KW-PSPEC', count: 40, titlePrefix: 'Purchase Specification', variants: ['Reagents Package', 'Piping Package', 'E&I Package'], documentType: 'Specification', fileType: 'PDF', tags: ['procurement', 'purchasing'], description: 'Procurement package specification' },
    { folderId: 'kwinana-con-smp', idPrefix: 'KW-SMP', count: 70, titlePrefix: 'SMP Installation', variants: ['Equipment Setting Record', 'Piping Test Pack', 'Steel Erection Pack', 'Flange Management Record'], documentType: 'Procedure', fileType: 'PDF', tags: ['SMP', 'construction', 'mechanical'], description: 'Structural, mechanical and piping installation document' },
    { folderId: 'kwinana-con-ei', idPrefix: 'KW-EI', count: 50, titlePrefix: 'E&I Installation', variants: ['Cable Schedule', 'Loop Check Sheet', 'Instrument Calibration Record'], documentType: 'Procedure', fileType: 'PDF', tags: ['electrical', 'instrumentation', 'construction'], description: 'Electrical and instrumentation installation document' },
    { folderId: 'kwinana-comm-pre', idPrefix: 'KW-PRE', count: 60, titlePrefix: 'Pre-Commissioning', variants: ['Flushing Procedure', 'Leak Test Record', 'Motor Solo Run', 'Instrument Function Test'], documentType: 'Procedure', fileType: 'PDF', tags: ['pre-commissioning', 'commissioning'], description: 'Pre-commissioning procedure and record' },
    { folderId: 'kwinana-comm-sys', idPrefix: 'KW-SYS', count: 50, titlePrefix: 'Systems Completion', variants: ['System Handover Dossier', 'Punch List Report', 'Walkdown Record'], documentType: 'Technical Report', fileType: 'PDF', tags: ['systems completion', 'commissioning'], description: 'Systems completion and handover document' },
    { folderId: 'kwinana-comm-perf', idPrefix: 'KW-PERF', count: 40, titlePrefix: 'Performance Testing', variants: ['Performance Test Procedure', 'Product Quality Report', 'Nameplate Test Report'], documentType: 'Technical Report', fileType: 'PDF', tags: ['performance', 'commissioning'], description: 'Performance test document' },
    { folderId: 'kwinana-hse-safety', idPrefix: 'KW-HSE', count: 30, titlePrefix: 'Safety', variants: ['Chemical Handling Procedure', 'Confined Space Procedure', 'Emergency Response Plan'], documentType: 'Procedure', fileType: 'DOCX', tags: ['safety', 'HSE'], description: 'Site safety procedure' },
    { folderId: 'kwinana-hse-hazop', idPrefix: 'KW-HAZ', count: 30, titlePrefix: 'Process Safety', variants: ['HAZOP Report', 'SIL Assessment', 'Bowtie Analysis', 'MOC Record'], documentType: 'Technical Report', fileType: 'PDF', tags: ['HAZOP', 'process safety'], description: 'Process safety study document' },
    { folderId: 'kwinana-qa-itp', idPrefix: 'KW-ITP', count: 25, titlePrefix: 'Quality', variants: ['Piping ITP', 'E&I ITP', 'Coatings ITP'], documentType: 'Technical Report', fileType: 'PDF', tags: ['quality', 'ITP', 'inspection'], description: 'Inspection and test plan record' },
    { folderId: 'kwinana-qa-ncr', idPrefix: 'KW-NCR', count: 15, titlePrefix: 'Non-Conformance', variants: ['NCR Report', 'Corrective Action Report'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['quality', 'NCR'], description: 'Non-conformance record' },
    { folderId: 'kwinana-ops-manuals', idPrefix: 'KW-OM', count: 30, titlePrefix: 'O&M Manual', variants: ['Train 1 Operating Manual', 'Reagents O&M Manual', 'Utilities O&M Manual'], documentType: 'Manual', fileType: 'PDF', tags: ['operations', 'manual'], description: 'Operating and maintenance manual' },
    { folderId: 'kwinana-ops-asbuilt', idPrefix: 'KW-AB', count: 20, titlePrefix: 'As-Built', variants: ['Piping As-Built', 'E&I As-Built', 'Civil As-Built'], documentType: 'Drawing', fileType: 'PDF', tags: ['as-built', 'handover'], description: 'As-built record drawing' },
  ],
  goldfields: [
    { folderId: 'goldfields-pm-docs', idPrefix: 'GF-PMC', count: 50, titlePrefix: 'Project Controls', variants: ['Monthly Report', 'Cost Report', 'Schedule Update', 'Stakeholder Report'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['project management', 'reporting'], description: 'Project controls and reporting documentation' },
    { folderId: 'goldfields-pm-contracts', idPrefix: 'GF-CON', count: 30, titlePrefix: 'Contract', variants: ['Variation Notice', 'Site Instruction', 'Possession Request'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['contracts', 'commercial'], description: 'Contract and variation documentation' },
    { folderId: 'goldfields-eng-track', idPrefix: 'GF-TRK-DWG', count: 90, titlePrefix: 'Track Drawing', variants: ['Alignment Plan & Profile', 'Turnout Layout', 'Track Cross Section', 'Clearance Diagram', 'Level Crossing Detail'], documentType: 'Drawing', fileType: 'PDF', tags: ['track', 'alignment', 'rail'], description: 'Track and alignment engineering drawing' },
    { folderId: 'goldfields-eng-structures', idPrefix: 'GF-STR-DWG', count: 70, titlePrefix: 'Structures Drawing', variants: ['Bridge GA', 'Culvert Detail', 'Retaining Wall Section', 'Abutment Detail'], documentType: 'Drawing', fileType: 'PDF', tags: ['bridge', 'structural', 'drawing'], description: 'Bridges and structures engineering drawing' },
    { folderId: 'goldfields-eng-signalling', idPrefix: 'GF-SIG-DWG', count: 80, titlePrefix: 'Signalling Drawing', variants: ['Signalling Layout', 'Interlocking Diagram', 'Comms Network Architecture', 'Level Crossing Control', 'Train Control Interface'], documentType: 'Drawing', fileType: 'PDF', tags: ['signalling', 'communications', 'electrical'], description: 'Signalling and communications drawing' },
    { folderId: 'goldfields-eng-specs', idPrefix: 'GF-SPEC', count: 60, titlePrefix: 'Specification', variants: ['Ballast Spec', 'Rail & Sleeper Spec', 'Signalling Equipment Spec', 'Earthworks Spec'], documentType: 'Specification', fileType: 'PDF', tags: ['specification', 'engineering'], description: 'Engineering design specification' },
    { folderId: 'goldfields-proc-datasheets', idPrefix: 'GF-VDR', count: 50, titlePrefix: 'Vendor Data', variants: ['Points Machine Datasheet', 'Signal Datasheet', 'Radio Mast Datasheet'], documentType: 'Specification', fileType: 'PDF', tags: ['vendor', 'datasheet', 'procurement'], description: 'Vendor equipment data and drawings' },
    { folderId: 'goldfields-proc-specs', idPrefix: 'GF-PSPEC', count: 30, titlePrefix: 'Purchase Specification', variants: ['Track Materials Package', 'Signalling Package'], documentType: 'Specification', fileType: 'PDF', tags: ['procurement', 'purchasing'], description: 'Procurement package specification' },
    { folderId: 'goldfields-con-earthworks', idPrefix: 'GF-EW', count: 80, titlePrefix: 'Earthworks & Formation', variants: ['Formation Conformance Report', 'Compaction Test Record', 'Drainage Installation Record', 'Borrow Pit Plan'], documentType: 'Technical Report', fileType: 'PDF', tags: ['earthworks', 'formation', 'civil'], description: 'Earthworks and formation construction record' },
    { folderId: 'goldfields-con-track', idPrefix: 'GF-TLY', count: 60, titlePrefix: 'Track Laying', variants: ['Track Laying Procedure', 'Welding Record', 'Tamping Record', 'Track Geometry Report'], documentType: 'Procedure', fileType: 'PDF', tags: ['track', 'construction'], description: 'Track laying construction document' },
    { folderId: 'goldfields-con-structures', idPrefix: 'GF-STC', count: 50, titlePrefix: 'Structures Construction', variants: ['Bridge Pour Record', 'Girder Erection Plan', 'Culvert Installation Record'], documentType: 'Technical Report', fileType: 'PDF', tags: ['structures', 'construction'], description: 'Structures construction record' },
    { folderId: 'goldfields-comm-test', idPrefix: 'GF-TST', count: 50, titlePrefix: 'Testing & Commissioning', variants: ['Signalling Function Test', 'Test Train Run Report', 'Interlocking Test Record', 'Comms Acceptance Test'], documentType: 'Procedure', fileType: 'PDF', tags: ['testing', 'commissioning', 'rail'], description: 'Rail testing and commissioning document' },
    { folderId: 'goldfields-hse-safety', idPrefix: 'GF-HSE', count: 40, titlePrefix: 'Safety', variants: ['Rail Safety Worker Procedure', 'Track Access Procedure', 'Plant Operation Procedure'], documentType: 'Procedure', fileType: 'DOCX', tags: ['safety', 'HSE', 'rail safety'], description: 'Rail safety procedure' },
    { folderId: 'goldfields-hse-enviro', idPrefix: 'GF-ENV', count: 30, titlePrefix: 'Environmental & Heritage', variants: ['Heritage Clearance Report', 'Flora Survey', 'Dewatering Permit'], documentType: 'Technical Report', fileType: 'PDF', tags: ['environmental', 'heritage', 'compliance'], description: 'Environmental and heritage compliance document' },
    { folderId: 'goldfields-qa-itp', idPrefix: 'GF-ITP', count: 30, titlePrefix: 'Quality', variants: ['Formation ITP', 'Track ITP', 'Structures ITP'], documentType: 'Technical Report', fileType: 'PDF', tags: ['quality', 'ITP', 'inspection'], description: 'Inspection and test plan record' },
    { folderId: 'goldfields-qa-ncr', idPrefix: 'GF-NCR', count: 15, titlePrefix: 'Non-Conformance', variants: ['NCR Report', 'Corrective Action Report'], documentType: 'Technical Report', fileType: 'DOCX', tags: ['quality', 'NCR'], description: 'Non-conformance record' },
    { folderId: 'goldfields-ops-asbuilt', idPrefix: 'GF-AB', count: 15, titlePrefix: 'As-Built', variants: ['Track As-Built', 'Signalling As-Built'], documentType: 'Drawing', fileType: 'PDF', tags: ['as-built', 'handover'], description: 'As-built record drawing' },
    { folderId: 'goldfields-ops-manuals', idPrefix: 'GF-OM', count: 10, titlePrefix: 'O&M Manual', variants: ['Signalling O&M Manual', 'Track Maintenance Manual'], documentType: 'Manual', fileType: 'PDF', tags: ['operations', 'manual'], description: 'Operating and maintenance manual' },
  ],
};

function generateProjectDocuments(projectId: ProjectId): Document[] {
  const project = PROJECTS.find((p) => p.id === projectId)!;
  const assets = PROJECT_ASSETS[projectId];

  return PROJECT_SPECS[projectId]
    .flatMap((spec) =>
      Array.from({ length: spec.count }, (_, i): Document => ({
        id: `${spec.idPrefix}-${String(i + 1).padStart(3, '0')}-R${(i % 3) + 1}`,
        title: `${spec.titlePrefix} - ${spec.variants[i % spec.variants.length]} ${Math.floor(i / spec.variants.length) + 1}`,
        revisionNumber: `R${(i % 3) + 1}`,
        status: statuses[i % 5],
        author: authors[i % authors.length],
        dateCreated: getRandomDate(new Date('2024-06-01'), new Date('2025-09-01')),
        dateModified: getRandomDate(new Date('2025-09-01'), new Date('2026-06-01')),
        project: project.name,
        asset: assets[i % assets.length],
        tags: [...spec.tags],
        fileType: spec.fileType,
        fileSize: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        documentType: spec.documentType,
        description: spec.description,
        thumbnail: thumbnails[i % thumbnails.length],
        folderId: spec.folderId,
        relationships: [],
      }))
    )
    .map(withCategoryAttributes);
}

/** Documents keyed by project — DocumentBrowser selects the active project's set via scope.id. */
export const mockDocumentsByProject: Record<ProjectId, Document[]> = {
  'marra-ridge': generateProjectDocuments('marra-ridge'),
  hedland: generateProjectDocuments('hedland'),
  kwinana: generateProjectDocuments('kwinana'),
  goldfields: generateProjectDocuments('goldfields'),
};

/** All projects combined — used by search and anywhere enterprise-wide data is needed. */
export const mockDocuments: Document[] = PROJECTS.flatMap((p) => mockDocumentsByProject[p.id]);
