// Automatic Distribution engine — MOCK-SERVER ONLY at runtime.
// The real matching engine is server-side in the SaaS platform; the browser
// never evaluates rules in production. This module exists so the MSW mock
// server (src/mocks/handlers.ts) can answer the Tester/Log/Unmatched endpoints
// consistently, and so its behaviour + the AdEvaluation payload serve as the
// acceptance spec for the real backend implementation. [TODO-ENG]
// Pages import only the display helpers and the condition-field registry from
// here — never the evaluation itself (that arrives behind HTTP in AD 3).
// [PHASE-1]
import type {
  AdActionType,
  AdCondition,
  AdOperator,
  AdRule,
  AdRuleSet,
  AdTrigger,
} from '../types/distribution';

// ── Condition field registry ─────────────────────────────────────────────────
// Adding a conditionable document field is a registry entry, not a schema
// change. `enum` fields get select/multi-select editors; `text` free input;
// `tags` matches when ANY of the document's tags satisfies the operator.

export interface AdConditionFieldDef {
  key: string;
  label: string;
  kind: 'enum' | 'text' | 'tags';
  values?: readonly string[];
}

export const DISCIPLINES = [
  'Structural',
  'Electrical',
  'Mechanical',
  'Civil',
  'Architectural',
  'Plumbing',
  'HVAC',
] as const;

const DOCUMENT_TYPES = ['Drawing', 'Specification', 'Technical Report', 'Manual', 'Procedure'] as const;
const PM_STATUSES = ['Draft', 'In Review', 'Approved', 'Superseded', 'Archived'] as const;

export const AD_CONDITION_FIELDS: readonly AdConditionFieldDef[] = [
  { key: 'discipline', label: 'Discipline', kind: 'enum', values: DISCIPLINES },
  { key: 'documentType', label: 'Document type', kind: 'enum', values: DOCUMENT_TYPES },
  { key: 'status', label: 'PM status', kind: 'enum', values: PM_STATUSES },
  { key: 'tags', label: 'Tags', kind: 'tags' },
  { key: 'asset', label: 'Asset', kind: 'text' },
];

export function conditionFieldDef(key: string): AdConditionFieldDef | undefined {
  return AD_CONDITION_FIELDS.find((f) => f.key === key);
}

/** Operators offered per field kind ('between' is reserved for future
 *  date/numeric fields — none registered yet). */
export function operatorsForKind(kind: AdConditionFieldDef['kind']): AdOperator[] {
  switch (kind) {
    case 'enum':
      return ['is', 'is-not', 'in'];
    case 'tags':
      return ['contains', 'is'];
    case 'text':
      return ['is', 'contains', 'starts-with'];
  }
}

// ── Display helpers ──────────────────────────────────────────────────────────

export const ACTION_TYPES: readonly AdActionType[] = [
  'formal-review',
  'formal-approval',
  'message',
  'transmittal',
  'technical-query',
  'rfi',
];

export const ACTION_LABELS: Record<AdActionType, string> = {
  'formal-review': 'Formal Review',
  'formal-approval': 'Formal Approval',
  message: 'Message',
  transmittal: 'Transmittal',
  'technical-query': 'Technical Query',
  rfi: 'RFI',
};

const OPERATOR_TEXT: Record<AdOperator, string> = {
  is: 'is',
  'is-not': 'is not',
  in: 'in',
  contains: 'contains',
  'starts-with': 'starts with',
  between: 'between',
};

export function describeCondition(condition: AdCondition): string {
  const label = conditionFieldDef(condition.field)?.label ?? condition.field;
  const op = OPERATOR_TEXT[condition.operator];
  if (condition.operator === 'in') return `${label} in [${condition.values.join(', ')}]`;
  if (condition.operator === 'between') return `${label} between ${condition.values[0]} and ${condition.values[1]}`;
  return `${label} ${op} ${condition.values.join(', ')}`;
}

export function summariseConditions(rule: AdRule): string {
  if (rule.conditions.length === 0) return 'All documents';
  return rule.conditions.map(describeCondition).join(' AND ');
}

export function describeTrigger(trigger: AdTrigger): string {
  switch (trigger.kind) {
    case 'upload':
      return 'On upload';
    case 'status-change':
      return `Status → ${trigger.toStatus}`;
    case 'manual':
      return 'Manual';
  }
}

/** Group key for the rules list's switchable group-by. */
export function ruleGroupKey(rule: AdRule, groupBy: 'discipline' | 'category' | 'trigger'): string {
  if (groupBy === 'trigger') {
    return rule.triggers.length === 0 ? 'No trigger' : rule.triggers.map(describeTrigger).join(' · ');
  }
  const field = groupBy === 'discipline' ? 'discipline' : 'documentType';
  const condition = rule.conditions.find((c) => c.field === field);
  if (!condition || condition.values.length === 0) {
    return groupBy === 'discipline' ? 'All disciplines' : 'All document types';
  }
  if (condition.operator === 'is-not') return `Not ${condition.values.join(', ')}`;
  return condition.values.join(', ');
}

// ── Draft vs published diff ──────────────────────────────────────────────────
// updatedAt/updatedBy are stamped on every save, so they are excluded from the
// comparison — a rule edited back to its published content counts as unchanged.

function comparableRule(rule: AdRule): string {
  const { updatedAt: _at, updatedBy: _by, ...rest } = rule;
  return JSON.stringify(rest);
}

export type RuleChangeStatus = 'new' | 'edited' | 'unchanged';

export interface RuleSetDiff {
  /** ruleId → status for every draft rule. */
  byRule: Record<string, RuleChangeStatus>;
  added: number;
  edited: number;
  removed: number;
  total: number;
}

export function diffRuleSet(ruleSet: AdRuleSet): RuleSetDiff {
  const publishedById = new Map(
    (ruleSet.published?.rules ?? []).map((r) => [r.id, comparableRule(r)])
  );
  const byRule: Record<string, RuleChangeStatus> = {};
  let added = 0;
  let edited = 0;
  for (const rule of ruleSet.draft.rules) {
    const published = publishedById.get(rule.id);
    if (published === undefined) {
      byRule[rule.id] = 'new';
      added += 1;
    } else if (published !== comparableRule(rule)) {
      byRule[rule.id] = 'edited';
      edited += 1;
    } else {
      byRule[rule.id] = 'unchanged';
    }
  }
  const draftIds = new Set(ruleSet.draft.rules.map((r) => r.id));
  const removed = (ruleSet.published?.rules ?? []).filter((r) => !draftIds.has(r.id)).length;
  return { byRule, added, edited, removed, total: added + edited + removed };
}

/** Non-blocking validation — the editor shows these as warnings and always
 *  allows saving to draft (plan §1: warn, never block). */
export function ruleWarnings(rule: AdRule): string[] {
  const warnings: string[] = [];
  if (rule.name.trim().length === 0) warnings.push('The rule has no name.');
  if (rule.conditions.length === 0) warnings.push('No conditions — this rule matches every document.');
  if (rule.conditions.some((c) => c.values.length === 0 || c.values.every((v) => v.trim() === ''))) {
    warnings.push('A condition has no value and will never match.');
  }
  if (rule.triggers.length === 0) warnings.push('No triggers — this rule can never fire.');
  if (rule.assignments.length === 0) warnings.push('No recipients — matching documents will not be distributed by this rule.');
  if (rule.effectiveFrom && rule.effectiveUntil && rule.effectiveFrom > rule.effectiveUntil) {
    warnings.push('Effective-from is after effective-until, so the rule is never in effect.');
  }
  return warnings;
}
