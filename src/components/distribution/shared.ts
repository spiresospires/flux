// Shared display helpers for the Automatic Distribution components.
// [PHASE-1]
import type { AdRecipientRef } from '../../types/distribution';
import type { AdUser, Workgroup } from '../../types/workgroup';

export interface ResolvedRecipient {
  name: string;
  kind: AdRecipientRef['kind'];
  /** False when a referenced user is deactivated or the reference is dangling —
   *  the list surfaces this so managers can fix rules before publish. */
  active: boolean;
}

export function resolveRecipient(
  ref: AdRecipientRef,
  users: AdUser[],
  workgroups: Workgroup[]
): ResolvedRecipient {
  switch (ref.kind) {
    case 'user': {
      const user = users.find((u) => u.id === ref.userId);
      return { name: user?.name ?? 'Unknown user', kind: 'user', active: user?.active ?? false };
    }
    case 'workgroup': {
      const group = workgroups.find((w) => w.id === ref.workgroupId);
      return { name: group?.name ?? 'Unknown workgroup', kind: 'workgroup', active: !!group };
    }
    case 'external':
      return { name: ref.email, kind: 'external', active: true };
  }
}

export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
