// [API] G05:GET /workspaces/{wsId}/folders/tree
// [AUTH]
// [PHASE-1]
// Folder CRUD (create/rename/move/delete) is G05 too — add mutations here when the
// browser grows write actions; every mutation must invalidate queryKeys.folderTree(wsId).
import { apiClient } from './client';
import type { FolderTreeResponse } from './types';

export function getFolderTree(wsId: string): Promise<FolderTreeResponse> {
  return apiClient.get<FolderTreeResponse>(`/workspaces/${wsId}/folders/tree`);
}
