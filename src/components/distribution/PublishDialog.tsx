// Publish dialog — lists the draft changes (named, from the version diff),
// surfaces publish-time checks (rule warnings + priority conflicts — warn,
// never block), and requires a summary note that becomes the History entry.
// [PHASE-1]
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TriangleAlertIcon, XIcon } from 'lucide-react';
import type { AdRuleSet } from '../../types/distribution';
import {
  ACTION_LABELS,
  diffRuleLists,
  findPriorityConflicts,
  ruleWarnings,
} from '../../utils/distributionEngine';
import { usePublishAdRuleSet, useAdUsers, useWorkgroups } from '../../hooks/useDistribution';
import { resolveRecipient } from './shared';

interface PublishDialogProps {
  wsId: string;
  ruleSet: AdRuleSet;
  onClose: () => void;
}

export function PublishDialog({ wsId, ruleSet, onClose }: PublishDialogProps) {
  const [summary, setSummary] = useState('');
  const publish = usePublishAdRuleSet(wsId);
  const { data: users = [] } = useAdUsers();
  const { data: workgroups = [] } = useWorkgroups(wsId);

  const diff = useMemo(
    () => diffRuleLists(ruleSet.published?.rules ?? [], ruleSet.draft.rules),
    [ruleSet]
  );

  // Publish-time checks over the whole draft (enabled rules): per-rule
  // warnings + priority-tie conflicts. Non-blocking by design.
  const checks = useMemo(() => {
    const perRule = ruleSet.draft.rules
      .filter((r) => r.enabled)
      .map((r) => ({ name: r.name, warnings: ruleWarnings(r) }))
      .filter((r) => r.warnings.length > 0);
    return { perRule, conflicts: findPriorityConflicts(ruleSet.draft.rules) };
  }, [ruleSet]);

  const nextVersion = (ruleSet.published?.version ?? 0) + 1;

  const doPublish = () =>
    publish.mutate(summary.trim(), { onSuccess: onClose });

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-neutral-900/30" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="absolute left-1/2 top-1/2 flex max-h-[85vh] w-[560px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-label={`Publish rule set version ${nextVersion}`}
      >
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">
            Publish v{nextVersion} — {diff.total} change{diff.total === 1 ? '' : 's'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-[#F0F4F8] hover:text-neutral-700"
            aria-label="Close publish dialog"
          >
            <XIcon size={15} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Changed rules, named */}
          <div className="space-y-2">
            {(
              [
                { label: 'New', items: diff.added, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'Edited', items: diff.edited, chip: 'bg-amber-50 text-amber-800 border-amber-200' },
                { label: 'Removed', items: diff.removed, chip: 'bg-red-50 text-red-700 border-red-200' },
              ] as const
            )
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.label} className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${group.chip}`}>
                    {group.label} · {group.items.length}
                  </span>
                  <p className="text-xs leading-5 text-neutral-700">
                    {group.items.map((r) => r.name).join(' · ')}
                  </p>
                </div>
              ))}
            {diff.total === 0 && (
              <p className="text-xs text-neutral-400">No changes — the draft matches the published version.</p>
            )}
          </div>

          {/* Publish-time checks (non-blocking) */}
          {(checks.perRule.length > 0 || checks.conflicts.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                <TriangleAlertIcon size={12} /> Checks — you can still publish
              </p>
              {checks.conflicts.map((conflict, index) => {
                const recipient = resolveRecipient(conflict.recipient, users, workgroups);
                return (
                  <p key={`c-${index}`} className="mt-1 text-[11px] leading-4 text-amber-800">
                    {conflict.rules.map((r) => `"${r.name}"`).join(' and ')} both give{' '}
                    <span className="font-semibold">{recipient.name}</span> a {ACTION_LABELS[conflict.action]} with
                    different reasons at equal priority — set different priorities to define which wins.
                  </p>
                );
              })}
              {checks.perRule.map((rule) => (
                <p key={rule.name} className="mt-1 text-[11px] leading-4 text-amber-800">
                  <span className="font-semibold">{rule.name}:</span> {rule.warnings.join(' ')}
                </p>
              ))}
            </div>
          )}

          {/* Required summary */}
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Summary (required — becomes the history entry)
            </span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="Added electrical review coverage and retired the interim transmittal rule"
              className="mt-1 w-full resize-none rounded-md border border-neutral-200 bg-[#F0F4F8] px-2 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
            />
          </label>

          {publish.isError && (
            <p className="text-[11px] text-red-600">Publish failed — try again.</p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            onClick={onClose}
            disabled={publish.isPending}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-[#F0F4F8] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={doPublish}
            disabled={publish.isPending || summary.trim() === '' || diff.total === 0}
            className="rounded-md bg-[#0461BA] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0355a4] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publish.isPending ? 'Publishing…' : `Publish v${nextVersion}`}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
