// Rule editor — slide-over drawer from the rules list (DetailSlidePanel drawer
// pattern: fixed overlay + backdrop). Edits land in the DRAFT working copy via
// the rule mutations; validation warns but never blocks a draft save
// (AUTO_DISTRIBUTION_PLAN.md §3).
// [PHASE-1]
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, TrashIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import type {
  AdAssignment,
  AdCondition,
  AdOperator,
  AdRule,
  AdSettings,
  AdTrigger,
} from '../../types/distribution';
import type { DocumentStatus } from '../../types/document';
import type { AdUser, Workgroup } from '../../types/workgroup';
import {
  ACTION_LABELS,
  ACTION_TYPES,
  AD_CONDITION_FIELDS,
  conditionFieldDef,
  operatorsForKind,
  ruleWarnings,
} from '../../utils/distributionEngine';
import { useCreateAdRule, useDeleteAdRule, useUpdateAdRule } from '../../hooks/useDistribution';

const PM_STATUSES: DocumentStatus[] = ['Draft', 'In Review', 'Approved', 'Superseded', 'Archived'];

const OPERATOR_LABELS: Record<AdOperator, string> = {
  is: 'is',
  'is-not': 'is not',
  in: 'in',
  contains: 'contains',
  'starts-with': 'starts with',
  between: 'between',
};

const inputClass =
  'w-full rounded-md border border-neutral-200 bg-[#F0F4F8] px-2 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:bg-white';
const selectClass =
  'rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#0461BA]';
const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

interface RuleEditorProps {
  wsId: string;
  /** The rule being edited, or a template for a new one. */
  rule: AdRule;
  isNew: boolean;
  users: AdUser[];
  workgroups: Workgroup[];
  settings: AdSettings;
  onClose: () => void;
}

export function newRuleTemplate(): AdRule {
  return {
    id: '',
    name: '',
    description: '',
    triggers: [{ kind: 'upload' }],
    conditions: [],
    assignments: [],
    priority: 50,
    enabled: true,
    updatedAt: '',
    updatedBy: '',
  };
}

