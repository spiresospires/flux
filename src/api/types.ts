// API request/response shapes — hand-written for now.
// [TODO-ENG] Replace with openapi-typescript output (src/api/types/generated/) once
// the Swagger spec is stable; these shapes follow ARCHITECTURE.md ADR-011.
// [PHASE-1]
import type { Document, Folder, DocumentStatus, DocumentType } from '../types/document';
import type { SearchResult, SearchResultType } from '../types/search';

/** Cursor-paginated list envelope (ADR-011). No offset paging, no X-Total-Count. */
export interface ListResponse<T> {
  items: T[];
  /** Opaque keyset cursor for the next page; null when this is the last page. */
  nextCursor: string | null;
  /** Cheap approximate total for "~1,140 documents" UI — [TODO-ENG] source strategy. */
  totalApprox?: number;
}

/** G03 workspace — mirrors the prototype Project shape until openapi-typescript lands. */
export interface Workspace {
  id: string;
  name: string;
  client: string;
  assetType: string;
  phase: string;
  location: { lat: number; lng: number; locality: string };
  isFluxRefactor?: boolean;
}

/** G06 GET /workspaces/{wsId}/documents query parameters (ADR-011). */
export interface DocumentListParams {
  folderId?: string;
  /** Include documents in all descendant folders of folderId. */
  recursive?: boolean;
  status?: DocumentStatus[];
  documentType?: DocumentType[];
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export type DocumentListResponse = ListResponse<Document>;
export type FolderTreeResponse = Folder[];

/** G19 POST /workspaces/{wsId}/search request body (ADR-011 pagination). */
export interface SearchRequest {
  query: string;
  /**
   * Result-type facet filter (the type tabs in SearchResults). The response
   * `aggregations` are always computed over the UNFILTERED result set so facet
   * counts stay stable while a tab is active — standard search-facet semantics.
   */
  types?: SearchResultType[];
  filters?: {
    folderId?: string;
    status?: string[];
    documentType?: string[];
    dateRange?: { from?: string; to?: string };
  };
  limit?: number;
  cursor?: string;
}

export interface SearchResponse extends ListResponse<SearchResult> {
  /** Facet counts driving the FilterPanel chips. */
  aggregations: Partial<Record<SearchResultType, number>>;
}
