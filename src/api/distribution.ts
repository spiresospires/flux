// [API] Automatic Distribution — workspace-scoped rule sets, settings,
// workgroups and the user directory (AUTO_DISTRIBUTION_PLAN.md).
// Rule mutations operate on the DRAFT working copy only; publish/history land
// in AD 2, evaluation endpoints (tester/log/unmatched) in AD 3/4.
// [TODO-ENG] Not in the G01–G30 set — group allocation pending.
// [AUTH] Workspace-scoped calls carry the workspace token.
// [PHASE-1]
import { apiClient } from './client';
import type { AdRule, AdRuleSet, AdSettings } from '../types/distribution';
import type { AdUser, Workgroup } from '../types/workgroup';

export function getAdRuleSet(wsId: string): Promise<AdRuleSet> {
  return apiClient.get<AdRuleSet>(`/workspaces/${encodeURIComponent(wsId)}/distribution/ruleset`);
}

export function getAdSettings(wsId: string): Promise<AdSettings> {
  return apiClient.get<AdSettings>(`/workspaces/${encodeURIComponent(wsId)}/distribution/settings`);
}

/** Create a draft rule. The server assigns id/updatedAt/updatedBy. */
export function createAdRule(wsId: string, rule: Omit<AdRule, 'id' | 'updatedAt' | 'updatedBy'>): Promise<AdRule> {
  return apiClient.post<AdRule>(`/workspaces/${encodeURIComponent(wsId)}/distribution/rules`, rule);
}

/** Replace a draft rule's content. */
export function updateAdRule(wsId: string, rule: AdRule): Promise<AdRule> {
  return apiClient.patch<AdRule>(
    `/workspaces/${encodeURIComponent(wsId)}/distribution/rules/${encodeURIComponent(rule.id)}`,
    rule
  );
}

/** Remove a rule from the draft (it stays in the published version until publish). */
export function deleteAdRule(wsId: string, ruleId: string): Promise<void> {
  return apiClient.delete<void>(
    `/workspaces/${encodeURIComponent(wsId)}/distribution/rules/${encodeURIComponent(ruleId)}`
  );
}

/** Publish the draft: snapshot → new version, appended to history. Summary is
 *  mandatory — it becomes the History entry (server 400s without it). */
export function publishAdRuleSet(wsId: string, summary: string): Promise<AdRuleSet> {
  return apiClient.post<AdRuleSet>(`/workspaces/${encodeURIComponent(wsId)}/distribution/publish`, { summary });
}

/** Replace the draft with a historical version's rules ("restore as draft").
 *  Re-enters the normal publish flow — nothing goes live until published. */
export function restoreAdVersion(wsId: string, version: number): Promise<AdRuleSet> {
  return apiClient.post<AdRuleSet>(`/workspaces/${encodeURIComponent(wsId)}/distribution/restore`, { version });
}

export function updateAdSettings(wsId: string, settings: AdSettings): Promise<AdSettings> {
  return apiClient.patch<AdSettings>(`/workspaces/${encodeURIComponent(wsId)}/distribution/settings`, settings);
}

export function getWorkgroups(wsId: string): Promise<Workgroup[]> {
  return apiClient.get<Workgroup[]>(`/workspaces/${encodeURIComponent(wsId)}/workgroups`);
}

/** Directory of users referenced by rules and workgroups. */
export function getAdUsers(): Promise<AdUser[]> {
  return apiClient.get<AdUser[]>('/users');
}
