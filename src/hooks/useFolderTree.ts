// [API] G05:GET /workspaces/{wsId}/folders/tree
// [AUTH]
// [PHASE-1]
// Any folder mutation (create/rename/move/delete) must invalidate
// queryKeys.folderTree(wsId); a G31 folder.* event does the same (ADR-010).
import { useQuery } from '@tanstack/react-query';
import { getFolderTree } from '../api/folders';
import { queryKeys } from '../api/queryKeys';

export function useFolderTree(wsId: string) {
  return useQuery({
    queryKey: queryKeys.folderTree(wsId),
    queryFn: () => getFolderTree(wsId),
  });
}
