// FusionLive-style PM status ladder (renamed app-wide 2026-07-13 so demos read
// authentically to FusionLive users; 'Issued' is the classic distribution
// trigger). Packages.tsx has its own separate PackageStatus vocabulary.
// 'Placeholder' is the 0% rung: the record exists on the MDR/DDR and is
// scheduled, but no content has arrived. It is a STATUS, not a parallel flag —
// a placeholder cannot simultaneously be 'New'; 'New' is what the record
// becomes the moment content lands on it. See MDR_AND_PROGRESS.md.
// The rungs above Placeholder are renamed per customer in real FusionLive
// workspaces (IFR / IFA / IFC / As Built are common EPC vocabularies) — never
// key behaviour off a status string; use `isPlaceholder()` / `contentState`.
// FusionLive has no 'Superseded' or 'Archived' status.
// The grid lists CURRENT versions only, so "superseded" is a relationship
// between revisions, not a state a document is ever in: a user wanting an
// earlier revision opens the document's version stack, where non-current
// revisions are marked as such by position, not by a status chip. Documents are
// never archived either.
export type DocumentStatus =
'Placeholder' |
'New' |
'Under Review' |
'Approved' |
'Issued';
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
  /** Whether this Oracle document record has a file behind it in the content
   *  store (NFS today, S3 planned). Mirrors `status === 'Placeholder'` today, and
   *  exists ALONGSIDE it rather than instead of it for two reasons:
   *
   *  1. FusionLive customers rename their status ladder (IFR/IFA/IFC/As Built and
   *     many variants). Content affordances — upload vs. view/download/rendition,
   *     thumbnail vs. empty state — must not depend on a customisable string.
   *  2. A placeholder can sit on top of a version stack (see MDR_AND_PROGRESS.md
   *     §Placeholders in the version stack). The *current* version has no content
   *     while earlier revisions do, so "has content" is a property of a version,
   *     not of the document's history.
   *
   *  Undefined reads as 'content' — every record predating this field has a file.
   *  Typed as a string union so it satisfies the `Document` index signature. */
  contentState?: 'content' | 'placeholder';
  /** Scheduled delivery date for a placeholder (ISO yyyy-mm-dd) — the deliverable
   *  due date document controllers chase. Undefined on records with content. */
  dateExpected?: string;
  /** Party expected to supply the content — supplier, contractor or discipline
   *  lead. Placeholder-only; distinct from `author` (who registered the record). */
  responsibleParty?: string;
}
/** True when a record is a pre-registered placeholder with no file in the content
 *  store. Single source of truth for the check — `undefined` reads as 'content',
 *  so every record that predates the field is treated as having a file. */
export function isPlaceholder(doc: Pick<DocumentMetadata, 'contentState'>): boolean {
  return doc.contentState === 'placeholder';
}

/** A placeholder past its scheduled delivery date. ISO yyyy-mm-dd strings compare
 *  lexicographically, so no Date parsing and no timezone drift. Records with
 *  content are never overdue — they arrived. */
export function isOverdue(doc: Pick<DocumentMetadata, 'contentState' | 'dateExpected'>): boolean {
  if (!isPlaceholder(doc) || typeof doc.dateExpected !== 'string') return false;
  return doc.dateExpected < new Date().toISOString().slice(0, 10);
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