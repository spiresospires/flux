// Admin → Automatic Distribution (AUTO_DISTRIBUTION_PLAN.md §3).
// Tab in URL params (?tab=rules|matrix|tester|unmatched|log|history|settings)
// so links are shareable — same convention as Search → DocumentBrowser.
// AD 1 ships the Rules tab; the rest are staged placeholders (AD 2–4).
// Workspace-scoped like Documents: enterprise scope shows a pick-a-workspace
// state, and users without ad.view get the no-access state (rail hides the
// entry, but the route must still guard against direct URLs).
// [PHASE-1]
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FlaskConicalIcon,
  Grid3x3Icon,
  HistoryIcon,
  InboxIcon,
  ListChecksIcon,
  LockIcon,
  ScrollTextIcon,
  Settings2Icon,
  Share2Icon,
} from 'lucide-react';
import { LeftRail } from '../../components/LeftRail';
import { RulesTab } from '../../components/distribution/RulesTab';
import { useScope } from '../../contexts/ScopeContext';
import { usePermissions } from '../../contexts/PermissionContext';
import { useAdRuleSet } from '../../hooks/useDistribution';
import { diffRuleSet } from '../../utils/distributionEngine';

type TabId = 'rules' | 'matrix' | 'tester' | 'unmatched' | 'log' | 'history' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'rules', label: 'Rules' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'tester', label: 'Tester' },
  { id: 'unmatched', label: 'Unmatched' },
  { id: 'log', label: 'Log' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
];

/** Which build stage delivers each placeholder tab (plan §4). */
const PLACEHOLDER_STAGE: Record<Exclude<TabId, 'rules'>, { stage: string; blurb: string; icon: React.ElementType }> = {
  matrix: { stage: 'AD 3 — Diagnostics', blurb: 'Read-only coverage pivot derived from the rules: value combinations × recipients, with click-through to the owning rule.', icon: Grid3x3Icon },
  tester: { stage: 'AD 3 — Diagnostics', blurb: 'Pick a document or enter metadata to see which rules fire, how workgroups expand, and the dedupe trace — against draft or published.', icon: FlaskConicalIcon },
  unmatched: { stage: 'AD 4 — Runtime loop', blurb: 'Documents that matched no rule land here with alerting, open-in-tester and deduped re-run — no more silent non-distribution.', icon: InboxIcon },
  log: { stage: 'AD 4 — Runtime loop', blurb: 'Every distribution event: matched rules, recipients, actions started, and skipped deactivated recipients.', icon: ScrollTextIcon },
  history: { stage: 'AD 2 — Governance', blurb: 'Published versions with who/when/summary, rule-level diff, and restore-as-draft.', icon: HistoryIcon },
  settings: { stage: 'AD 2 — Governance', blurb: 'Action precedence order, reason vocabularies per action, and alert recipients.', icon: Settings2Icon },
};

export function AutomaticDistribution() {
  const { scope } = useScope();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const wsId = scope.kind === 'project' ? scope.id : null;
  const canView = hasPermission('ad.view');
  const canManage = hasPermission('ad.manage');

  const tabParam = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'rules';

  const { data: ruleSet } = useAdRuleSet(canView ? wsId : null);
  const diff = useMemo(() => (ruleSet ? diffRuleSet(ruleSet) : null), [ruleSet]);

  const setTab = (tab: TabId) => setSearchParams(tab === 'rules' ? {} : { tab }, { replace: true });

  return (
    <div data-component="page-shell" className="h-[calc(100vh-60px)] mt-[60px] bg-[var(--main-bg-color)] overflow-hidden p-4">
      <LeftRail activeItem="distribution" onItemClick={() => {}} />

      <main className="ml-[var(--left-rail-width,88px)] h-full overflow-hidden">
        <div data-component="page-layout" className="flex h-full w-full flex-col gap-4 overflow-hidden">
          {/* Header panel */}
          <header data-component="header-panel" className="shrink-0 rounded-xl bg-white shadow-md px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F1FB] text-[#0461BA]">
                  <Share2Icon size={18} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-neutral-900">Automatic Distribution</h1>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {scope.kind === 'project' ? scope.name : 'No workspace selected'}
                    {ruleSet?.published && ` · published v${ruleSet.published.version}`}
                    {!canManage && canView && ' · read-only'}
                  </p>
                </div>
              </div>

              {canView && wsId && ruleSet && diff && (
                <div className="flex items-center gap-2">
                  {diff.total > 0 ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      Draft · {diff.total} change{diff.total === 1 ? '' : 's'} since v{ruleSet.draft.baseVersion}
                    </span>
                  ) : (
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                      In sync with v{ruleSet.draft.baseVersion}
                    </span>
                  )}
                  {canManage && (
                    <button
                      disabled
                      title="Publishing arrives in AD 2 — Governance"
                      className="cursor-not-allowed rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-400"
                    >
                      Publish…
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Guard states */}
          {!canView ? (
            <GuardCard
              icon={LockIcon}
              title="No access to Automatic Distribution"
              body="You need the 'Manage Automatic Distribution Rules' permission (or its read-only view) for this workspace. Contact a workspace administrator."
            />
          ) : !wsId ? (
            <GuardCard
              icon={Share2Icon}
              title="Select a workspace"
              body="Distribution rules are workspace-scoped. Pick a workspace from the selector in the top banner to manage its rule set."
            />
          ) : (
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-md" aria-label="Distribution rule set">
              {/* Tab bar */}
              <div className="flex shrink-0 items-center gap-1 border-b border-neutral-100 px-3 pt-2" role="tablist">
                {TABS.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(tab.id)}
                      className={`relative px-3 py-2 text-xs font-medium transition-colors ${
                        isActive ? 'text-[#0461BA]' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t-full bg-[#0461BA]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                {activeTab === 'rules' ? (
                  <RulesTab wsId={wsId} canManage={canManage} />
                ) : (
                  <PlaceholderTab tab={activeTab} />
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function GuardCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <section className="flex min-h-[420px] flex-1 items-center justify-center rounded-xl bg-white p-8 text-center shadow-md">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F1FB] text-[#0461BA]">
          <Icon size={22} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{body}</p>
      </div>
    </section>
  );
}

function PlaceholderTab({ tab }: { tab: Exclude<TabId, 'rules'> }) {
  const { stage, blurb, icon: Icon } = PLACEHOLDER_STAGE[tab];
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F4F8] text-neutral-400">
          <Icon size={20} />
        </div>
        <p className="mt-3 text-sm font-semibold text-neutral-700">Coming in {stage}</p>
        <p className="mt-1.5 text-xs text-neutral-500">{blurb}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
          <ListChecksIcon size={12} /> Staged in AUTO_DISTRIBUTION_PLAN.md
        </p>
      </div>
    </div>
  );
}
