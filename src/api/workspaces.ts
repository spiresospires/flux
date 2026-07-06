// [API] G03:GET /workspaces
// [AUTH]
// [PHASE-1]
import { apiClient } from './client';
import type { Workspace } from './types';

export function getWorkspaces(): Promise<Workspace[]> {
  return apiClient.get<Workspace[]>('/workspaces');
}
