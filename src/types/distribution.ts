// Automatic Distribution — rule model (AUTO_DISTRIBUTION_PLAN.md §2).
// The rule LIST is the source of truth; the matrix view is derived from it.
// One rule set per workspace: an implicit draft working copy + the published
// version + history. All matching rules fire (never first-match-wins); dedupe
// resolves collisions via the workspace action-precedence list.
// [API] /workspaces/{wsId}/distribution/* — [TODO-ENG] group allocation pending.
// [PHASE-1]
import type { DocumentStatus } from './document';
import type { ProjectId } from '../data/projects';

/** All six actions are modelled from day one; downstream activity creation is
 *  mocked as distribution-log entries until FLUX grows an activity engine. */
export type AdActionType =
  | 'formal-review'
  | 'formal-approval'
  | 'message'
  | 'transmittal'
  | 'technical-query'
  | 'rfi';

export type AdOperator = 'is' | 'is-not' | 'in' | 'contains' | 'starts-with' | 'between';

export interface AdCondition {
  /** Key from the AD_CONDITION_FIELDS registry (distributionEngine.ts). */
  field: string;
  operator: AdOperator;
  /** 1..n values; 'between' uses [from, to]. Multi-value document fields
   *  (tags) match when ANY value matches. */
  values: string[];
}

export type AdTrigger =
  | { kind: 'upload' }
  | { kind: 'status-change'; toStatus: DocumentStatus }
  | { kind: 'manual' };

export type AdRecipientRef =
  | { kind: 'user'; userId: string }
  | { kind: 'workgroup'; workgroupId: string }
  /** MODEL ONLY in AD 1–4 — no UI until the external-recipients stage. */
  | { kind: 'external'; email: string };

export interface AdAssignment {
  recipient: AdRecipientRef;
  action: AdActionType;
  /** From the workspace reason vocabulary (AdSettings.reasons). */
  reasonId: string;
  /** MODEL ONLY — physical/print-shop distribution is deferred. */
  copies?: number;
  colour?: 'colour' | 'bw';
}

export interface AdRule {
  id: string;
  name: string;
  description?: string;
  triggers: AdTrigger[];
  /** AND-joined. Empty = matches every document (editor warns, never blocks). */
  conditions: AdCondition[];
  assignments: AdAssignment[];
  /** Conflict tiebreaker only (same action, different params) — surfaced
   *  contextually on conflict, not as a routine per-rule field. */
  priority: number;
  enabled: boolean;
  /** ISO dates; dates only — no project-phase concept. */
  effectiveFrom?: string;
  effectiveUntil?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdRuleSetVersion {
  version: number;
  rules: AdRule[];
  publishedAt: string;
  publishedBy: string;
  /** Required at publish time — becomes the History entry. */
  summary: string;
}

export interface AdRuleSet {
  workspaceId: ProjectId;
  /** The implicit working copy every edit lands in. */
  draft: { rules: AdRule[]; baseVersion: number };
  published: AdRuleSetVersion | null;
  /** Newest first. Restore-as-draft re-enters the normal publish flow. */
  history: AdRuleSetVersion[];
}

export interface AdReason {
  id: string;
  label: string;
}

export interface AdSettings {
  /** Dedupe: a person owed two DIFFERENT actions gets the earlier one in this
   *  list (default: review beats approval beats transmittal … beats message). */
  actionPrecedence: AdActionType[];
  /** Editable vocabularies — never frozen (unlike legacy FusionLive codes). */
  reasons: Record<AdActionType, AdReason[]>;
  /** Who gets unmatched-document and skipped-recipient alerts. */
  notifyUserIds: string[];
}

// ── Engine output (drives Tester, Log, Unmatched — AD 3/4) ──────────────────

export interface AdResolvedAssignment {
  /** Workgroups are expanded to individuals at evaluation time. */
  userId: string;
  via: AdRecipientRef;
  action: AdActionType;
  reasonId: string;
  ruleId: string;
  /** Present when the row was removed by dedupe/skip — kept for the trace UI. */
  dropped?: 'dedupe-same' | 'precedence' | 'priority' | 'recipient-inactive';
}

export interface AdEvaluation {
  documentId: string;
  trigger: AdTrigger;
  firedRuleIds: string[];
  /** "Nearest miss" explanations for the unmatched UX. */
  nearMisses: { ruleId: string; failedCondition: AdCondition }[];
  resolved: AdResolvedAssignment[];
  outcome: 'distributed' | 'unmatched';
}

export interface AdLogEntry {
  id: string;
  at: string;
  documentId: string;
  trigger: AdTrigger;
  kind: 'distributed' | 'unmatched' | 'recipient-skipped' | 'rerun';
  evaluation: AdEvaluation;
}
