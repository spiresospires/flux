// Briefcase — a private, user-scoped, cross-workspace collection of document
// references (see BRIEFCASE_PLAN.md for the product framing).
//
// Server state lives in React Query; this context only adapts it to the stable
// useBriefcase() interface so the consumer components (LeftRail badge, grids,
// panels, search cards, MyBriefcase page) never change when the backend does.
// Mutations are optimistic — a briefcase toggle must feel instant — with
// rollback on error and an invalidate on settle.
//
// [API] GET/POST/PATCH/DELETE /user/briefcase (src/api/briefcase.ts — MSW-served
//       in the prototype; user-scoped, NOT workspace-scoped).
// [TODO-ENG] Confirm the API group (suggested: G02 users & profiles).
// [AUTH]
// [PHASE-1]
import React, { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BriefcaseInput, BriefcaseItem } from '../types/briefcase';
import {
  getBriefcase,
  addBriefcaseItem,
  setBriefcaseItemDynamic,
  removeBriefcaseItems,
  clearBriefcase,
} from '../api/briefcase';
import { queryKeys } from '../api/queryKeys';
import { useWorkspaces } from '../hooks/useWorkspaces';
import type { ProjectId } from '../data/projects';

interface BriefcaseContextType {
  items: BriefcaseItem[];
  count: number;
  add: (input: BriefcaseInput) => void;
  remove: (docId: string) => void;
  removeMany: (docIds: string[]) => void;
  clear: () => void;
  isInBriefcase: (docId: string) => boolean;
  toggleDynamic: (docId: string) => void;
}

const BriefcaseContext = createContext<BriefcaseContextType | undefined>(undefined);

const EMPTY_ITEMS: BriefcaseItem[] = [];

/**
 * useMutation wrapper with the standard optimistic-update lifecycle:
 * apply `apply(prev, vars)` to the cached list immediately, roll back on
 * error, reconcile with the server on settle.
 */
function useBriefcaseMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  apply: (prev: BriefcaseItem[], vars: TVars) => BriefcaseItem[]
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.briefcase });
      const previous = queryClient.getQueryData<BriefcaseItem[]>(queryKeys.briefcase);
      queryClient.setQueryData<BriefcaseItem[]>(queryKeys.briefcase, (prev) =>
        apply(prev ?? [], vars)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.briefcase, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.briefcase }),
  });
}

export function BriefcaseProvider({ children }: { children: React.ReactNode }) {
  // Workspace identity comes from G03, not the static PROJECTS array.
  const { data: workspaces } = useWorkspaces();
  const { data: items = EMPTY_ITEMS } = useQuery({
    queryKey: queryKeys.briefcase,
    queryFn: getBriefcase,
  });

  const addMutation = useBriefcaseMutation(
    (item: BriefcaseItem) => addBriefcaseItem(item),
    (prev, item) => (prev.some((i) => i.docId === item.docId) ? prev : [item, ...prev])
  );
  const removeMutation = useBriefcaseMutation(
    (docIds: string[]) => removeBriefcaseItems(docIds),
    (prev, docIds) => {
      const ids = new Set(docIds);
      return prev.filter((i) => !ids.has(i.docId));
    }
  );
  const clearMutation = useBriefcaseMutation(
    () => clearBriefcase(),
    () => []
  );
  const dynamicMutation = useBriefcaseMutation(
    ({ docId, isDynamic }: { docId: string; isDynamic: boolean }) =>
      setBriefcaseItemDynamic(docId, isDynamic),
    (prev, { docId, isDynamic }) =>
      prev.map((i) => (i.docId === docId ? { ...i, isDynamic } : i))
  );

  const resolveProjectId = (projectName?: string): ProjectId | null => {
    if (!projectName || !workspaces) return null;
    return (workspaces.find((w) => w.name === projectName)?.id as ProjectId) ?? null;
  };

  const add = (input: BriefcaseInput) => {
    if (items.some((i) => i.docId === input.docId)) return;
    addMutation.mutate({
      docId: input.docId,
      title: input.title,
      reference: input.reference ?? input.docId,
      pinnedRevision: input.revision ?? '—',
      status: input.status ?? 'Unknown',
      fileType: input.fileType ?? '—',
      fileSize: input.fileSize,
      author: input.author,
      sourceProjectId: resolveProjectId(input.projectName),
      sourceWorkspaceName: input.projectName ?? 'Unknown workspace',
      folderId: input.folderId,
      isDynamic: false,
      addedAt: new Date().toISOString(),
      state: 'current',
    });
  };

  const remove = (docId: string) => removeMutation.mutate([docId]);
  const removeMany = (docIds: string[]) => removeMutation.mutate(docIds);
  const clear = () => clearMutation.mutate(undefined);
  const isInBriefcase = (docId: string) => items.some((i) => i.docId === docId);
  const toggleDynamic = (docId: string) => {
    const current = items.find((i) => i.docId === docId);
    if (!current) return;
    dynamicMutation.mutate({ docId, isDynamic: !current.isDynamic });
  };

  return (
    <BriefcaseContext.Provider
      value={{ items, count: items.length, add, remove, removeMany, clear, isInBriefcase, toggleDynamic }}
    >
      {children}
    </BriefcaseContext.Provider>
  );
}

export function useBriefcase() {
  const ctx = useContext(BriefcaseContext);
  if (!ctx) {
    throw new Error('useBriefcase must be used within a BriefcaseProvider');
  }
  return ctx;
}
