// React Query hooks for Automatic Distribution (AUTO_DISTRIBUTION_PLAN.md).
// Pages consume these — never src/api/distribution.ts directly. Rule mutations
// invalidate the workspace rule set so the draft banner / diff badges refresh.
// [PHASE-1]
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryKeys';
import {
  createAdRule,
  deleteAdRule,
  getAdRuleSet,
  getAdSettings,
  getAdUsers,
  getWorkgroups,
  updateAdRule,
} from '../api/distribution';
import type { AdRule } from '../types/distribution';

export function useAdRuleSet(wsId: string | null) {
  return useQuery({
    queryKey: queryKeys.adRuleSet(wsId ?? ''),
    queryFn: () => getAdRuleSet(wsId!),
    enabled: !!wsId,
  });
}

export function useAdSettings(wsId: string | null) {
  return useQuery({
    queryKey: queryKeys.adSettings(wsId ?? ''),
    queryFn: () => getAdSettings(wsId!),
    enabled: !!wsId,
  });
}

export function useWorkgroups(wsId: string | null) {
  return useQuery({
    queryKey: queryKeys.workgroups(wsId ?? ''),
    queryFn: () => getWorkgroups(wsId!),
    enabled: !!wsId,
  });
}

export function useAdUsers() {
  return useQuery({
    queryKey: queryKeys.adUsers,
    queryFn: getAdUsers,
    // The directory is static seed data — no need to refetch per mount.
    staleTime: Infinity,
  });
}

export function useCreateAdRule(wsId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: Omit<AdRule, 'id' | 'updatedAt' | 'updatedBy'>) => createAdRule(wsId, rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adRuleSet(wsId) }),
  });
}

export function useUpdateAdRule(wsId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: AdRule) => updateAdRule(wsId, rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adRuleSet(wsId) }),
  });
}

export function useDeleteAdRule(wsId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteAdRule(wsId, ruleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adRuleSet(wsId) }),
  });
}
