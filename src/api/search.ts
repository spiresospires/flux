// [API] G19:POST /workspaces/{wsId}/search — cursor-paginated per ADR-011.
// [AUTH]
// [PHASE-1]
// [TODO-ENG] Enterprise (all-workspaces) search: the SPA passes the sentinel wsId
// '_all' today because SearchResults spans every workspace the user can access.
// Confirm whether production exposes a cross-workspace search endpoint or the SPA
// fans out per workspace.
import { apiClient } from './client';
import type { SearchRequest, SearchResponse } from './types';

export const ENTERPRISE_SEARCH_SCOPE = '_all';

export function search(wsId: string, request: SearchRequest): Promise<SearchResponse> {
  return apiClient.post<SearchResponse>(`/workspaces/${wsId}/search`, request);
}
