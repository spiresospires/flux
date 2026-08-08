import { describe, it, expect } from 'vitest';
import type {
  AdAssignment,
  AdCondition,
  AdRule,
  AdRuleSet,
  AdRuleSetVersion,
  AdTrigger,
} from '../types/distribution';
import {
  AD_CONDITION_FIELDS,
  ACTION_TYPES,
  ACTION_LABELS,
  conditionFieldDef,
  conditionFieldsForRule,
  describeCondition,
  describeTrigger,
  diffRuleLists,
  diffRuleSet,
  findPriorityConflicts,
  operatorsForKind,
  ruleGroupKey,
  ruleWarnings,
  summariseConditions,
} from './distributionEngine';

// These are the Automatic Distribution business rules. They cannot be re-derived
// from the UI by a future maintainer, which is why they are the first thing in
// this project to get test coverage.

let seq = 0;
function makeRule(overrides: Partial<AdRule> = {}): AdRule {
  seq += 1;
  return {
    id: `r${seq}`,
    name: `Rule ${seq}`,
    triggers: [{ kind: 'upload' }],
    conditions: [{ field: 'discipline', operator: 'is', values: ['Structural'] }],
    assignments: [
      { recipient: { kind: 'user', userId: 'u1' }, action: 'formal-review', reasonId: 'review' },
    ],
    priority: 1,
    enabled: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'alice',
    ...overrides,
  };
}

const assignment = (over: Partial<AdAssignment> = {}): AdAssignment => ({
  recipient: { kind: 'user', userId: 'u1' },
  action: 'formal-review',
  reasonId: 'review',
  ...over,
});

describe('operatorsForKind', () => {
  it('offers operators appropriate to each field kind', () => {
    expect(operatorsForKind('enum')).toEqual(['is', 'is-not', 'in']);
    expect(operatorsForKind('tags')).toEqual(['contains', 'is']);
    expect(operatorsForKind('text')).toEqual(['is', 'contains', 'starts-with']);
  });

  it("never offers 'between' — no date or numeric field is registered yet", () => {
    for (const kind of ['enum', 'tags', 'text'] as const) {
      expect(operatorsForKind(kind)).not.toContain('between');
    }
  });
});

describe('conditionFieldsForRule', () => {
  it('returns just the base registry when no category is named', () => {
    expect(conditionFieldsForRule([])).toHaveLength(AD_CONDITION_FIELDS.length);
  });

  it("widens to a category's metadata fields once the rule names that category", () => {
    const conditions: AdCondition[] = [{ field: 'category', operator: 'is', values: ['DRAWING'] }];
    const keys = conditionFieldsForRule(conditions).map(f => f.key);
    expect(keys).toContain('materialGrade');
    expect(keys).toContain('voltage');
    expect(keys).not.toContain('manufacturer');   // belongs to VENDOR - SUPPLIER
  });

  it('supports multi-category rules via the `in` operator', () => {
    const conditions: AdCondition[] = [
      { field: 'category', operator: 'in', values: ['DRAWING', 'QUALITY'] },
    ];
    const keys = conditionFieldsForRule(conditions).map(f => f.key);
    expect(keys).toContain('materialGrade');      // DRAWING
    expect(keys).toContain('connectionType');     // QUALITY
  });

  it('does not widen for is-not — excluding a category tells you nothing about its fields', () => {
    const conditions: AdCondition[] = [
      { field: 'category', operator: 'is-not', values: ['DRAWING'] },
    ];
    expect(conditionFieldsForRule(conditions)).toHaveLength(AD_CONDITION_FIELDS.length);
  });

  it('deduplicates a field shared by two categories', () => {
    // equipmentTag is declared by both VENDOR - SUPPLIER and HANDOVER & O&M
    const conditions: AdCondition[] = [
      { field: 'category', operator: 'in', values: ['VENDOR - SUPPLIER', 'HANDOVER & O&M'] },
    ];
    const keys = conditionFieldsForRule(conditions).map(f => f.key);
    expect(keys.filter(k => k === 'equipmentTag')).toHaveLength(1);
  });

  it('tolerates a category with no registered metadata', () => {
    const conditions: AdCondition[] = [
      { field: 'category', operator: 'is', values: ['NOT-A-REAL-CATEGORY'] },
    ];
    expect(() => conditionFieldsForRule(conditions)).not.toThrow();
    expect(conditionFieldsForRule(conditions)).toHaveLength(AD_CONDITION_FIELDS.length);
  });
});

