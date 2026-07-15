// History tab — published-version timeline with who/when/summary, a rule-level
// diff against the previous version, and Restore-as-draft (two-click confirm;
// overwrites the current draft and re-enters the normal publish flow).
// [PHASE-1]
import { useState } from 'react';
import { HistoryIcon, RotateCcwIcon } from 'lucide-react';
import { diffRuleLists } from '../../utils/distributionEngine';
import { useAdRuleSet, useAdUsers, useRestoreAdVersion } from '../../hooks/useDistribution';
import { formatShortDate } from './shared';

interface HistoryTabProps {
  wsId: string;
  canManage: boolean;
}

export function HistoryTab({ wsId, canManage }: HistoryTabProps) {
  const { data: ruleSet, isLoading } = useAdRuleSet(wsId);
  const { data: users = [] } = useAdUsers();
  const restore = useRestoreAdVersion(wsId);
  const [confirmingVersion, setConfirmingVersion] = useState<number | null>(null);

  if (isLoading || !ruleSet) {
    return <p className="px-5 py-8 text-center text-xs text-neutral-400">Loading history…</p>;
  }

  if (ruleSet.history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <HistoryIcon size={20} className="mx-auto text-neutral-300" />
          <p className="mt-2 text-xs text-neutral-500">Nothing published yet — publish the draft to start the history.</p>
        </div>
      </div>
    );
  }

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const doRestore = (version: number) => {
    if (confirmingVersion !== version) {
      setConfirmingVersion(version);
      return;
    }
    restore.mutate(version, { onSuccess: () => setConfirmingVersion(null) });
  };

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <ol className="relative space-y-4 border-l border-neutral-200 pl-5">
        {ruleSet.history.map((version, index) => {
          const previous = ruleSet.history[index + 1];
          const diff = previous ? diffRuleLists(previous.rules, version.rules) : null;
          const isCurrent = version.version === ruleSet.published?.version;
          const isConfirming = confirmingVersion === version.version;
          return (
            <li key={version.version} className="relative">
              <span
                className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                  isCurrent ? 'border-[#0461BA] bg-[#0461BA]' : 'border-neutral-300 bg-white'
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">v{version.version}</span>
                {isCurrent && (
                  <span className="rounded-full border border-[#0461BA]/20 bg-[#E8F1FB] px-2 py-0.5 text-[10px] font-semibold text-[#0461BA]">
                    Current
                  </span>
                )}
                <span className="text-[11px] text-neutral-400">
                  {formatShortDate(version.publishedAt)} · {userName(version.publishedBy)} · {version.rules.length} rule{version.rules.length === 1 ? '' : 's'}
                </span>
                {canManage && (
                  <button
                    onClick={() => doRestore(version.version)}
                    disabled={restore.isPending}
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                      isConfirming
                        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'border-neutral-200 text-neutral-600 hover:bg-[#F0F4F8]'
                    }`}
                  >
                    <RotateCcwIcon size={11} />
                    {isConfirming ? 'Overwrites current draft — confirm' : 'Restore as draft'}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-neutral-700">{version.summary}</p>
              {diff && (
                <p className="mt-1 text-[11px] text-neutral-500">
                  vs v{previous!.version}:{' '}
                  {diff.total === 0
                    ? 'no rule changes'
                    : [
                        diff.added.length > 0 && `added ${diff.added.map((r) => r.name).join(', ')}`,
                        diff.edited.length > 0 && `edited ${diff.edited.map((r) => r.name).join(', ')}`,
                        diff.removed.length > 0 && `removed ${diff.removed.map((r) => r.name).join(', ')}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
              )}
              {!previous && (
                <p className="mt-1 text-[11px] text-neutral-400">First published version.</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