export function RuleEditor({ wsId, rule, isNew, users, workgroups, settings, onClose }: RuleEditorProps) {
  const [draft, setDraft] = useState<AdRule>(rule);
  const createRule = useCreateAdRule(wsId);
  const updateRule = useUpdateAdRule(wsId);
  const deleteRule = useDeleteAdRule(wsId);
  const saving = createRule.isPending || updateRule.isPending || deleteRule.isPending;

  const warnings = useMemo(() => ruleWarnings(draft), [draft]);

  const patch = (changes: Partial<AdRule>) => setDraft((prev) => ({ ...prev, ...changes }));

  // ── Triggers ────────────────────────────────────────────────────────────────
  const hasTrigger = (kind: AdTrigger['kind']) => draft.triggers.some((t) => t.kind === kind);
  const statusTrigger = draft.triggers.find((t) => t.kind === 'status-change');

  const toggleTrigger = (kind: AdTrigger['kind']) => {
    if (hasTrigger(kind)) {
      patch({ triggers: draft.triggers.filter((t) => t.kind !== kind) });
    } else {
      const added: AdTrigger = kind === 'status-change' ? { kind, toStatus: 'Approved' } : { kind };
      patch({ triggers: [...draft.triggers, added] });
    }
  };

  const setTriggerStatus = (toStatus: DocumentStatus) =>
    patch({
      triggers: draft.triggers.map((t) => (t.kind === 'status-change' ? { kind: 'status-change', toStatus } : t)),
    });

  // ── Conditions ──────────────────────────────────────────────────────────────
  const setCondition = (index: number, condition: AdCondition) =>
    patch({ conditions: draft.conditions.map((c, i) => (i === index ? condition : c)) });

  const addCondition = () =>
    patch({ conditions: [...draft.conditions, { field: 'discipline', operator: 'is', values: [] }] });

  const removeCondition = (index: number) =>
    patch({ conditions: draft.conditions.filter((_, i) => i !== index) });

  // ── Assignments ─────────────────────────────────────────────────────────────
  const setAssignment = (index: number, assignment: AdAssignment) =>
    patch({ assignments: draft.assignments.map((a, i) => (i === index ? assignment : a)) });

  const addAssignment = () => {
    const firstGroup = workgroups[0];
    patch({
      assignments: [
        ...draft.assignments,
        {
          recipient: firstGroup
            ? { kind: 'workgroup', workgroupId: firstGroup.id }
            : { kind: 'user', userId: users[0]?.id ?? '' },
          action: 'formal-review',
          reasonId: settings.reasons['formal-review'][0]?.id ?? '',
        },
      ],
    });
  };

  const removeAssignment = (index: number) =>
    patch({ assignments: draft.assignments.filter((_, i) => i !== index) });

  // ── Save / delete ───────────────────────────────────────────────────────────
  const save = () => {
    if (isNew) {
      const { id: _id, updatedAt: _at, updatedBy: _by, ...body } = draft;
      createRule.mutate(body, { onSuccess: onClose });
    } else {
      updateRule.mutate(draft, { onSuccess: onClose });
    }
  };

  const remove = () => deleteRule.mutate(draft.id, { onSuccess: onClose });

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-neutral-900/30" onClick={onClose} aria-hidden="true" />
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute right-0 top-0 flex h-full w-[520px] max-w-[92vw] flex-col bg-white shadow-2xl"
        role="dialog"
        aria-label={isNew ? 'New distribution rule' : `Edit rule ${draft.name}`}
      >
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">
            {isNew ? 'New distribution rule' : 'Edit distribution rule'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-[#F0F4F8] hover:text-neutral-700"
            aria-label="Close editor"
          >
            <XIcon size={15} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Name + description */}
          <div className="space-y-2">
            <label className="block">
              <span className={sectionLabelClass}>Rule name</span>
              <input
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Civil drawings for formal review"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={sectionLabelClass}>Description (optional)</span>
              <textarea
                value={draft.description ?? ''}
                onChange={(e) => patch({ description: e.target.value })}
                rows={2}
                className={`mt-1 ${inputClass} resize-none`}
              />
            </label>
          </div>

          {/* Triggers */}
          <div>
            <span className={sectionLabelClass}>Triggers</span>
            <div className="mt-1.5 space-y-1.5">
              {(
                [
                  { kind: 'upload' as const, label: 'On upload' },
                  { kind: 'status-change' as const, label: 'On PM status change' },
                  { kind: 'manual' as const, label: 'Manually invoked' },
                ]
              ).map(({ kind, label }) => (
                <div key={kind} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-neutral-700">
                    <input
                      type="checkbox"
                      checked={hasTrigger(kind)}
                      onChange={() => toggleTrigger(kind)}
                      className="h-3.5 w-3.5 accent-[#0461BA]"
                    />
                    {label}
                  </label>
                  {kind === 'status-change' && statusTrigger && (
                    <select
                      value={statusTrigger.kind === 'status-change' ? statusTrigger.toStatus : 'Approved'}
                      onChange={(e) => setTriggerStatus(e.target.value as DocumentStatus)}
                      className={selectClass}
                      aria-label="Trigger status"
                    >
                      {PM_STATUSES.map((s) => (
                        <option key={s} value={s}>→ {s}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between">
              <span className={sectionLabelClass}>Conditions (all must match)</span>
              <button
                onClick={addCondition}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-[#F0F4F8]"
              >
                <PlusIcon size={12} /> Add condition
              </button>
            </div>
            {draft.conditions.length === 0 && (
              <p className="mt-1.5 text-xs text-neutral-400">No conditions — matches every document.</p>
            )}
            <div className="mt-1.5 space-y-1.5">
              {draft.conditions.map((condition, index) => (
                <ConditionRow
                  key={index}
                  condition={condition}
                  onChange={(c) => setCondition(index, c)}
                  onRemove={() => removeCondition(index)}
                />
              ))}
            </div>
          </div>

          {/* Recipients & actions */}
          <div>
            <div className="flex items-center justify-between">
              <span className={sectionLabelClass}>Recipients and actions</span>
              <button
                onClick={addAssignment}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-[#F0F4F8]"
              >
                <PlusIcon size={12} /> Add recipient
              </button>
            </div>
            {draft.assignments.length === 0 && (
              <p className="mt-1.5 text-xs text-neutral-400">No recipients yet.</p>
            )}
            <div className="mt-1.5 space-y-1.5">
              {draft.assignments.map((assignment, index) => (
                <AssignmentRow
                  key={index}
                  assignment={assignment}
                  users={users}
                  workgroups={workgroups}
                  settings={settings}
                  onChange={(a) => setAssignment(index, a)}
                  onRemove={() => removeAssignment(index)}
                />
              ))}
            </div>
          </div>

          {/* Effective dates + priority + enabled */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={sectionLabelClass}>Effective from</span>
              <input
                type="date"
                value={draft.effectiveFrom ?? ''}
                onChange={(e) => patch({ effectiveFrom: e.target.value || undefined })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={sectionLabelClass}>Effective until</span>
              <input
                type="date"
                value={draft.effectiveUntil ?? ''}
                onChange={(e) => patch({ effectiveUntil: e.target.value || undefined })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className={sectionLabelClass}>Priority (conflict tiebreak)</span>
              <input
                type="number"
                min={1}
                max={99}
                value={draft.priority}
                onChange={(e) => patch({ priority: Number(e.target.value) || 50 })}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="mt-5 flex items-center gap-2 text-xs font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
                className="h-3.5 w-3.5 accent-[#0461BA]"
              />
              Rule enabled
            </label>
          </div>

          {/* Non-blocking warnings */}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              {warnings.map((warning) => (
                <p key={warning} className="flex items-start gap-1.5 py-0.5 text-[11px] text-amber-800">
                  <TriangleAlertIcon size={12} className="mt-0.5 shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-neutral-100 px-5 py-3">
          {!isNew && (
            <button
              onClick={remove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <TrashIcon size={13} /> Delete rule
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-[#F0F4F8] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || draft.name.trim() === ''}
              className="rounded-md bg-[#0461BA] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0355a4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save to draft'}
            </button>
          </div>
        </footer>
      </motion.aside>
    </div>
  );
}

// ── Condition row ─────────────────────────────────────────────────────────────

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: AdCondition;
  onChange: (condition: AdCondition) => void;
  onRemove: () => void;
}) {
  const def = conditionFieldDef(condition.field);
  const operators = def ? operatorsForKind(def.kind) : (['is'] as AdOperator[]);

  const changeField = (field: string) => {
    const nextDef = conditionFieldDef(field);
    const nextOps = nextDef ? operatorsForKind(nextDef.kind) : (['is'] as AdOperator[]);
    onChange({ field, operator: nextOps[0], values: [] });
  };

  const changeOperator = (operator: AdOperator) => {
    // 'in' keeps multi-values; switching to a single-value operator trims.
    const values = operator === 'in' ? condition.values : condition.values.slice(0, 1);
    onChange({ ...condition, operator, values });
  };

  const toggleEnumValue = (value: string) => {
    const has = condition.values.includes(value);
    onChange({
      ...condition,
      values: has ? condition.values.filter((v) => v !== value) : [...condition.values, value],
    });
  };

  return (
    <div className="rounded-lg border border-neutral-100 bg-[#FAFBFC] px-2.5 py-2">
      <div className="flex items-center gap-2">
        <select value={condition.field} onChange={(e) => changeField(e.target.value)} className={selectClass} aria-label="Condition field">
          {AD_CONDITION_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <select
          value={condition.operator}
          onChange={(e) => changeOperator(e.target.value as AdOperator)}
          className={selectClass}
          aria-label="Condition operator"
        >
          {operators.map((op) => (
            <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
          ))}
        </select>
        {def?.kind === 'enum' && condition.operator !== 'in' ? (
          <select
            value={condition.values[0] ?? ''}
            onChange={(e) => onChange({ ...condition, values: e.target.value ? [e.target.value] : [] })}
            className={`${selectClass} flex-1`}
            aria-label="Condition value"
          >
            <option value="">Select…</option>
            {def.values?.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ) : def?.kind === 'enum' ? null : (
          <input
            value={condition.values[0] ?? ''}
            onChange={(e) => onChange({ ...condition, values: e.target.value ? [e.target.value] : [] })}
            placeholder="Value"
            className={`${inputClass} flex-1`}
            aria-label="Condition value"
          />
        )}
        <button
          onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Remove condition"
        >
          <XIcon size={13} />
        </button>
      </div>
      {def?.kind === 'enum' && condition.operator === 'in' && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {def.values?.map((value) => {
            const selected = condition.values.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleEnumValue(value)}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  selected
                    ? 'border-[#0461BA]/30 bg-[#E8F1FB] text-[#0461BA]'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                }`}
                aria-pressed={selected}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Assignment row ────────────────────────────────────────────────────────────

function AssignmentRow({
  assignment,
  users,
  workgroups,
  settings,
  onChange,
  onRemove,
}: {
  assignment: AdAssignment;
  users: AdUser[];
  workgroups: Workgroup[];
  settings: AdSettings;
  onChange: (assignment: AdAssignment) => void;
  onRemove: () => void;
}) {
  const reasons = settings.reasons[assignment.action] ?? [];

  const changeKind = (kind: 'user' | 'workgroup') => {
    onChange({
      ...assignment,
      recipient:
        kind === 'user'
          ? { kind: 'user', userId: users[0]?.id ?? '' }
          : { kind: 'workgroup', workgroupId: workgroups[0]?.id ?? '' },
    });
  };

  const changeAction = (action: AdAssignment['action']) => {
    onChange({ ...assignment, action, reasonId: settings.reasons[action]?.[0]?.id ?? '' });
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-[#FAFBFC] px-2.5 py-2">
      <select
        value={assignment.recipient.kind}
        onChange={(e) => changeKind(e.target.value as 'user' | 'workgroup')}
        className={selectClass}
        aria-label="Recipient type"
      >
        <option value="workgroup">Workgroup</option>
        <option value="user">User</option>
      </select>
      {assignment.recipient.kind === 'workgroup' ? (
        <select
          value={assignment.recipient.workgroupId}
          onChange={(e) => onChange({ ...assignment, recipient: { kind: 'workgroup', workgroupId: e.target.value } })}
          className={`${selectClass} min-w-0 flex-1`}
          aria-label="Workgroup"
        >
          {workgroups.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      ) : assignment.recipient.kind === 'user' ? (
        <select
          value={assignment.recipient.userId}
          onChange={(e) => onChange({ ...assignment, recipient: { kind: 'user', userId: e.target.value } })}
          className={`${selectClass} min-w-0 flex-1`}
          aria-label="User"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}{u.active ? '' : ' (inactive)'}
            </option>
          ))}
        </select>
      ) : null}
      <select
        value={assignment.action}
        onChange={(e) => changeAction(e.target.value as AdAssignment['action'])}
        className={selectClass}
        aria-label="Action"
      >
        {ACTION_TYPES.map((action) => (
          <option key={action} value={action}>{ACTION_LABELS[action]}</option>
        ))}
      </select>
      <select
        value={assignment.reasonId}
        onChange={(e) => onChange({ ...assignment, reasonId: e.target.value })}
        className={selectClass}
        aria-label="Reason for issue"
      >
        {reasons.map((reason) => (
          <option key={reason.id} value={reason.id}>{reason.label}</option>
        ))}
      </select>
      <button
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Remove recipient"
      >
        <XIcon size={13} />
      </button>
    </div>
  );
}