describe('conditionFieldDef', () => {
  it('finds base registry fields', () => {
    expect(conditionFieldDef('discipline')?.label).toBe('Discipline');
  });

  it('finds category metadata fields even when no category is currently selected', () => {
    // Existing conditions must still render if the rule's category clause changes.
    expect(conditionFieldDef('voltage')?.label).toBe('Voltage');
  });

  it('returns undefined for an unknown key', () => {
    expect(conditionFieldDef('nope')).toBeUndefined();
  });
});

describe('describeCondition', () => {
  it('renders `in` as a bracketed list', () => {
    expect(
      describeCondition({ field: 'discipline', operator: 'in', values: ['Civil', 'HVAC'] }),
    ).toBe('Discipline in [Civil, HVAC]');
  });

  it('renders `between` as a range', () => {
    expect(
      describeCondition({ field: 'asset', operator: 'between', values: ['A', 'B'] }),
    ).toBe('Asset between A and B');
  });

  it('renders other operators with readable text, not the raw enum', () => {
    expect(
      describeCondition({ field: 'discipline', operator: 'is-not', values: ['Civil'] }),
    ).toBe('Discipline is not Civil');
    expect(
      describeCondition({ field: 'asset', operator: 'starts-with', values: ['PH-'] }),
    ).toBe('Asset starts with PH-');
  });

  it('falls back to the raw key when the field is unknown', () => {
    expect(describeCondition({ field: 'mystery', operator: 'is', values: ['x'] }))
      .toBe('mystery is x');
  });
});

describe('summariseConditions', () => {
  it('reports an unconditioned rule as matching everything', () => {
    expect(summariseConditions(makeRule({ conditions: [] }))).toBe('All documents');
  });

  it('AND-joins multiple conditions', () => {
    const rule = makeRule({
      conditions: [
        { field: 'discipline', operator: 'is', values: ['Civil'] },
        { field: 'status', operator: 'is', values: ['Issued'] },
      ],
    });
    expect(summariseConditions(rule)).toBe('Discipline is Civil AND PM status is Issued');
  });
});

describe('describeTrigger', () => {
  it.each([
    [{ kind: 'upload' } as AdTrigger, 'On upload'],
    [{ kind: 'manual' } as AdTrigger, 'Manual'],
  ])('renders %o', (trigger, expected) => {
    expect(describeTrigger(trigger)).toBe(expected);
  });

  it('names the destination status for a status change', () => {
    expect(describeTrigger({ kind: 'status-change', toStatus: 'Approved' } as AdTrigger))
      .toBe('Status → Approved');
  });
});

describe('ruleGroupKey', () => {
  it('groups by the named condition value', () => {
    expect(ruleGroupKey(makeRule(), 'discipline')).toBe('Structural');
  });

  it('marks negated conditions rather than showing a bare value', () => {
    const rule = makeRule({
      conditions: [{ field: 'discipline', operator: 'is-not', values: ['Civil'] }],
    });
    expect(ruleGroupKey(rule, 'discipline')).toBe('Not Civil');
  });

  it('falls back to an "All …" bucket when the rule does not constrain that field', () => {
    const rule = makeRule({ conditions: [] });
    expect(ruleGroupKey(rule, 'discipline')).toBe('All disciplines');
    expect(ruleGroupKey(rule, 'category')).toBe('All categories');
  });

  it('treats a condition with no values as unconstrained', () => {
    const rule = makeRule({
      conditions: [{ field: 'discipline', operator: 'is', values: [] }],
    });
    expect(ruleGroupKey(rule, 'discipline')).toBe('All disciplines');
  });

  it('joins multiple triggers, and names the empty case', () => {
    expect(
      ruleGroupKey(
        makeRule({ triggers: [{ kind: 'upload' }, { kind: 'manual' }] }),
        'trigger',
      ),
    ).toBe('On upload · Manual');
    expect(ruleGroupKey(makeRule({ triggers: [] }), 'trigger')).toBe('No trigger');
  });
});

