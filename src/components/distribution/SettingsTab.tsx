// Settings tab — workspace-level AD governance: action precedence (dedupe
// order), editable reason vocabularies per action (never frozen, unlike legacy
// codes), and alert recipients for unmatched/skip notifications.
// Local draft copy with dirty tracking; Save PATCHes the whole settings object.
// [PHASE-1]
import { useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from 'lucide-react';
import type { AdSettings } from '../../types/distribution';
import { ACTION_LABELS, ACTION_TYPES } from '../../utils/distributionEngine';
import { useAdSettings, useAdUsers, useUpdateAdSettings } from '../../hooks/useDistribution';

interface SettingsTabProps {
  wsId: string;
  canManage: boolean;
}

const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

export function SettingsTab({ wsId, canManage }: SettingsTabProps) {
  const { data: settings } = useAdSettings(wsId);
  const { data: users = [] } = useAdUsers();
  const update = useUpdateAdSettings(wsId);

  const [local, setLocal] = useState<AdSettings | null>(null);
  const lastSynced = useRef<string | null>(null);

  // Sync local from the server copy, but never clobber unsaved local edits
  // when a background refetch lands.
  useEffect(() => {
    if (!settings) return;
    const json = JSON.stringify(settings);
    if (lastSynced.current === json) return;
    setLocal((prev) =>
      prev === null || JSON.stringify(prev) === lastSynced.current
        ? (JSON.parse(json) as AdSettings)
        : prev
    );
    lastSynced.current = json;
  }, [settings]);

  if (!local || !settings) {
    return <p className="px-5 py-8 text-center text-xs text-neutral-400">Loading settings…</p>;
  }

  const dirty = JSON.stringify(local) !== lastSynced.current;

  const movePrecedence = (index: number, direction: -1 | 1) => {
    const next = [...local.actionPrecedence];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLocal({ ...local, actionPrecedence: next });
  };

  const setReasonLabel = (action: (typeof ACTION_TYPES)[number], reasonId: string, label: string) =>
    setLocal({
      ...local,
      reasons: {
        ...local.reasons,
        [action]: local.reasons[action].map((r) => (r.id === reasonId ? { ...r, label } : r)),
      },
    });

  const removeReason = (action: (typeof ACTION_TYPES)[number], reasonId: string) =>
    setLocal({
      ...local,
      reasons: { ...local.reasons, [action]: local.reasons[action].filter((r) => r.id !== reasonId) },
    });

  const addReason = (action: (typeof ACTION_TYPES)[number]) =>
    setLocal({
      ...local,
      reasons: {
        ...local.reasons,
        [action]: [...local.reasons[action], { id: `rsn-${crypto.randomUUID().slice(0, 8)}`, label: '' }],
      },
    });

  const toggleNotify = (userId: string) =>
    setLocal({
      ...local,
      notifyUserIds: local.notifyUserIds.includes(userId)
        ? local.notifyUserIds.filter((id) => id !== userId)
        : [...local.notifyUserIds, userId],
    });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        {/* Action precedence */}
        <section>
          <span className={sectionLabelClass}>Action precedence (dedupe order)</span>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            A recipient owed two different actions gets the one higher in this list.
          </p>
          <ol className="mt-2 max-w-sm space-y-1">
            {local.actionPrecedence.map((action, index) => (
              <li
                key={action}
                className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-[#FAFBFC] px-2.5 py-1.5"
              >
                <span className="w-4 text-center text-[11px] font-semibold text-neutral-400">{index + 1}</span>
                <span className="flex-1 text-xs font-medium text-neutral-800">{ACTION_LABELS[action]}</span>
                {canManage && (
                  <>
                    <button
                      onClick={() => movePrecedence(index, -1)}
                      disabled={index === 0}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-[#F0F4F8] hover:text-neutral-700 disabled:opacity-30"
                      aria-label={`Move ${ACTION_LABELS[action]} up`}
                    >
                      <ArrowUpIcon size={12} />
                    </button>
                    <button
                      onClick={() => movePrecedence(index, 1)}
                      disabled={index === local.actionPrecedence.length - 1}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-[#F0F4F8] hover:text-neutral-700 disabled:opacity-30"
                      aria-label={`Move ${ACTION_LABELS[action]} down`}
                    >
                      <ArrowDownIcon size={12} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Reason vocabularies */}
        <section>
          <span className={sectionLabelClass}>Reasons for issue (per action)</span>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Editable any time — removing a reason leaves existing rules pointing at it until they're edited.
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ACTION_TYPES.map((action) => (
              <div key={action} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">{ACTION_LABELS[action]}</span>
                  {canManage && (
                    <button
                      onClick={() => addReason(action)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 hover:bg-[#F0F4F8]"
                    >
                      <PlusIcon size={10} /> Add
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {local.reasons[action].map((reason) =>
                    canManage ? (
                      <div key={reason.id} className="flex items-center gap-1">
                        <input
                          value={reason.label}
                          onChange={(e) => setReasonLabel(action, reason.id, e.target.value)}
                          placeholder="Reason label"
                          className="h-6 w-full rounded-md border border-neutral-200 bg-[#F0F4F8] px-2 text-[11px] text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
                          aria-label={`${ACTION_LABELS[action]} reason`}
                        />
                        <button
                          onClick={() => removeReason(action, reason.id)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${reason.label || 'reason'}`}
                        >
                          <XIcon size={11} />
                        </button>
                      </div>
                    ) : (
                      <p key={reason.id} className="text-[11px] text-neutral-600">
                        {reason.label}
                      </p>
                    )
                  )}
                  {local.reasons[action].length === 0 && (
                    <p className="text-[11px] text-neutral-400">No reasons defined.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Alert recipients */}
        <section>
          <span className={sectionLabelClass}>Alert recipients</span>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Notified about unmatched documents and skipped (deactivated) recipients.
          </p>
          <div className="mt-2 max-w-sm space-y-1">
            {users.map((user) => (
              <label
                key={user.id}
                className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-xs ${
                  canManage ? 'cursor-pointer hover:bg-[#F0F4F8]' : ''
                } ${local.notifyUserIds.includes(user.id) ? 'text-neutral-800' : 'text-neutral-500'}`}
              >
                <input
                  type="checkbox"
                  checked={local.notifyUserIds.includes(user.id)}
                  onChange={() => toggleNotify(user.id)}
                  disabled={!canManage}
                  className="h-3.5 w-3.5 accent-[#0461BA]"
                />
                {user.name}
                {!user.active && <span className="text-[10px] text-red-500">inactive</span>}
              </label>
            ))}
          </div>
        </section>
      </div>

      {canManage && (
        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          {update.isError && <span className="mr-auto text-[11px] text-red-600">Save failed — try again.</span>}
          {!dirty && !update.isPending && lastSynced.current && (
            <span className="text-[11px] text-neutral-400">All changes saved</span>
          )}
          <button
            onClick={() => update.mutate(local)}
            disabled={!dirty || update.isPending}
            className="rounded-md bg-[#0461BA] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0355a4] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {update.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </footer>
      )}
    </div>
  );
}
