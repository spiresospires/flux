// [API] G03:GET /workspaces
// [AUTH]
// [PHASE-1]
import { useQuery } from '@tanstack/react-query';
import { getWorkspaces } from '../api/workspaces';
import { queryKeys } from '../api/queryKeys';

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: getWorkspaces,
    // The workspace list changes rarely; a G31 workspace.* event invalidates it.
    staleTime: 5 * 60_000,
  });
}
