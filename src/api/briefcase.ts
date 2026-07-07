// [API] User-scoped briefcase — /user/briefcase (NOT workspace-scoped: items span
// every workspace the user can access, so calls carry the platform token, not a
// workspace token).
// [TODO-ENG] Briefcase is not in the G01–G30 set; suggested home is G02 (users &
// profiles), alongside /user/preferences. Confirm group + final paths.
// [AUTH]
// [PHASE-1]
import { apiClient } from './client';
import type { BriefcaseItem } from '../types/briefcase';

export function getBriefcase(): Promise<BriefcaseItem[]> {
  return apiClient.get<BriefcaseItem[]>('/user/briefcase');
}

/** Add a reference. Idempotent on docId — re-adding an existing item is a no-op. */
export function addBriefcaseItem(item: BriefcaseItem): Promise<BriefcaseItem> {
  return apiClient.post<BriefcaseItem>('/user/briefcase', item);
}

/** Flip an item between pinned-revision (static) and follow-latest (dynamic). */
export function setBriefcaseItemDynamic(docId: string, isDynamic: boolean): Promise<BriefcaseItem> {
  return apiClient.patch<BriefcaseItem>(`/user/briefcase/${encodeURIComponent(docId)}`, { isDynamic });
}

/** Remove one or more items by docId. */
export function removeBriefcaseItems(docIds: string[]): Promise<void> {
  const qs = new URLSearchParams();
  docIds.forEach((id) => qs.append('docId', id));
  return apiClient.delete<void>(`/user/briefcase?${qs.toString()}`);
}

/** Empty the briefcase. */
export function clearBriefcase(): Promise<void> {
  return apiClient.delete<void>('/user/briefcase');
}