describe('ruleWarnings', () => {
  it('passes a well-formed rule with no warnings', () => {
    expect(ruleWarnings(makeRule())).toEqual([]);
  });

  it('warns on a blank name, including whitespace-only', () => {
    expect(ruleWarnings(makeRule({ name: '   ' }))).toContain('The rule has no name.');
  });

  it('warns that an unconditioned rule matches every document', () => {
    expect(ruleWarnings(makeRule({ conditions: [] })))
      .toContain('No conditions — this rule matches every document.');
  });

  it('warns on a condition that can never match', () => {
    const empty = makeRule({
      conditions: [{ field: 'discipline', operator: 'is', values: [] }],
    });
    const blank = makeRule({
      conditions: [{ field: 'discipline', operator: 'is', values: ['  ', ''] }],
    });
    const msg = 'A condition has no value and will never match.';
    expect(ruleWarnings(empty)).toContain(msg);
    expect(ruleWarnings(blank)).toContain(msg);
  });

  it('does not warn when only SOME values are blank', () => {
    const rule = makeRule({
      conditions: [{ field: 'discipline', operator: 'in', values: ['Civil', ''] }],
    });
    expect(ruleWarnings(rule)).not.toContain('A condition has no value and will never match.');
  });

  it('warns when a rule can never fire or reaches nobody', () => {
    expect(ruleWarnings(makeRule({ triggers: [] })))
      .toContain('No triggers — this rule can never fire.');
    expect(ruleWarnings(makeRule({ assignments: [] })))
      .toContain('No recipients — matching documents will not be distributed by this rule.');
  });

  it('warns on an inverted effective window', () => {
    const rule = makeRule({ effectiveFrom: '2026-06-01', effectiveUntil: '2026-01-01' });
    expect(ruleWarnings(rule))
      .toContain('Effective-from is after effective-until, so the rule is never in effect.');
  });

  it('accepts an effective window that is merely a single day', () => {
    const rule = makeRule({ effectiveFrom: '2026-01-01', effectiveUntil: '2026-01-01' });
    expect(ruleWarnings(rule)).toEqual([]);
  });

  it('collects every applicable warning rather than stopping at the first', () => {
    const rule = makeRule({ name: '', conditions: [], triggers: [], assignments: [] });
    expect(ruleWarnings(rule)).toHaveLength(4);
  });
});

describe('findPriorityConflicts', () => {
  // A conflict is specifically: two ENABLED rules give the SAME recipient the
  // SAME action at EQUAL priority for DIFFERENT reasons. Dedupe resolves ties by
  // "higher rule priority wins", so equal priority leaves it undecidable.

  it('reports nothing for a single rule', () => {
    expect(findPriorityConflicts([makeRule()])).toEqual([]);
  });

  it('flags equal-priority rules that disagree on the reason', () => {
    const a = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'for-review' })] });
    const b = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'for-approval' })] });
    const conflicts = findPriorityConflicts([a, b]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].action).toBe('formal-review');
    expect(conflicts[0].rules.map(r => r.id).sort()).toEqual([a.id, b.id].sort());
  });

  it('does NOT flag differing priorities — lower number wins by definition', () => {
    const a = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'for-review' })] });
    const b = makeRule({ priority: 2, assignments: [assignment({ reasonId: 'for-approval' })] });
    expect(findPriorityConflicts([a, b])).toEqual([]);
  });

  it('does NOT flag equal priority when the reason agrees — there is nothing to decide', () => {
    const a = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'same' })] });
    const b = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'same' })] });
    expect(findPriorityConflicts([a, b])).toEqual([]);
  });

  it('ignores disabled rules', () => {
    const a = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'for-review' })] });
    const b = makeRule({
      priority: 1,
      enabled: false,
      assignments: [assignment({ reasonId: 'for-approval' })],
    });
    expect(findPriorityConflicts([a, b])).toEqual([]);
  });

  it('does not conflate different recipients', () => {
    const a = makeRule({
      priority: 1,
      assignments: [assignment({ recipient: { kind: 'user', userId: 'u1' }, reasonId: 'x' })],
    });
    const b = makeRule({
      priority: 1,
      assignments: [assignment({ recipient: { kind: 'user', userId: 'u2' }, reasonId: 'y' })],
    });
    expect(findPriorityConflicts([a, b])).toEqual([]);
  });

  it('does not conflate a user with a workgroup', () => {
    const a = makeRule({
      priority: 1,
      assignments: [assignment({ recipient: { kind: 'user', userId: 'u1' }, reasonId: 'x' })],
    });
    const b = makeRule({
      priority: 1,
      assignments: [assignment({ recipient: { kind: 'workgroup', workgroupId: 'u1' }, reasonId: 'y' })],
    });
    expect(findPriorityConflicts([a, b])).toEqual([]);
  });

  it('does not conflate different actions to the same recipient', () => {
    const a = makeRule({
      priority: 1,
      assignments: [assignment({ action: 'formal-review', reasonId: 'x' })],
    });
    const b = makeRule({
      priority: 1,
      assignments: [assignment({ action: 'transmittal', reasonId: 'y' })],
    });
    expect(findPriorityConflicts([a, b])).toEqual([]);
  });

  it('reports each conflicting rule once, however many assignments caused it', () => {
    const a = makeRule({
      priority: 1,
      assignments: [assignment({ reasonId: 'x' }), assignment({ reasonId: 'y' })],
    });
    const b = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'z' })] });
    const conflicts = findPriorityConflicts([a, b]);
    expect(conflicts).toHaveLength(1);
    expect(new Set(conflicts[0].rules.map(r => r.id)).size).toBe(conflicts[0].rules.length);
  });

  it('separates conflicts that occur at different priority levels', () => {
    const p1a = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'a' })] });
    const p1b = makeRule({ priority: 1, assignments: [assignment({ reasonId: 'b' })] });
    const p2a = makeRule({ priority: 2, assignments: [assignment({ reasonId: 'c' })] });
    const p2b = makeRule({ priority: 2, assignments: [assignment({ reasonId: 'd' })] });
    expect(findPriorityConflicts([p1a, p1b, p2a, p2b])).toHaveLength(2);
  });
});

