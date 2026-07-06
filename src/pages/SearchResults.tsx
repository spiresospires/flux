import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  Building2Icon,
  FileIcon,
  FileQuestionIcon,
  FolderIcon,
  LoaderIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon
} from 'lucide-react';
import { LeftRail } from '../components/LeftRail';
// [API] G19:POST /workspaces/{wsId}/search — served over HTTP (MSW in the prototype).
// [AUTH]
// [PHASE-1]
// Facet counts come from the response `aggregations` (computed server-side over the
// full result set); the type tabs are a server-side `types` filter; results are
// cursor-paginated (ADR-011) behind an infinite-scroll sentinel.
import type { SearchResult, SearchResultType } from '../types/search';
import { useSearch } from '../contexts/SearchContext';
import { useSearch as useSearchApi } from '../hooks/useSearch';
import { ENTERPRISE_SEARCH_SCOPE } from '../api/search';
import { useScope } from '../contexts/ScopeContext';

type SearchTab = 'all' | SearchResultType;

// Extend this map as new object types are added to the system — FilterBar auto-renders them.
const resultTypeLabels: Record<string, string> = {
  all: 'All',
  document: 'Documents',
  placeholder: 'Placeholders',
  approval: 'Approvals',
  review: 'Reviews',
  transmittal: 'Transmittals',
  rfi: 'RFIs',
  'change-request': 'Change Requests',
  package: 'Packages',
};

interface FilterCategory {
  type: SearchTab;
  label: string;
  count: number;
}

