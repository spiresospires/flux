// Rules tab — the authoring workhorse (AUTO_DISTRIBUTION_PLAN.md §3).
// Switchable group-by, search + filters, expand/collapse rows, slide-over
// editor. Priority is deliberately NOT a list column — it surfaces contextually
// on conflict (tester / publish checks, AD 2/3).
// [PHASE-1]
import { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarClockIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import type { AdRule } from '../../types/distribution';
import {
  ACTION_LABELS,
  ACTION_TYPES,
  describeTrigger,
  diffRuleSet,
  ruleGroupKey,
  summariseConditions,
} from '../../utils/distributionEngine';
import {
  useAdRuleSet,
  useAdSettings,
  useAdUsers,
  useUpdateAdRule,
  useWorkgroups,
} from '../../hooks/useDistribution';
import { useUserPref } from '../../hooks/useUserPref';
import { resolveRecipient, formatShortDate } from './shared';
import { RuleEditor, newRuleTemplate } from './RuleEditor';

type GroupBy = 'discipline' | 'category' | 'trigger' | 'none';

interface RulesTabProps {
  wsId: string;
  canManage: boolean;
}

export function RulesTab({ wsId, canManage }: RulesTabProps) {
  const ruleSetQuery = useAdRuleSet(wsId);
  const settingsQuery = useAdSettings(wsId);
  const { data: ruleSet, isLoading } = ruleSetQuery;
  const { data: settings } = settingsQuery;
  const { data: workgroups = [] } = useWorkgroups(wsId);
  const { data: users = [] } = useAdUsers();
  const updateRule = useUpdateAdRule(wsId);

  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useUserPref<GroupBy>('ad.rules.groupBy', 'discipline');
  const [actionFilter, setActionFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<{ rule: AdRule; isNew: boolean } | null>(null);

  const diff = useMemo(() => (ruleSet ? diffRuleSet(ruleSet) : null), [ruleSet]);

  const filtered = useMemo(() => {
    if (!ruleSet) return [];
    const query = search.trim().toLowerCase();
    return ruleSet.draft.rules.filter((rule) => {
      if (actionFilter && !rule.assignments.some((a) => a.action === actionFilter)) return false;
      if (triggerFilter && !rule.triggers.some((t) => t.kind === triggerFilter)) return false;
      if (!query) return true;
      const haystack = [
        rule.name,
        rule.description ?? '',
        summariseConditions(rule),
        ...rule.assignments.map((a) => resolveRecipient(a.recipient, users, workgroups).name),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [ruleSet, search, actionFilter, triggerFilter, users, workgroups]);

  const groups = useMemo(() => {
    const map = new Map<string, AdRule[]>();
    for (const rule of filtered) {
      const key = groupBy === 'none' ? 'All rules' : ruleGroupKey(rule, groupBy);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rule);
    }
    for (const rules of map.values()) {
      rules.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, groupBy]);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleEnabled = (rule: AdRule) => updateRule.mutate({ ...rule, enabled: !rule.enabled });

  // A failed request must never present as an infinite "Loading rules…" —
  // e.g. a stale mock worker answers /distribution/* with the SPA fallback HTML
  // (HTTP 200) and JSON parsing throws, so the query errors while data stays
  // undefined. Surface it with a retry instead. Cached data + failed background
  // refetch keeps showing the list (data checks below), not this card.
  if ((ruleSetQuery.isError && !ruleSet) || (settingsQuery.isError && !settings)) {
    const error = ruleSetQuery.error ?? settingsQuery.error;
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-neutral-700">Couldn't load the rule set</p>
          <p className="mt-1.5 text-xs text-neutral-500">
            {error instanceof Error ? error.message : 'The distribution service did not return a valid response.'}
            {' '}If this persists on a dev build, hard-refresh the page (Ctrl+F5) to update the mock service worker.
          </p>
          <button
            onClick={() => { ruleSetQuery.refetch(); settingsQuery.refetch(); }}
            className="mt-3 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-[#F0F4F8]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !ruleSet || !settings) {
    return <p className="px-5 py-8 text-center text-xs text-neutral-400">Loading rules…</p>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
        <div className="relative">
          <SearchIcon size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules…"
            className="h-7 w-48 rounded-md border border-neutral-200 bg-[#F0F4F8] pl-7 pr-2 text-xs text-neutral-700 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
          />
        </div>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
          aria-label="Group rules by"
        >
          <option value="discipline">Group: Discipline</option>
          <option value="category">Group: Document Category</option>
          <option value="trigger">Group: Trigger</option>
          <option value="none">Group: None</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
          aria-label="Filter by action"
        >
          <option value="">Action: Any</option>
          {ACTION_TYPES.map((action) => (
            <option key={action} value={action}>{ACTION_LABELS[action]}</option>
          ))}
        </select>
        <select
          value={triggerFilter}
          onChange={(e) => setTriggerFilter(e.target.value)}
          className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
          aria-label="Filter by trigger"
        >
          <option value="">Trigger: Any</option>
          <option value="upload">On upload</option>
          <option value="status-change">Status change</option>
          <option value="manual">Manual</option>
        </select>
        <span className="text-[11px] text-neutral-400">
          {filtered.length} of {ruleSet.draft.rules.length} rules
        </span>
        {canManage && (
          <button
            onClick={() => setEditor({ rule: newRuleTemplate(), isNew: true })}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[#0461BA] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0355a4]"
          >
            <PlusIcon size={13} /> New rule
          </button>
        )}
      </div>

      {/* Grouped rule list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-xs text-neutral-400">
            {ruleSet.draft.rules.length === 0
              ? 'No distribution rules yet. Create the first rule to start routing documents.'
              : 'No rules match the current filters.'}
          </p>
        )}
        {groups.map(([groupName, rules]) => (
          <div key={groupName}>
            {groupBy !== 'none' && (
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-100 bg-[#F7FAFD] px-4 py-1.5">
                <span className="text-[11px] font-semibold text-neutral-600">{groupName}</span>
                <span className="text-[11px] text-neutral-400">{rules.length}</span>
              </div>
            )}
            {rules.map((rule) => {
              const isExpanded = expanded.has(rule.id);
              const changeStatus = diff?.byRule[rule.id] ?? 'unchanged';
              return (
                <div key={rule.id} className="border-b border-neutral-50">
                  {/* Collapsed row */}
                  <div
                    className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[#FAFBFC] ${!rule.enabled ? 'opacity-60' : ''}`}
                    onClick={() => toggleExpanded(rule.id)}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon size={14} className="shrink-0 text-neutral-400" />
                    ) : (
                      <ChevronRightIcon size={14} className="shrink-0 text-neutral-400" />
                    )}
                    <span className="min-w-0 truncate text-sm font-medium text-neutral-900">{rule.name}</span>
                    {rule.triggers.map((trigger) => (
                      <span
                        key={trigger.kind}
                        className="shrink-0 rounded-full border border-[#0461BA]/20 bg-[#E8F1FB] px-2 py-0.5 text-[10px] font-semibold text-[#0461BA]"
                      >
                        {describeTrigger(trigger)}
                      </span>
                    ))}
                    {(rule.effectiveFrom || rule.effectiveUntil) && (
                      <CalendarClockIcon size={13} className="shrink-0 text-amber-500" aria-label="Effective-dated" />
                    )}
                    {changeStatus !== 'unchanged' && (
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        {changeStatus === 'new' ? 'New' : 'Edited'}
                      </span>
                    )}
                    <div className="ml-auto flex shrink-0 items-center gap-3">
                      <span className="hidden text-[11px] text-neutral-400 sm:block">
                        {rule.assignments.length} recipient{rule.assignments.length === 1 ? '' : 's'}
                      </span>
                      {canManage ? (
                        <label
                          className="flex items-center gap-1.5 text-[11px] font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => toggleEnabled(rule)}
                            className="h-3.5 w-3.5 accent-[#0461BA]"
                            aria-label={`${rule.name} enabled`}
                          />
                          <span className={rule.enabled ? 'text-emerald-600' : 'text-neutral-400'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      ) : (
                        <span className={`text-[11px] font-medium ${rule.enabled ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          ● {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="space-y-2 bg-[#FAFBFC] px-10 pb-3 pt-1">
                      {rule.description && <p className="text-xs text-neutral-500">{rule.description}</p>}
                      <p className="font-mono text-[11px] text-neutral-600">{summariseConditions(rule)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.assignments.map((assignment, index) => {
                          const recipient = resolveRecipient(assignment.recipient, users, workgroups);
                          const reason = settings.reasons[assignment.action]?.find((r) => r.id === assignment.reasonId);
                          const RecipientIcon = recipient.kind === 'workgroup' ? UsersIcon : UserIcon;
                          return (
                            <span
                              key={index}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                                recipient.active
                                  ? 'border-neutral-200 bg-white text-neutral-700'
                                  : 'border-red-200 bg-red-50 text-red-700'
                              }`}
                              title={recipient.active ? undefined : 'Recipient is deactivated — auto-skipped at distribution time'}
                            >
                              <RecipientIcon size={11} className="shrink-0 text-neutral-400" />
                              <span className="font-medium">{recipient.name}</span>
                              <span className="text-neutral-400">—</span>
                              {ACTION_LABELS[assignment.action]}
                              {reason ? ` · ${reason.label}` : ''}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        {(rule.effectiveFrom || rule.effectiveUntil) && (
                          <span className="text-[11px] text-amber-700">
                            Effective {rule.effectiveFrom ? `from ${formatShortDate(rule.effectiveFrom)}` : ''}
                            {rule.effectiveFrom && rule.effectiveUntil ? ' ' : ''}
                            {rule.effectiveUntil ? `until ${formatShortDate(rule.effectiveUntil)}` : ''}
                          </span>
                        )}
                        {canManage && (
                          <button
                            onClick={() => setEditor({ rule, isNew: false })}
                            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-[#F0F4F8]"
                          >
                            <PencilIcon size={11} /> Edit rule
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Slide-over editor — keyed so state resets per rule */}
      {editor && (
        <RuleEditor
          key={editor.isNew ? 'new' : editor.rule.id}
          wsId={wsId}
          rule={editor.rule}
          isNew={editor.isNew}
          users={users}
          workgroups={workgroups}
          settings={settings}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
