// FusionLive-style PM status ladder (renamed app-wide 2026-07-13 so demos read
// authentically to FusionLive users; 'Issued' is the classic distribution
// trigger). Packages.tsx has its own separate PackageStatus vocabulary.
export type DocumentStatus =
'New' |
'Under Review' |
'Approved' |
'Issued' |
'Superseded' |
'Archived';
export type DocumentType =
'Drawing' |
'Specification' |
'Technical Report' |
'Manual' |
'Procedure';
/** FusionLive Document Category — the class that carries a document's extra
 *  metadata schema and drives Automatic Distribution rules. Distinct from
 *  DocumentType (the format). Values assigned per document family in
 *  mockDocuments; keep this list in sync with inferDocCategory there. */
export const DOCUMENT_CATEGORIES = [
  'DRAWING',
  'SPECIFICATION',
  'VENDOR - SUPPLIER',
  'PROJECT CONTROLS',
  'CONTRACTS',
  'HSE & ENVIRONMENT',
  'QUALITY',
  'COMMISSIONING',
  'CONSTRUCTION RECORDS',
  'HANDOVER & O&M',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export interface DocumentMetadata {
  id: string;
  title: string;
  revisionNumber: string;
  status: DocumentStatus;
  author: string;
  dateCreated: string;
  dateModified: string;
  project: string;
  asset?: string;
  tags: string[];
  fileType: string;
  fileSize: string;
  documentType: DocumentType;
  description: string;
  thumbnail: string;
  folderId?: string; // Added for folder organization
  /** Engineering discipline — primary condition field for Automatic Distribution
   *  (AUTO_DISTRIBUTION_PLAN.md §1). Populated by mockDocuments from the inferred
   *  category; optional because legacy items (e.g. old briefcase snapshots) predate it. */
  discipline?: string;
  /** FusionLive Document Category (see DOCUMENT_CATEGORIES). Optional for the
   *  same legacy-snapshot reason as discipline; always set by mockDocuments. */
  category?: DocumentCategory;
}
export interface DocumentRelationship {
  type: 'parent' | 'child' | 'reference' | 'referenced-by' | 'grouped-with';
  documentId: string;
  label: string;
}
export interface Document extends DocumentMetadata {
  relationships: DocumentRelationship[];
  content?: string;
  [key: string]: string | string[] | DocumentRelationship[] | undefined;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  documentCount: number;
}