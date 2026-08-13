// [API] G05:GET /workspaces/{wsId}/folders/tree
// [AUTH]
// [PHASE-1]
// Folder CRUD (create/rename/move/delete) is G05 too — add mutations here when the
// browser grows write actions; every mutation must invalidate queryKeys.folderTree(wsId).
import { apiClient } from './client';
import type { FolderTreeResponse } from './types';

// wsId is encoded: it reaches here from the ?ws= deep-link param (ADR-010), so it
// is not guaranteed path-safe. Matches src/api/distribution.ts.
export function getFolderTree(wsId: string): Promise<FolderTreeResponse> {
  return apiClient.get<FolderTreeResponse>(`/workspaces/${encodeURIComponent(wsId)}/folders/tree`);
}
