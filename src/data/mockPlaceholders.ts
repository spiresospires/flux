// [MOCK] Placeholder (pending-upload) records — surfaced in search results only.
// [TBD] No replacement API confirmed; ARCHITECTURE.md says keep or remove after real data lands.
// [TODO-ENG] Decide whether placeholders are a G06 document state or a separate resource.
import type { DocumentStatus, DocumentType } from '../types/document';

export interface PlaceholderRecord {
  id: string;
  reference: string;
  title: string;
  status: DocumentStatus | 'Pending Upload';
  type: DocumentType;
  location: string;
  author: string;
  revision: string;
  dateCreated: string;
  dateModified: string;
  discipline: string;
  description: string;
}

export const mockPlaceholders: PlaceholderRecord[] = [
  {
    id: 'ph-mech-pump-skid-ga-07',
    reference: 'M-3012-GA-007',
    title: 'General Arrangement - Pump Skid 07',
    status: 'Pending Upload',
    type: 'Drawing',
    location: '/Engineering/Drawings/Mechanical',
    author: 'Sarah Chen',
    revision: 'A',
    dateCreated: '2026-05-01',
    dateModified: '2026-05-06',
    discipline: 'Mechanical',
    description: 'Document placeholder reserved for the next pump skid general arrangement.'
  },
  {
    id: 'ph-elec-mcc03-cable-schedule',
    reference: 'E-2004-CAB-011',
    title: 'MCC-03 Cable Schedule',
    status: 'New',
    type: 'Specification',
    location: '/Engineering/Drawings/Electrical',
    author: 'Daniel Park',
    revision: 'P01',
    dateCreated: '2026-04-22',
    dateModified: '2026-05-03',
    discipline: 'Electrical',
    description: 'Metadata created ahead of cable schedule upload for Substation A.'
  },
  {
    id: 'ph-civil-foundation-redlines',
    reference: 'C-4401-RED-004',
    title: 'Civil Foundation Redline Markups',
    status: 'Under Review',
    type: 'Drawing',
    location: '/As-Built Records/Redline Markups',
    author: 'Marco Rossi',
    revision: 'B',
    dateCreated: '2026-04-14',
    dateModified: '2026-04-29',
    discipline: 'Civil',
    description: 'Placeholder for incoming civil foundation redlines from the construction team.'
  },
  {
    id: 'ph-proc-pid-cooling-return',
    reference: 'P-1001-PID-004',
    title: 'Cooling Water Return P&ID',
    status: 'Pending Upload',
    type: 'Drawing',
    location: '/Engineering/Drawings/Process Flow Diagrams',
    author: 'Priya Natarajan',
    revision: 'A',
    dateCreated: '2026-05-05',
    dateModified: '2026-05-05',
    discipline: 'Process',
    description: 'Awaiting first upload for the cooling water return P&ID.'
  },
  {
    id: 'ph-hse-confined-space-unit-200',
    reference: 'PROC-HSE-044',
    title: 'Confined Space Entry Procedure - Unit 200',
    status: 'New',
    type: 'Procedure',
    location: '/Health, Safety & Environment/Work Permits',
    author: 'Aisha Khan',
    revision: 'R1',
    dateCreated: '2026-04-18',
    dateModified: '2026-05-02',
    discipline: 'HSE',
    description: 'Procedure shell created before final HSE-controlled content is uploaded.'
  },
  {
    id: 'ph-inst-loop-ft205',
    reference: 'I-7102-LOOP-205',
    title: 'Loop Sheet - FT-205',
    status: 'Pending Upload',
    type: 'Technical Report',
    location: '/Engineering/Drawings/Instrumentation',
    author: 'Aisha Khan',
    revision: 'A',
    dateCreated: '2026-04-28',
    dateModified: '2026-05-04',
    discipline: 'Instrumentation',
    description: 'Placeholder for the FT-205 loop sheet expected from instrumentation.'
  },
  {
    id: 'ph-vendor-pump-maint-manual',
    reference: 'VEN-MAN-PUMP-204A',
    title: 'Vendor Manual - Pump P-204A',
    status: 'Pending Upload',
    type: 'Manual',
    location: '/Vendor Documents/Vendor Manuals',
    author: 'Hugo Martinez',
    revision: 'R0',
    dateCreated: '2026-03-30',
    dateModified: '2026-04-25',
    discipline: 'Mechanical',
    description: 'Manual metadata created while waiting for the vendor maintenance file.'
  },
  {
    id: 'ph-qa-ndt-record-pack',
    reference: 'QA-NDT-REC-018',
    title: 'NDT Record Pack - Area 01 Welds',
    status: 'Under Review',
    type: 'Technical Report',
    location: '/Compliance & Quality/Quality Assurance',
    author: 'Mark Doyle',
    revision: 'B',
    dateCreated: '2026-04-09',
    dateModified: '2026-04-30',
    discipline: 'QA/QC',
    description: 'Placeholder for consolidated NDT records after QA review completes.'
  }
];
