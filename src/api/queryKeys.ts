// React Query key factory — the single source of cache keys.
// These keys are also the invalidation targets for G31 real-time events
// (ADR-010 event-type → key table); keep the two in sync.
// [PHASE-1]
import type { DocumentListParams, SearchRequest } from './types';

export const queryKeys = {
  workspaces: ['workspaces'] as const,
  folderTree: (wsId: string) => ['folders', 'tree', wsId] as const,
  /** All document lists for a workspace — invalidate on any document.* event. */
  documentsRoot: (wsId: string) => ['documents', wsId] as const,
  documents: (wsId: string, params: DocumentListParams) => ['documents', wsId, params] as const,
  document: (wsId: string, docId: string) => ['document', wsId, docId] as const,
  searchRoot: (wsId: string) => ['search', wsId] as const,
  search: (wsId: string, request: SearchRequest) => ['search', wsId, request] as const,
  /** User-scoped (no wsId) — the briefcase spans every workspace the user can access. */
  briefcase: ['user', 'briefcase'] as const,
  /** Automatic Distribution (AUTO_DISTRIBUTION_PLAN.md) — invalidate adRuleSet on any rule mutation. */
  adRuleSet: (wsId: string) => ['distribution', 'ruleset', wsId] as const,
  adSettings: (wsId: string) => ['distribution', 'settings', wsId] as const,
  workgroups: (wsId: string) => ['workgroups', wsId] as const,
  adUsers: ['users', 'directory'] as const,
};