function FilterBar({
  categories,
  active,
  onSelect,
}: {
  categories: FilterCategory[];
  active: SearchTab;
  onSelect: (tab: SearchTab) => void;
}) {
  return (
    <div className="shrink-0 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 overflow-x-auto scrollbar-hide">
      {categories.map((cat, i) => {
        const isActive = active === cat.type;
        return (
          <React.Fragment key={cat.type}>
            {/* Divider after "All" */}
            {i === 1 && (
              <span className="w-px h-4 bg-neutral-200 shrink-0 mx-0.5" aria-hidden />
            )}
            <button
              onClick={() => onSelect(cat.type)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#0461BA] text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-[#F0F4F8] hover:text-neutral-900'
              }`}
            >
              {cat.label}
              <span
                className={`inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-bold tabular-nums ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : cat.count === 0
                    ? 'bg-neutral-100 text-neutral-400'
                    : 'bg-[#E8F1FB] text-[#0461BA]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  Draft: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'In Review': 'bg-warning-50 text-warning-700 border-warning-200',
  Approved: 'bg-success-50 text-success-700 border-success-200',
  Superseded: 'bg-plum-50 text-plum-700 border-plum-200',
  Archived: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  'Pending Upload': 'bg-amber-50 text-amber-800 border-amber-200'
};

function formatDate(value?: string) {
  if (!value) {
    return 'No date';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}


function ResultTypeBadge({ result }: { result: SearchResult }) {
  const isPlaceholder = result.resultType === 'placeholder';
  const Icon = isPlaceholder ? FileQuestionIcon : FileIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold ${
        isPlaceholder
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-[#E8F1FB] text-[#0461BA] border-[#0461BA]/20'
      }`}
    >
      <Icon size={12} />
      {isPlaceholder ? 'Placeholder' : 'Document'}
    </span>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const navigate = useNavigate();
  const isPlaceholder = result.resultType === 'placeholder';

  // Deep link into the browser via URL params — shareable, survives refresh, and
  // works when opened in a second window (ADR-010 multi-window). DocumentBrowser
  // validates the params against the loaded tree and switches scope from `ws`.
  const handleFolderClick = () => {
    const params = new URLSearchParams();
    if (result.projectId) params.set('ws', result.projectId);
    if (result.folderId) params.set('folder', result.folderId);
    params.set('doc', result.id);
    navigate(`/documents?${params.toString()}`);
  };

  const folderLabel = result.location.split('/').filter(Boolean).pop() ?? result.location;

  return (
    <article
      className={`rounded-md border bg-white px-3 py-2.5 transition-colors hover:border-[#0461BA]/40 ${
        isPlaceholder ? 'border-amber-200 shadow-[inset_3px_0_0_#f59e0b]' : 'border-neutral-200'
      }`}
    >
      {/* Top row: badges + date */}
      <div className="flex items-center gap-2 flex-wrap">
        <ResultTypeBadge result={result} />
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${statusStyles[result.status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
          {result.status}
        </span>
        {isPlaceholder && (
          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            No content uploaded
          </span>
        )}
        <span className="ml-auto text-[11px] text-neutral-400 shrink-0">
          {result.dateModified ? 'Modified' : 'Created'} {formatDate(result.dateModified ?? result.dateCreated)}
          {result.revision && <span className="ml-2 text-neutral-400">Rev {result.revision}</span>}
        </span>
      </div>

      {/* Title block */}
      <div className="mt-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">{result.reference}</p>
          {result.project && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#E8F1FB] text-[#0461BA] border border-[#0461BA]/20">
              <Building2Icon size={10} className="shrink-0" />
              {result.project}
            </span>
          )}
        </div>
        <h2 className="mt-0.5 text-sm font-semibold text-neutral-900 leading-snug">{result.title}</h2>
        {result.snippet && (
          <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{result.snippet}</p>
        )}
      </div>

      {/* Footer row */}
      <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-3 flex-wrap text-xs text-neutral-500">
        {/* Location — far left, acts as folder navigation link */}
        {result.folderId ? (
          <button
            onClick={handleFolderClick}
            className="inline-flex items-center gap-1 text-[#0461BA] hover:underline min-w-0 shrink-0 max-w-[220px]"
            title={result.location}
          >
            <FolderIcon size={13} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">{folderLabel}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 min-w-0 shrink-0 max-w-[220px]">
            <FolderIcon size={13} className="text-amber-400 flex-shrink-0" />
            <span className="truncate text-neutral-500" title={result.location}>{folderLabel}</span>
          </span>
        )}

        <span className="text-neutral-200 select-none">|</span>
        <span>{result.objectType}</span>
        <span className="text-neutral-200 select-none">·</span>
        <span>{result.author}</span>
        {result.discipline && (
          <>
            <span className="text-neutral-200 select-none">·</span>
            <span>{result.discipline}</span>
          </>
        )}
      </div>
    </article>
  );
}

function EmptySearchState() {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-xl bg-white shadow-md p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F1FB] text-[#0461BA]">
          <SearchIcon size={22} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">Search across FusionLive</h2>
        <p className="mt-2 text-sm text-neutral-600">Use the search bar above to find anything.</p>
      </div>
    </section>
  );
}

function NoResultsState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <section className="flex min-h-[360px] items-center justify-center rounded-xl bg-white shadow-md p-8 text-center">
      <div className="max-w-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
          <SearchIcon size={22} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">No results found for '{query}'</h2>
        <p className="mt-2 text-sm text-neutral-600">Try searching by document reference, title, status, type, author, or folder.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-[#F0F4F8]"
          >
            <XIcon size={14} />
            Clear search
          </button>
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 rounded-md bg-[#0461BA] px-3 py-2 text-sm font-medium text-white hover:bg-[#034f97]"
          >
            Return to Documents
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setLastQuery } = useSearch();
  const { scope } = useScope();
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const query = searchParams.get('q')?.trim() ?? '';

  useEffect(() => {
    if (query) setLastQuery(query);
  }, [query, setLastQuery]);

  // Search runs server-side (G19): full-text matching, workspace scoping, the
  // type-tab filter and pagination all happen behind the API. In enterprise
  // scope the '_all' sentinel searches every workspace the user can access.
  const wsId = scope.kind === 'project' ? scope.id : ENTERPRISE_SEARCH_SCOPE;
  const {
    results,
    aggregations,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchApi(wsId, {
    query,
    types: activeTab === 'all' ? undefined : [activeTab as SearchResultType],
  });

  // 'All' = sum of the server facet counts (aggregations cover the full result
  // set regardless of the active tab, so the pills stay stable).
  const allCount = useMemo(
    () => Object.values(aggregations).reduce((sum, n) => sum + (n ?? 0), 0),
    [aggregations]
  );

  // Build filter categories dynamically — 'All' first, then one pill per type present
  // in the aggregations. New SearchResultType values appear here automatically.
  const filterCategories = useMemo<FilterCategory[]>(() => {
    const typeEntries = (Object.entries(aggregations) as [SearchResultType, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type: type as SearchTab,
        label: resultTypeLabels[type] ?? type.charAt(0).toUpperCase() + type.slice(1),
        count,
      }));
    return [{ type: 'all', label: 'All', count: allCount }, ...typeEntries];
  }, [aggregations, allCount]);

  useEffect(() => {
    setActiveTab('all');
  }, [query, scope]);

  // Infinite scroll: ask for the next cursor page when the sentinel enters the
  // list's viewport (same pattern as DocumentBrowser).
  const listRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const rootEl = listRef.current;
    const sentinel = sentinelRef.current;
    if (!rootEl || !sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { root: rootEl, threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, results.length]);

  const clearSearch = () => {
    setActiveTab('all');
    setSearchParams({});
  };

  return (
    <div data-component="page-shell" className="h-[calc(100vh-60px)] mt-[60px] bg-[var(--main-bg-color)] overflow-hidden p-4">
      <LeftRail activeItem="search" onItemClick={() => {}} />

      <main className="ml-[var(--left-rail-width,88px)] h-full overflow-hidden">
        <div data-component="page-layout" className="flex h-full w-full flex-col gap-4 overflow-hidden">
          {/* header-panel, NOT content-panel: in flush view content-panel gets
              min-height:100% (index.css), which would inflate this shrink-0 header
              to full page height and push the results list off-screen. */}
          <header data-component="header-panel" className="shrink-0 rounded-xl bg-white shadow-md px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Search results</h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {query
                    ? `Showing results for "${query}" ${scope.kind === 'project' ? `in ${scope.name}` : 'across all projects'}`
                    : 'Search from the bar above.'}
                </p>
              </div>
              {query && allCount > 0 && (
                <FilterBar
                  categories={filterCategories}
                  active={activeTab}
                  onSelect={setActiveTab}
                />
              )}
            </div>
          </header>

          {!query ? (
            <div className="flex-1 overflow-y-auto">
              <EmptySearchState />
            </div>
          ) : isError ? (
            <section className="flex min-h-[360px] flex-1 items-center justify-center rounded-xl bg-white shadow-md p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <AlertTriangleIcon size={22} />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-neutral-900">Search failed</h2>
                <p className="mt-2 text-sm text-neutral-600">Something went wrong talking to the server.</p>
                <button
                  onClick={() => refetch()}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#0461BA] px-3 py-2 text-sm font-medium text-white hover:bg-[#034f97]">
                  <RefreshCwIcon size={14} /> Try again
                </button>
              </div>
            </section>
          ) : isLoading ? (
            <div className="flex-1 space-y-2 pt-1 pr-4 animate-pulse" aria-busy="true" aria-label="Searching">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/70 border border-neutral-200 rounded-md" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <NoResultsState query={query} onClear={clearSearch} />
            </div>
          ) : (
            <section ref={listRef} className="flex-1 overflow-y-auto space-y-2 pt-1 pr-4" aria-label="Search results list">
              {results.map((result) => (
                <SearchResultCard key={`${result.resultType}-${result.id}`} result={result} />
              ))}
              {hasNextPage && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <LoaderIcon size={18} className="animate-spin" />
                      <span className="text-sm">Loading more results...</span>
                    </div>
                  ) : (
                    <div className="h-8" />
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
