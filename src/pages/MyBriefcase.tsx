import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseIcon,
  Building2Icon,
  CheckIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  LockIcon,
  RefreshCwIcon,
  TrashIcon,
  TriangleAlertIcon,
  CircleSlashIcon,
} from 'lucide-react';
import { LeftRail } from '../components/LeftRail';
import { useBriefcase } from '../contexts/BriefcaseContext';
import { BriefcaseItem, BriefcaseState } from '../types/briefcase';

const statusStyles: Record<string, string> = {
  New: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'Under Review': 'bg-warning-50 text-warning-700 border-warning-200',
  Approved: 'bg-success-50 text-success-700 border-success-200',
  Issued: 'bg-sky-50 text-sky-700 border-sky-200',
  Superseded: 'bg-plum-50 text-plum-700 border-plum-200',
  Archived: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const stateConfig: Record<
  BriefcaseState,
  { label: string; className: string; icon: React.ElementType }
> = {
  current: { label: 'Current', className: 'bg-[#E8F1FB] text-[#0461BA] border-[#0461BA]/20', icon: CheckIcon },
  'newer-available': { label: 'Newer revision', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: TriangleAlertIcon },
  'checked-out': { label: 'Checked out', className: 'bg-orange-50 text-orange-700 border-orange-200', icon: LockIcon },
  unavailable: { label: 'Unavailable', className: 'bg-red-50 text-red-700 border-red-200', icon: CircleSlashIcon },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StateBadge({ item }: { item: BriefcaseItem }) {
  // Dynamic items always follow the latest revision, so they never read as stale.
  const effective: BriefcaseState = item.isDynamic ? 'current' : item.state;
  const cfg = stateConfig[effective];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.className}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function EmptyState() {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-xl bg-white shadow-md p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F1FB] text-[#0461BA]">
          <BriefcaseIcon size={22} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">Your briefcase is empty</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Add documents from anywhere in FusionLive using the briefcase icon — they'll gather here across all your workspaces.
        </p>
      </div>
    </section>
  );
}

export function MyBriefcase() {
  const navigate = useNavigate();
  const { items, count, remove, removeMany, clear } = useBriefcase();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Group items by source workspace so it's always clear where each came from (TXT §19, §42).
  const groups = useMemo(() => {
    const map = new Map<string, BriefcaseItem[]>();
    for (const item of items) {
      const key = item.sourceWorkspaceName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const allSelected = count > 0 && selected.size === count;

  const toggle = (docId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(docId) ? next.delete(docId) : next.add(docId);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => (prev.size === count ? new Set() : new Set(items.map((i) => i.docId))));

  const removeSelected = () => {
    removeMany(Array.from(selected));
    setSelected(new Set());
  };

  return (
    <div data-component="page-shell" className="h-[calc(100vh-60px)] mt-[60px] bg-[var(--main-bg-color)] overflow-hidden p-4">
      <LeftRail activeItem="briefcase" onItemClick={() => {}} />

      <main className="ml-[var(--left-rail-width,88px)] h-full overflow-hidden">
        <div data-component="page-layout" className="flex h-full w-full flex-col gap-4 overflow-hidden">
          {/* header-panel, NOT content-panel — see flush-view trap note in SearchResults. */}
          <header data-component="header-panel" className="shrink-0 rounded-xl bg-white shadow-md px-5 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F1FB] text-[#0461BA]">
                  <BriefcaseIcon size={18} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-neutral-900">My Briefcase</h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {count === 0
                      ? 'No documents held'
                      : `${count} document${count === 1 ? '' : 's'} across ${groups.length} workspace${groups.length === 1 ? '' : 's'}`}
                    {selected.size > 0 && ` · ${selected.size} selected`}
                  </p>
                </div>
              </div>

              {count > 0 && (
                <div className="flex items-center gap-2">
                  {/* [API] G07:GET /workspaces/{wsId}/documents/{docId}/content (bulk download) [AUTH] [TBD] — Briefcase 2 */}
                  <button
                    disabled={selected.size === 0}
                    onClick={() => {/* [TODO-ENG] wire bulk download — Briefcase 2 */}}
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-[#F0F4F8] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <DownloadIcon size={14} /> Download
                  </button>
                  {/* [TODO-ENG] wire metadata export (ideas I-208/I-584) — Briefcase 2/4 */}
                  <button
                    disabled={selected.size === 0}
                    onClick={() => {/* [TODO-ENG] wire export — Briefcase 2 */}}
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-[#F0F4F8] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheetIcon size={14} /> Export
                  </button>
                  <button
                    disabled={selected.size === 0}
                    onClick={removeSelected}
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <TrashIcon size={14} /> Remove
                  </button>
                  <div className="w-px h-5 bg-neutral-200" />
                  <button
                    onClick={() => { clear(); setSelected(new Set()); }}
                    className="text-xs font-medium text-neutral-600 hover:text-red-600"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </header>

          {count === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <EmptyState />
            </div>
          ) : (
            <section className="flex-1 overflow-y-auto rounded-xl bg-white shadow-md" aria-label="Briefcase items">
              {/* Select-all header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-100 bg-white px-5 py-2.5">
                <button
                  onClick={toggleAll}
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                    allSelected ? 'bg-[#0461BA] border-[#0461BA]' : selected.size > 0 ? 'bg-[#0461BA]/20 border-[#0461BA]' : 'border-neutral-300'
                  }`}
                  aria-label={allSelected ? 'Deselect all' : 'Select all'}
                >
                  {selected.size > 0 && <CheckIcon size={12} className="text-white" />}
                </button>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {allSelected ? 'Deselect all' : 'Select all'}
                </span>
              </div>

              {groups.map(([workspace, groupItems]) => (
                <div key={workspace}>
                  {/* Workspace group header */}
                  <div className="flex items-center gap-2 bg-[#F7FAFD] px-5 py-2 border-b border-neutral-100">
                    <Building2Icon size={13} className="text-[#0461BA]" />
                    <span className="text-xs font-semibold text-neutral-700">{workspace}</span>
                    <span className="text-[11px] text-neutral-400">{groupItems.length}</span>
                  </div>

                  {groupItems.map((item) => {
                    const isSelected = selected.has(item.docId);
                    return (
                      <div
                        key={item.docId}
                        className={`flex items-center gap-3 px-5 py-3 border-b border-neutral-50 transition-colors ${
                          isSelected ? 'bg-[#F0F6FF]' : 'hover:bg-[#FAFBFC]'
                        }`}
                      >
                        <button
                          onClick={() => toggle(item.docId)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            isSelected ? 'bg-[#0461BA] border-[#0461BA]' : 'border-neutral-300 hover:border-[#0461BA]'
                          }`}
                          aria-label={isSelected ? `Deselect ${item.reference}` : `Select ${item.reference}`}
                        >
                          {isSelected && <CheckIcon size={12} className="text-white" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{item.reference}</span>
                            <span className="text-[11px] text-neutral-400">Rev {item.pinnedRevision}</span>
                            {item.isDynamic && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#0461BA]/20 bg-[#E8F1FB] px-1.5 py-0.5 text-[10px] font-semibold text-[#0461BA]">
                                <RefreshCwIcon size={9} /> Dynamic
                              </span>
                            )}
                          </div>
                          <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                        </div>

                        <span className={`hidden sm:inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[11px] border ${statusStyles[item.status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                          {item.status}
                        </span>
                        <div className="shrink-0"><StateBadge item={item} /></div>
                        <span className="hidden md:block w-14 shrink-0 text-right text-[11px] text-neutral-400">{item.fileType}</span>
                        <span className="hidden lg:block w-20 shrink-0 text-right text-[11px] text-neutral-400">{formatDate(item.addedAt)}</span>

                        <button
                          onClick={() => { remove(item.docId); setSelected((p) => { const n = new Set(p); n.delete(item.docId); return n; }); }}
                          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label={`Remove ${item.reference} from briefcase`}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
