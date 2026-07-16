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
  AdRecipientRef,
  AdRule,
  AdRuleSet,
  AdTrigger,
} from '../types/distribution';
import { DOCUMENT_CATEGORIES } from '../types/document';

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

/** FusionLive-style PM status ladder — single source for AD dropdowns. */
export const PM_STATUSES = ['New', 'Under Review', 'Approved', 'Issued', 'Superseded', 'Archived'] as const;

export const AD_CONDITION_FIELDS: readonly AdConditionFieldDef[] = [
  { key: 'category', label: 'Document Category', kind: 'enum', values: DOCUMENT_CATEGORIES },
  { key: 'discipline', label: 'Discipline', kind: 'enum', values: DISCIPLINES },
  { key: 'status', label: 'PM status', kind: 'enum', values: PM_STATUSES },
  { key: 'tags', label: 'Tags', kind: 'tags' },
  { key: 'asset', label: 'Asset', kind: 'text' },
];

// ── Category-scoped metadata fields ──────────────────────────────────────────
// FusionLive Document Categories carry their own metadata schema; once a rule
// names a category, that category's fields become conditionable too — the
// "only list fields distribution depends on" idea from the legacy matrix.
// Field keys map straight onto the generated document properties
// (mockDocuments buildCategoryFields).
export const AD_CATEGORY_METADATA_FIELDS: Record<string, AdConditionFieldDef[]> = {
  'VENDOR - SUPPLIER': [
    { key: 'manufacturer', label: 'Manufacturer', kind: 'text' },
    { key: 'equipmentTag', label: 'Equipment Tag', kind: 'text' },
    { key: 'powerRating', label: 'Power Rating', kind: 'text' },
    { key: 'serviceMedium', label: 'Service Medium', kind: 'text' },
  ],
  DRAWING: [
    { key: 'materialGrade', label: 'Material Grade', kind: 'text' },
    { key: 'beamSize', label: 'Beam Size', kind: 'text' },
    { key: 'voltage', label: 'Voltage', kind: 'text' },
    { key: 'concreteType', label: 'Concrete Type', kind: 'text' },
  ],
  QUALITY: [
    { key: 'connectionType', label: 'Connection Type', kind: 'text' },
  ],
  'HANDOVER & O&M': [
    { key: 'equipmentTag', label: 'Equipment Tag', kind: 'text' },
  ],
};

/** Fields available to a rule's condition builder: the base registry plus the
 *  metadata fields of any Document Category the rule already names. */
export function conditionFieldsForRule(conditions: AdCondition[]): AdConditionFieldDef[] {
  const fields = [...AD_CONDITION_FIELDS];
  const categoryCondition = conditions.find(
    (c) => c.field === 'category' && (c.operator === 'is' || c.operator === 'in')
  );
  if (categoryCondition) {
    const seen = new Set(fields.map((f) => f.key));
    for (const value of categoryCondition.values) {
      for (const field of AD_CATEGORY_METADATA_FIELDS[value] ?? []) {
        if (seen.has(field.key)) continue;
        seen.add(field.key);
        fields.push(field);
      }
    }
  }
  return fields;
}

/** Global lookup across the base registry AND all category metadata fields, so
 *  existing conditions always render even when their category clause changes. */
export function conditionFieldDef(key: string): AdConditionFieldDef | undefined {
  const base = AD_CONDITION_FIELDS.find((f) => f.key === key);
  if (base) return base;
  for (const fields of Object.values(AD_CATEGORY_METADATA_FIELDS)) {
    const hit = fields.find((f) => f.key === key);
    if (hit) return hit;
  }
  return undefined;
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
  const field = groupBy === 'discipline' ? 'discipline' : 'category';
  const condition = rule.conditions.find((c) => c.field === field);
  if (!condition || condition.values.length === 0) {
    return groupBy === 'discipline' ? 'All disciplines' : 'All categories';
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

// ── Version diff (publish dialog + History tab) ──────────────────────────────

export interface RuleRef {
  id: string;
  name: string;
}

export interface VersionDiff {
  added: RuleRef[];
  edited: RuleRef[];
  removed: RuleRef[];
  total: number;
}

/** Named rule-level diff between two rule lists (older → newer). */
export function diffRuleLists(from: AdRule[], to: AdRule[]): VersionDiff {
  const fromById = new Map(from.map((r) => [r.id, comparableRule(r)]));
  const toIds = new Set(to.map((r) => r.id));
  const added: RuleRef[] = [];
  const edited: RuleRef[] = [];
  for (const rule of to) {
    const previous = fromById.get(rule.id);
    if (previous === undefined) added.push({ id: rule.id, name: rule.name });
    else if (previous !== comparableRule(rule)) edited.push({ id: rule.id, name: rule.name });
  }
  const removed = from.filter((r) => !toIds.has(r.id)).map((r) => ({ id: r.id, name: r.name }));
  return { added, edited, removed, total: added.length + edited.length + removed.length };
}

// ── Publish-time checks (plan §3: warn, never block) ─────────────────────────

/** Two enabled rules give the same recipient the same action with different
 *  parameters at EQUAL priority — dedupe's "higher rule priority wins" rule
 *  can't break the tie, so publishing should prompt the author to order them.
 *  Differing priorities are NOT a conflict: lower number wins by definition. */
export interface PriorityConflict {
  recipient: AdRecipientRef;
  action: AdActionType;
  rules: RuleRef[];
}

export function findPriorityConflicts(rules: AdRule[]): PriorityConflict[] {
  const groups = new Map<
    string,
    { recipient: AdRecipientRef; action: AdActionType; entries: { rule: RuleRef; reasonId: string; priority: number }[] }
  >();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const assignment of rule.assignments) {
      const key = `${JSON.stringify(assignment.recipient)}|${assignment.action}`;
      if (!groups.has(key)) {
        groups.set(key, { recipient: assignment.recipient, action: assignment.action, entries: [] });
      }
      groups.get(key)!.entries.push({
        rule: { id: rule.id, name: rule.name },
        reasonId: assignment.reasonId,
        priority: rule.priority,
      });
    }
  }
  const conflicts: PriorityConflict[] = [];
  for (const group of groups.values()) {
    const byPriority = new Map<number, typeof group.entries>();
    for (const entry of group.entries) {
      if (!byPriority.has(entry.priority)) byPriority.set(entry.priority, []);
      byPriority.get(entry.priority)!.push(entry);
    }
    for (const tied of byPriority.values()) {
      const distinctRules = new Set(tied.map((e) => e.rule.id));
      const distinctReasons = new Set(tied.map((e) => e.reasonId));
      if (distinctRules.size > 1 && distinctReasons.size > 1) {
        const seen = new Set<string>();
        const rulesInConflict: RuleRef[] = [];
        for (const entry of tied) {
          if (seen.has(entry.rule.id)) continue;
          seen.add(entry.rule.id);
          rulesInConflict.push(entry.rule);
        }
        conflicts.push({ recipient: group.recipient, action: group.action, rules: rulesInConflict });
      }
    }
  }
  return conflicts;
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