describe('diffRuleSet', () => {
  const version = (rules: AdRule[]): AdRuleSetVersion => ({
    version: 1,
    rules,
    publishedAt: '2026-01-01T00:00:00.000Z',
    publishedBy: 'alice',
    summary: 'initial',
  });
  const ruleSet = (draft: AdRule[], published: AdRule[] | null): AdRuleSet => ({
    workspaceId: 'kwinana' as AdRuleSet['workspaceId'],
    draft: { rules: draft, baseVersion: 1 },
    published: published ? version(published) : null,
    history: [],
  });

  it('treats every draft rule as new when nothing is published yet', () => {
    const a = makeRule();
    const diff = diffRuleSet(ruleSet([a], null));
    expect(diff.byRule[a.id]).toBe('new');
    expect(diff).toMatchObject({ added: 1, edited: 0, removed: 0, total: 1 });
  });

  it('detects added, edited, removed and unchanged in one pass', () => {
    const unchanged = makeRule();
    const toEdit = makeRule();
    const removed = makeRule();
    const added = makeRule();
    const edited = { ...toEdit, name: 'Renamed' };

    const diff = diffRuleSet(ruleSet([unchanged, edited, added], [unchanged, toEdit, removed]));
    expect(diff.byRule[unchanged.id]).toBe('unchanged');
    expect(diff.byRule[edited.id]).toBe('edited');
    expect(diff.byRule[added.id]).toBe('new');
    expect(diff).toMatchObject({ added: 1, edited: 1, removed: 1, total: 3 });
  });

  it('ignores updatedAt/updatedBy — a rule edited back to its published content is unchanged', () => {
    // Those fields are stamped on every save, so comparing them would mark
    // every touched rule as edited even when nothing meaningful changed.
    const published = makeRule();
    const resaved = { ...published, updatedAt: '2026-09-09T09:09:09.000Z', updatedBy: 'bob' };
    const diff = diffRuleSet(ruleSet([resaved], [published]));
    expect(diff.byRule[published.id]).toBe('unchanged');
    expect(diff.total).toBe(0);
  });

  it('counts a rule deleted from the draft as removed', () => {
    const gone = makeRule();
    const diff = diffRuleSet(ruleSet([], [gone]));
    expect(diff).toMatchObject({ added: 0, edited: 0, removed: 1, total: 1 });
    expect(diff.byRule).toEqual({});
  });
});

describe('diffRuleLists', () => {
  it('names what changed between two versions', () => {
    const kept = makeRule({ name: 'Kept' });
    const before = makeRule({ name: 'Before' });
    const after = { ...before, name: 'After' };
    const dropped = makeRule({ name: 'Dropped' });
    const fresh = makeRule({ name: 'Fresh' });

    const diff = diffRuleLists([kept, before, dropped], [kept, after, fresh]);
    expect(diff.added).toEqual([{ id: fresh.id, name: 'Fresh' }]);
    expect(diff.edited).toEqual([{ id: after.id, name: 'After' }]);
    expect(diff.removed).toEqual([{ id: dropped.id, name: 'Dropped' }]);
    expect(diff.total).toBe(3);
  });

  it('reports no change between identical lists', () => {
    const rules = [makeRule(), makeRule()];
    expect(diffRuleLists(rules, rules).total).toBe(0);
  });

  it('is direction-sensitive: added one way is removed the other', () => {
    const extra = makeRule();
    expect(diffRuleLists([], [extra]).added).toHaveLength(1);
    expect(diffRuleLists([extra], []).removed).toHaveLength(1);
  });
});

describe('action vocabulary', () => {
  it('gives every action type a human label', () => {
    for (const action of ACTION_TYPES) {
      expect(ACTION_LABELS[action], `missing label for ${action}`).toBeTruthy();
    }
  });
});
