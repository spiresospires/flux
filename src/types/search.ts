export type SearchResultType =
  | 'document'
  | 'placeholder'
  | 'approval'
  | 'review'
  | 'transmittal'
  | 'rfi'
  | 'change-request'
  | 'package';

export interface SearchableRecord {
  id: string;
  resultType: SearchResultType;
  reference: string;
  title: string;
  status: string;
  objectType: string;
  location: string;
  /** Folder ID used to navigate directly into the document browser with the folder pre-selected. */
  folderId?: string;
  /** Project workspace the record belongs to. */
  project?: string;
  /** ID of the project workspace — used to switch the scope when navigating from search. */
  projectId?: string;
  author: string;
  dateCreated?: string;
  dateModified?: string;
  revision?: string;
  discipline?: string;
  description?: string;
  hasUploadedContent?: boolean;
  searchableText: string[];
}

export interface SearchResult extends SearchableRecord {
  snippet: string;
  matchedFields: string[];
}
