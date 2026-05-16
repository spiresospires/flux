export type DocumentStatus =
'Draft' |
'In Review' |
'Approved' |
'Superseded' |
'Archived';
export type DocumentType =
'Drawing' |
'Specification' |
'Technical Report' |
'Manual' |
'Procedure';
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