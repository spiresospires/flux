// DocumentBrowser — the main document grid page (folder tree + grid/list/table views,
// column sort/filter/reorder/resize, grouping, multi-select, infinite scroll, and an
// inline 'split'-variant DetailSlidePanel).
// Data arrives over HTTP via React Query hooks (useFolderTree / useDocuments) against
// the G05/G06 contracts — MSW answers in the prototype (src/mocks/handlers.ts).
// Folder scoping, status/type filters, sort and cursor pagination are SERVER-side
// (ADR-011); category (tag) chips and per-column text filters are still client-side
// over the loaded pages — [TODO-ENG] move both to G06 query params.
// Selection is deep-linkable: /documents?ws=<wsId>&folder=<folderId>&doc=<docId> —
// the URL is the source of truth so refreshes and second browser windows restore
// the same view (ADR-010 multi-window).
// [PHASE-1]
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from
  'react';
import { DocumentCard, PlaceholderFileIcon } from '../components/DocumentCard';
import { getFileTypeIcon } from '../components/fileTypeIcon';
import { statusColors } from '../components/documentStatusColors';
import { FilterPanel, type ContentStateFilter } from '../components/FilterPanel';
import { FolderTree } from '../components/FolderTree';
import { LeftRail } from '../components/LeftRail';
import { CollapsibleFilterPanel } from '../components/CollapsibleFilterPanel';
import { DetailSlidePanel, type DetailPanelData } from '../components/DetailSlidePanel';
import { ClipboardDropdown } from '../components/ClipboardDropdown';
import { PanelResizeHandle } from '../components/PanelResizeHandle';
// [API] G05:GET /workspaces/{wsId}/folders/tree + G06:GET /workspaces/{wsId}/documents
// [AUTH]
// [PHASE-1]
import { useQuery } from '@tanstack/react-query';
import { useFolderTree } from '../hooks/useFolderTree';
import { useDocuments } from '../hooks/useDocuments';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { getDocument } from '../api/documents';
import { queryKeys } from '../api/queryKeys';
import { PROJECTS, type ProjectId } from '../data/projects';
import { resolveWorkspaceId, urlWorkspaceHonoured } from './documentBrowserWorkspace';
// [MOCK] Journey/version-stack derivation — deleted with the rest of src/data.
import { buildJourney, buildVersionStack } from '../data/mockJourneys';
import {
  LayoutGridIcon,
  ListIcon,
  TableIcon,
  SearchIcon,
  CheckIcon,
  MinusIcon,
  UserIcon,
  CalendarIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronsUpDownIcon,
  ListFilterIcon,
  XIcon,
  LoaderIcon,
  MoreHorizontalIcon,
  SparklesIcon,
  ClipboardIcon,
  ShareIcon,
  EyeIcon,
  InfoIcon,
  BellIcon,
  StarIcon,
  LinkIcon,
  FilesIcon,
  MessageSquareIcon,
  BriefcaseIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  UploadIcon,
  DownloadIcon,
  SendIcon,
  ClockIcon
} from
  'lucide-react';
import { useViewer } from '../contexts/ViewerContext';
import type { ViewerTarget } from '../types/viewer';
import { useClipboard } from '../contexts/ClipboardContext';
import { useBriefcase } from '../contexts/BriefcaseContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useScope } from '../contexts/ScopeContext';
import { useDensity } from '../contexts/DensityContext';
import type { Density } from '../contexts/DensityContext';
import { useUserPref } from '../hooks/useUserPref';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isPlaceholder, isOverdue } from '../types/document';
import type { Document, DocumentStatus, DocumentType, Folder } from '../types/document';
type SortDirection = 'asc' | 'desc' | null;
type ColumnKey = string;

interface ColumnFilter {
  column: ColumnKey;
  value: string;
  sortDirection: SortDirection;
}

function GridWithStickyScrollbar({
  documents,
  highlightedDocId,
  onOpenDocument
}: {
  documents: Document[];
  highlightedDocId: string | null;
  onOpenDocument: (doc: Document) => void;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const syncRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);

  // Update the spacer width to match the grid's scrollWidth so the
  // bottom scrollbar reflects the full horizontal range. Also compute
  // and set the fixed scrollbar's left/width to align with the grid
  // container, and only show it when overflow exists.
  const updateSpacerAndPosition = useCallback(() => {
    const grid = gridRef.current;
    const spacer = spacerRef.current;
    const sync = syncRef.current;
    if (!grid || !spacer || !sync) return;

    // spacer width equals scrollWidth so the scrollbar range is correct
    spacer.style.width = `${grid.scrollWidth}px`;

    // determine if horizontal overflow exists
    const hasOverflow = grid.scrollWidth > grid.clientWidth + 1;

    // hide the grid's native horizontal scrollbar when we show the
    // omnipresent fixed scrollbar; allow programmatic scrollLeft.
    grid.style.overflowX = hasOverflow ? 'hidden' : 'auto';

    // position the fixed scrollbar to align with grid's visible rect
    const rect = grid.getBoundingClientRect();
    // ensure sync element matches grid's left and width
    sync.style.left = `${rect.left}px`;
    sync.style.width = `${rect.width}px`;

    // show or hide based on overflow
    sync.style.display = hasOverflow ? 'block' : 'none';
  }, []);

  useEffect(() => {
    updateSpacerAndPosition();
    const ro = new ResizeObserver(updateSpacerAndPosition);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener('resize', updateSpacerAndPosition);
    window.addEventListener('scroll', updateSpacerAndPosition, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSpacerAndPosition);
      window.removeEventListener('scroll', updateSpacerAndPosition);
    };
  }, [updateSpacerAndPosition]);

  // Sync scroll positions between the visible grid container and the
  // fixed scrollbar element.
  useEffect(() => {
    const grid = gridRef.current;
    const sync = syncRef.current;
    if (!grid || !sync) return;

    let raf = 0;
    const onGridScroll = () => {
      // throttle to animation frames
      raf = requestAnimationFrame(() => {
        if (sync) sync.scrollLeft = grid.scrollLeft;
      });
    };
    const onSyncScroll = () => {
      raf = requestAnimationFrame(() => {
        if (grid) grid.scrollLeft = sync.scrollLeft;
      });
    };

    grid.addEventListener('scroll', onGridScroll, { passive: true });
    sync.addEventListener('scroll', onSyncScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      grid.removeEventListener('scroll', onGridScroll);
      sync.removeEventListener('scroll', onSyncScroll);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={gridRef}
        className="overflow-x-auto pb-3"
        style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Size columns by available space (auto-fill/minmax) rather than viewport
            breakpoints: cards keep a usable min width so previews never collapse
            when the content panel is narrow (the synced scrollbar handles overflow),
            and large monitors get more columns automatically. */}
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {documents.map((doc) => (
            <div key={doc.id}>
              <DocumentCard document={doc} isHighlighted={highlightedDocId === doc.id} onOpen={onOpenDocument} />
            </div>
          ))}
        </div>
      </div>

      {/* Fixed (viewport) scrollbar synced to the grid so the horizontal
          scrollbar remains visible while vertically scrolling the page.
          We position a fixed element over the viewport bottom that is
          aligned to the grid's visible rect and keep its spacer width in
          sync with the grid's scrollWidth. */}
      <div
        ref={syncRef}
        className="overflow-x-auto bg-transparent"
        style={{ position: 'fixed', bottom: '12px', left: 0, right: 0, height: 12, zIndex: 9999, pointerEvents: 'auto' }}>
        <div ref={spacerRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}


// Table density (Comfy/Compact) is now a global preference (useDensity / data-density),
// so the browser only chooses the layout shape here.
type ViewMode = 'grid' | 'list' | 'table';

const TABLE_PREFERENCES_STORAGE_KEY = 'flux.documentBrowser.tablePreferences';
const COLUMN_PREFERENCES_STORAGE_KEY = 'flux.documentBrowser.columnPrefs';
const NON_GROUPABLE_COLUMN_KEYS = new Set<ColumnKey>(['id', 'title']);
/** Available in the column chooser but off until the user asks for them. */
const DEFAULT_HIDDEN_COLUMN_KEYS = new Set<ColumnKey>(['responsibleParty']);

interface TableViewPreferences {
  groupByColumn: ColumnKey | null;
}

interface GroupedDocumentSection {
  key: string;
  label: string;
  documents: Document[];
}

function loadTableViewPreferences(): TableViewPreferences {
  if (typeof window === 'undefined') {
    return { groupByColumn: null };
  }

  try {
    const saved = window.localStorage.getItem(TABLE_PREFERENCES_STORAGE_KEY);

    if (!saved) {
      return { groupByColumn: null };
    }

    const parsed = JSON.parse(saved) as Partial<TableViewPreferences>;

    return {
      groupByColumn: typeof parsed.groupByColumn === 'string' ? parsed.groupByColumn : null
    };
  } catch {
    return { groupByColumn: null };
  }
}

function saveTableViewPreferences(preferences: TableViewPreferences) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TABLE_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

function loadColumnPreferences() {
  if (typeof window === 'undefined') return { order: null as string[] | null, widths: {} as Record<string, number> };
  try {
    const raw = window.localStorage.getItem(COLUMN_PREFERENCES_STORAGE_KEY);
    if (!raw) return { order: null, widths: {} };
    const parsed = JSON.parse(raw);
    return { order: Array.isArray(parsed.order) ? parsed.order : null, widths: parsed.widths || {} };
  } catch {
    return { order: null, widths: {} };
  }
}

function saveColumnPreferences(order: string[], widths: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLUMN_PREFERENCES_STORAGE_KEY, JSON.stringify({ order, widths }));
  } catch {
    return;
  }
}

function getDocumentColumnText(document: Document, columnKey: ColumnKey) {
  const value = document[columnKey];

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return '';
}

// Placeholder rows keep the same height and rhythm as content rows — the cues are
// the dashed icon, the chip and the em-dashes (all shared with the card view via
// DocumentCard). Row background is deliberately untouched so the selection /
// active-row / panel-open states in renderDocumentRow keep winning.

/** Column keys whose value comes from the file itself — meaningless until content
 *  is uploaded, so placeholders render an em-dash rather than a blank cell. */
const CONTENT_DERIVED_COLUMN_KEYS = new Set<ColumnKey>(['fileType', 'fileSize']);

function getGroupLabel(value: string, unassignedLabel: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : unassignedLabel;
}

function ViewModeDropdown({
  viewMode,
  onViewModeChange



}: { viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void; }) {
  const { t } = useLocalization();
  const { density, setDensity } = useDensity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Density (Comfortable/Compact) is a global preference, but its control lives
  // here in the view-options dropdown alongside the layout choices.
  const densityOptions: { id: Density; label: string }[] = [
    { id: 'comfortable', label: t('documentBrowser.viewModes.comfyTable') },
    { id: 'compact', label: t('documentBrowser.viewModes.compactTable') },
  ];
  const viewOptions: {
    mode: ViewMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
      {
        mode: 'table',
        label: t('documentBrowser.viewModes.table'),
        icon: <TableIcon size={16} />
      },
      {
        mode: 'grid',
        label: t('documentBrowser.viewModes.grid'),
        icon: <LayoutGridIcon size={16} />
      },
      {
        mode: 'list',
        label: t('documentBrowser.viewModes.list'),
        icon: <ListIcon size={16} />
      }];

  const currentView =
    viewOptions.find((v) => v.mode === viewMode) || viewOptions[0];
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    // Escape closes the dropdown for keyboard users (WCAG 2.1.2).
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Change view mode (current: ${currentView.label})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 px-2.5 h-7 border border-neutral-200 text-xs font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent transition-all">
        {currentView.icon}
      </button>

      <AnimatePresence>
        {isOpen &&
          <motion.div
            initial={{
              opacity: 0,
              y: -4
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              y: -4
            }}
            transition={{
              duration: 0.15
            }}
            className="absolute top-full right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">

            <div className="p-2">
              {viewOptions.map((option) =>
                <button
                  key={option.mode}
                  onClick={() => {
                    onViewModeChange(option.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${viewMode === option.mode ? 'bg-[#E8F1FB] text-[#2A5FB8] font-medium' : 'text-neutral-700 hover:bg-neutral-50'}`}>

                  {option.icon}
                  {option.label}
                </button>
              )}

              {/* Density — global Comfortable/Compact preference */}
              <div className="my-1 border-t border-neutral-100" />
              <div className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {t('appearance.densityTitle')}
              </div>
              {densityOptions.map((opt) =>
                <button
                  key={opt.id}
                  onClick={() => {
                    setDensity(opt.id);
                    setIsOpen(false);
                  }}
                  aria-pressed={density === opt.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${density === opt.id ? 'bg-[#E8F1FB] text-[#2A5FB8] font-medium' : 'text-neutral-700 hover:bg-neutral-50'}`}>

                  <TableIcon size={16} />
                  {opt.label}
                </button>
              )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

function ClipboardStackIcon({
  active,
  size = 14
}: {
  active: boolean;
  size?: number;
}) {
  const stroke = '#6B7280';
  const activeGreen = '#16A34A';
  const color = active ? activeGreen : stroke;

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4" y="3.5" width="8" height="10" rx="1.5" stroke={color} strokeWidth="1.2" fill={active ? '#DCFCE7' : 'none'} />
      <rect x="5.5" y="2" width="5" height="2.5" rx="1" stroke={color} strokeWidth="1.2" fill="white" />
      <path d="M6 7h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 9.5h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SelectionCheckboxButton({
  checked,
  indeterminate = false,
  onClick,
  ariaLabel,
  className = ''
}: {
  checked: boolean;
  indeterminate?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      className={`inline-flex h-[var(--checkbox-size)] w-[var(--checkbox-size)] items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30 ${checked || indeterminate
        ? 'border-[#0461BA] bg-[#E8F1FB] text-[#0461BA]'
        : 'border-neutral-300 bg-white text-transparent hover:border-[#0461BA]'
        } ${className}`}
    >
      {indeterminate ? <MinusIcon size={14} strokeWidth={2.5} /> : checked ? <CheckIcon size={14} strokeWidth={2.5} /> : null}
    </button>
  );
}

interface ColumnHeaderDropdownProps {
  column: ColumnKey;
  label: string;
  filter: ColumnFilter | undefined;
  onFilterChange: (column: ColumnKey, value: string) => void;
  onSortChange: (column: ColumnKey, direction: SortDirection) => void;
  onClearFilter: (column: ColumnKey) => void;
}

/**
 * Column header cell with inline sort-cycling and a hover-revealed filter popover.
 *
 * Interactions
 * ─────────────
 * • Click the label text → cycles sort: none → asc → desc → none (no popup needed)
 * • Click the funnel icon → opens a compact popover with sort toggle pills + filter input
 *
 * Visual state
 * ─────────────
 * • Unsorted : faint ⇅ icon that brightens on hover
 * • Sorted   : ↑ or ↓ in brand blue, label also blue
 * • Filtered : funnel icon is always visible and blue; a filled dot sits beside it
 */
function ColumnHeaderDropdown({
  column,
  label,
  filter,
  onFilterChange,
  onSortChange,
  onClearFilter,
}: ColumnHeaderDropdownProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState(filter?.value ?? '');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep local input in sync if an external clear is applied
  useEffect(() => { setFilterValue(filter?.value ?? ''); }, [filter?.value]);

  // Close popover on outside click or Escape (WCAG 2.1.2)
  useEffect(() => {
    if (!filterOpen) return;
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setFilterOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setFilterOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [filterOpen]);

  const sortDir   = filter?.sortDirection ?? null;
  const hasFilter = !!filter?.value;
  const hasAny    = hasFilter || !!sortDir;

  // Click label → cycle sort none→asc→desc→none
  const cycleSort = () => {
    const next: SortDirection = !sortDir ? 'asc' : sortDir === 'asc' ? 'desc' : null;
    onSortChange(column, next);
  };

  // Toggle one sort direction (clicking the active one clears it)
  const toggleSort = (dir: 'asc' | 'desc') =>
    onSortChange(column, sortDir === dir ? null : dir);

  return (
    <div className="relative group flex items-center gap-1 min-w-0" ref={wrapperRef}>

      {/* ── Sort-cycling label ── */}
      <button
        type="button"
        onClick={cycleSort}
        className={`flex items-center gap-1 font-semibold text-xs uppercase tracking-wider transition-colors min-w-0 ${
          sortDir ? 'text-[#0461BA]' : 'text-neutral-600 hover:text-neutral-900'
        }`}
        title={`Click to sort by ${label}`}
        aria-label={`Sort by ${label}${sortDir ? ` (currently ${sortDir === 'asc' ? 'ascending' : 'descending'})` : ''}`}
      >
        <span className="truncate">{label}</span>

        {sortDir === 'asc'  && <ArrowUpIcon   size={11} strokeWidth={2.5} className="shrink-0" />}
        {sortDir === 'desc' && <ArrowDownIcon  size={11} strokeWidth={2.5} className="shrink-0" />}
        {!sortDir && (
          <ChevronsUpDownIcon
            size={10}
            className="shrink-0 opacity-20 group-hover:opacity-50 transition-opacity"
          />
        )}
      </button>

      {/* ── Filter trigger ── */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setFilterOpen(v => !v); }}
        title={`Filter ${label}`}
        aria-label={`Filter ${label}`}
        aria-haspopup="dialog"
        aria-expanded={filterOpen}
        className={`shrink-0 rounded transition-all duration-150 ${
          hasFilter
            ? 'opacity-100 text-[#0461BA]'
            : 'opacity-0 group-hover:opacity-35 hover:!opacity-80 focus-visible:opacity-80 text-neutral-500'
        }`}
      >
        <ListFilterIcon size={12} strokeWidth={hasFilter ? 2.5 : 1.5} />
      </button>

      {/* Active-filter dot */}
      {hasFilter && (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#0461BA]" />
      )}

      {/* ── Compact popover ── */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -5, scale: 0.96 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Sort pills — icon-only, toggle on click */}
            <div className="flex gap-1.5 p-2 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => toggleSort('asc')}
                title="Sort A → Z"
                aria-label={`Sort ${label} ascending`}
                aria-pressed={sortDir === 'asc'}
                className={`flex-1 flex items-center justify-center h-7 rounded-lg transition-colors ${
                  sortDir === 'asc'
                    ? 'bg-[#E8F1FB] text-[#0461BA] ring-1 ring-[#0461BA]/25'
                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700'
                }`}
              >
                <ArrowUpIcon size={13} strokeWidth={sortDir === 'asc' ? 2.5 : 1.5} />
              </button>

              <button
                type="button"
                onClick={() => toggleSort('desc')}
                title="Sort Z → A"
                aria-label={`Sort ${label} descending`}
                aria-pressed={sortDir === 'desc'}
                className={`flex-1 flex items-center justify-center h-7 rounded-lg transition-colors ${
                  sortDir === 'desc'
                    ? 'bg-[#E8F1FB] text-[#0461BA] ring-1 ring-[#0461BA]/25'
                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700'
                }`}
              >
                <ArrowDownIcon size={13} strokeWidth={sortDir === 'desc' ? 2.5 : 1.5} />
              </button>
            </div>

            {/* Filter input */}
            <div className="p-2 pb-1.5">
              <div className="relative">
                <SearchIcon
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder={`Filter…`}
                  aria-label={`Filter ${label}`}
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    onFilterChange(column, e.target.value);
                  }}
                  className="w-full pl-7 pr-6 py-1.5 text-xs bg-[#F8FAFC] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:border-transparent focus:bg-white transition-colors"
                  autoFocus
                />
                {filterValue && (
                  <button
                    onClick={() => { setFilterValue(''); onFilterChange(column, ''); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <XIcon size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Clear everything — shown only when sort or filter is active */}
            {hasAny && (
              <div className="px-2 pb-2">
                <button
                  onClick={() => {
                    setFilterValue('');
                    onClearFilter(column);
                    onSortChange(column, null);
                    setFilterOpen(false);
                  }}
                  title="Clear sort and filter"
                  className="w-full flex items-center justify-center gap-1 h-6 rounded-lg text-[11px] text-neutral-400 hover:text-red-500 hover:bg-red-50 border border-dashed border-neutral-200 hover:border-red-200 transition-colors"
                >
                  <XIcon size={10} />
                  <span>clear</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
const ITEMS_PER_PAGE = 20;
// Stable empty references so hooks/memos don't re-run while queries are loading.
const EMPTY_FOLDERS: Folder[] = [];
// How long the properties sidebar trails the active row. Holding an arrow key
// walks the cursor at the OS repeat rate (~30/s); the sidebar must not rebuild —
// or rewrite the URL, or fetch — once per row skated past. The cursor itself is
// never debounced, so the highlight stays glued to the key.
const ACTIVE_PANEL_DEBOUNCE_MS = 160;
/** DOM id for a row, so the grid container can point `aria-activedescendant` at
 *  it without ever moving real focus onto the row itself. */
const rowDomId = (docId: string) => `docrow-${docId}`;
/** Statically known workspace ids — the ?ws= vocabulary we can vouch for before
 *  the G03 workspace list has loaded, so a deep link is correct on first render. */
const PROJECT_IDS: readonly string[] = PROJECTS.map((p) => p.id);
export function DocumentBrowser() {
  const { t } = useLocalization();
  const { clipboard, addToClipboard, removeFromClipboard, isInClipboard } = useClipboard();
  const { add: addToBriefcase, remove: removeFromBriefcase, isInBriefcase } = useBriefcase();
  const { openViewer } = useViewer();
  const { scope, setScope } = useScope();
  // Deep-linkable view state — ?ws=&folder=&doc= (ADR-010 multi-window). Read
  // before anything derives from it, because the workspace id below does.
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: workspaces } = useWorkspaces();
  const wsParam = searchParams.get('ws');
  // The URL — not ScopeContext — decides which workspace this view queries.
  // ScopeContext is the chrome's idea of "current workspace" and only catches up
  // to ?ws= one effect later (see the sync effect below), so deriving from scope
  // alone made every query on the first render of a cross-workspace deep link ask
  // the *previously persisted* workspace: a guaranteed 404 on the single-document
  // fetch, and a wasted folder-tree + document-list round-trip behind it.
  // Trust the G03 list once it has loaded, the static ids before that, so the
  // first render is already correct for a known workspace.
  const activeProjectId: ProjectId = resolveWorkspaceId(
    wsParam,
    scope,
    workspaces?.map((w) => w.id) ?? PROJECT_IDS,
    'marra-ridge'
  );
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Content axis (placeholder vs has-a-file). '' = both, which is the default:
  // outstanding deliverables are the point, so they are visible without opting in.
  const [contentState, setContentState] = useState<ContentStateFilter>('');
  // 'table' is the only table mode now — density (Compact/Comfortable) replaced
  // the separate compact-table view. Sorting stays server-side (no sortBy state).
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [leftPanelMode, setLeftPanelMode] = useState<'filter' | 'folder'>(
    'folder'
  );
  // Folder/filter panel open state, persisted like the Chat history sidebar
  // (chat.historyOpen). Defaults to OPEN — unlike Chat, this panel is the
  // page's primary navigation.
  const [leftPanelOpen, setLeftPanelOpen] = useUserPref<boolean>('docBrowser.treeOpen', true);
  const navigate = useNavigate();
  const activeRailItem = 'documents';
  // Folder tree over HTTP (G05, MSW-served in the prototype). Each workspace has
  // its own tree — switching projects in the banner refetches it.
  const foldersQuery = useFolderTree(activeProjectId);
  const projectFolders = foldersQuery.data ?? EMPTY_FOLDERS;

  // `folder`/`doc` are DERIVED from the URL (validated below against the loaded
  // tree), never copied into useState, so refresh/second-window restore is free
  // and a workspace switch simply invalidates a stale folder param.
  // (searchParams / workspaces are read above — activeProjectId depends on them.)
  const highlightedDocId = searchParams.get('doc');

  // ── Two independent row axes (new Outlook's message list) ───────────────────
  // NEITHER is derived from the other, and that is the whole point: "the row I am
  // looking at" and "the rows I am about to act on" are different questions, and
  // a grid that answers them with one piece of state cannot express "preview this
  // one while those five stay selected". So:
  //   checked (a set)   → bulk action bar, and the sidebar collapse rule below
  //   active  (one id)  → the roving cursor that drives the properties sidebar
  // Ticking a box never moves the cursor; moving the cursor never ticks a box.
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  // Anchor for contiguous ranges (Shift+Click / Shift+Arrow): the last row the
  // user deliberately landed on or ticked — not necessarily the active row.
  const selectionAnchorRef = useRef<string | null>(null);
  const checkedCount = selectedDocumentIds.size;
  // The sidebar can only ever describe ONE document, so above one checked row
  // there is no single subject to describe and it collapses. Two checked rows is
  // the threshold, not one: a single tick is still a bulk selection of size one,
  // and hiding the preview then would punish the user for starting one.
  const sidebarCollapsed = checkedCount >= 2;
  // Separate from the collapse rule: this is the *user's* dismiss (the panel X).
  // It deliberately does not clear activeDocId — losing your place in the list
  // because you closed a panel is the Outlook focus bug in another costume. Any
  // subsequent click or arrow press clears it.
  const [panelDismissed, setPanelDismissed] = useState(false);
  // The subject of the sidebar: activeDocId, trailing it by one debounce.
  const [panelDocId, setPanelDocId] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setPanelDocId(activeDocId), ACTIVE_PANEL_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [activeDocId]);

  // Cross-workspace deep link (e.g. from enterprise search): ?ws= switches scope
  // once the G03 workspace list has loaded.
  useEffect(() => {
    const ws = searchParams.get('ws');
    if (!ws || !workspaces) return;
    if (scope.kind === 'project' && scope.id === ws) return;
    const workspace = workspaces.find((w) => w.id === ws);
    if (workspace) setScope({ kind: 'project', id: workspace.id, name: workspace.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, workspaces]);

  // A deep link (?doc= from enterprise search) arrives as a PREVIEW: it seeds the
  // cursor only. It used to seed selectedDocumentIds as well, which meant landing
  // here from search left you holding a one-row bulk selection you never made —
  // exactly the conflation the two axes above exist to prevent.
  //
  // The param is now two-way (the sync effect below writes the cursor into it), so
  // this has to ignore its own echo. It cannot simply compare against activeDocId:
  // the URL trails the cursor by one debounce, so mid-arrow the two legitimately
  // disagree and seeding on that difference would drag the cursor backwards to the
  // row the user just left. Only a value we did NOT write is a real deep link.
  const urlDocWrittenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!highlightedDocId || highlightedDocId === urlDocWrittenRef.current) return;
    urlDocWrittenRef.current = highlightedDocId;
    setActiveDocId(highlightedDocId);
    // Skip the debounce — a deep link should not open blank for 160ms.
    setPanelDocId(highlightedDocId);
  }, [highlightedDocId]);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openActionSubmenuKey, setOpenActionSubmenuKey] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  // Polite announcement for the one thing that moves without the user touching it:
  // the sidebar opening or closing because the checked count crossed the "one
  // subject" boundary. Same aria-live pattern as the Chat transcript.
  const [liveMessage, setLiveMessage] = useState('');
  // [MOCK] Panel width persisted via useUserPref — swaps to Oracle preferences API when available.
  // [API] G02:GET /user/preferences/docBrowser.panelWidth
  const [panelWidth, setPanelWidth] = useUserPref<number>('docBrowser.panelWidth', 360);
  const panelResizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!panelResizingRef.current) return;
      // Panel is on the right; dragging left = wider, right = narrower.
      const next = Math.min(640, Math.max(260, window.innerWidth - e.clientX));
      setPanelWidth(next);
    };
    const onUp = () => {
      if (panelResizingRef.current) {
        panelResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    // setPanelWidth is the useUserPref setter — useCallback(…, []), stable.
  }, [setPanelWidth]);
  const startPanelResize = () => {
    panelResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  // Column chooser dropdown — closes on outside click / Escape (shared handler below).
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const columnChooserRef = useRef<HTMLDivElement>(null);
  // Column filters for table view
  const [columnFilters, setColumnFilters] = useState<
    Map<ColumnKey, ColumnFilter>>(
      new Map());
  // Infinite-scroll sentinel (fetchNextPage is triggered when this scrolls into view)
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [groupByColumn, setGroupByColumn] = useState<ColumnKey | null>(() => loadTableViewPreferences().groupByColumn);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isGroupDropActive, setIsGroupDropActive] = useState(false);

  const [dragTooltipPosition, setDragTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [perGroupDisplayedCounts, setPerGroupDisplayedCounts] = useState<Map<string, number>>(new Map());
  const groupLoadRefs = useRef(new Map<string, HTMLDivElement | null>());
  // Scrollable data container ref for localized scrolling (right-hand panel)
  const dataContainerRef = useRef<HTMLDivElement | null>(null);
  // The focusable grid itself. Real keyboard focus lives here and NOWHERE else —
  // roving focus is simulated with activeDocId + aria-activedescendant. Calling
  // focus() on each row as the cursor moves is what lets focus escape the list
  // into panel/detail content and silently kills further arrow navigation.
  const gridRef = useRef<HTMLTableElement | null>(null);

  const folderLookup = useMemo(() => {
    const map = new Map<string, { id: string; name: string; parentId: string | null; children: string[]; documentCount: number }>();

    const walk = (folders: typeof projectFolders) => {
      folders.forEach((folder) => {
        map.set(folder.id, {
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          children: folder.children.map((child) => child.id),
          documentCount: folder.documentCount
        });
        if (folder.children.length > 0) {
          walk(folder.children);
        }
      });
    };

    walk(projectFolders);
    return map;
  }, [projectFolders]);

  // Selected folder comes straight from the URL, validated against the loaded
  // tree — a stale ?folder= from another workspace resolves to null (All Documents)
  // instead of scoping the grid to a folder that doesn't exist here.
  const folderParam = searchParams.get('folder');
  const selectedFolderId = folderParam && folderLookup.has(folderParam) ? folderParam : null;
  const selectFolder = useCallback((folderId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (folderId) next.set('folder', folderId);
      else next.delete('folder');
      next.delete('doc'); // a doc deep-link doesn't survive changing folder scope
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Server-side sort (G06 ?sort=&order= — ADR-011): the active column sort wins,
  // else newest-modified first. Changing it discards the cursor chain (query key).
  const serverSort = useMemo(() => {
    for (const filter of columnFilters.values()) {
      if (filter.sortDirection) {
        return { sort: filter.column, order: filter.sortDirection };
      }
    }
    return { sort: 'dateModified', order: 'desc' as const };
  }, [columnFilters]);

  // Documents over HTTP (G06, cursor-paginated). Folder subtree scoping, status
  // and type filters run on the server; the subtree expansion that used to live
  // here client-side is now `recursive=true`.
  const {
    documents: projectDocuments,
    totalApprox,
    placeholderApprox,
    isLoading: isDocsLoading,
    isError: isDocsError,
    refetch: refetchDocuments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDocuments(activeProjectId, {
    folderId: selectedFolderId ?? undefined,
    recursive: true,
    status: selectedStatus as DocumentStatus[],
    documentType: selectedDocType as DocumentType[],
    contentState: contentState || undefined,
    sort: serverSort.sort,
    order: serverSort.order,
    // Grouping needs the full result set for correct group subtotals, so it
    // fetches everything in one page. [TODO-ENG] Real grouping over large
    // workspaces needs server-side group aggregation on G06.
    limit: groupByColumn ? 1000 : ITEMS_PER_PAGE,
  });

  const breadcrumbPath = useMemo(() => {
    if (!selectedFolderId) {
      return [] as Array<{ id: string; name: string }>;
    }

    const path: Array<{ id: string; name: string }> = [];
    let currentId: string | null = selectedFolderId;

    while (currentId) {
      const folder = folderLookup.get(currentId);
      if (!folder) {
        break;
      }
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return path;
  }, [selectedFolderId, folderLookup]);
  const handleColumnFilterChange = (column: ColumnKey, value: string) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      const existing = newFilters.get(column);
      newFilters.set(column, {
        column,
        value,
        sortDirection: existing?.sortDirection || null
      });
      return newFilters;
    });
  };
  const handleColumnSortChange = (
    column: ColumnKey,
    direction: SortDirection) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      // Clear sort from other columns
      newFilters.forEach((filter, key) => {
        if (key !== column) {
          newFilters.set(key, {
            ...filter,
            sortDirection: null
          });
        }
      });
      const existing = newFilters.get(column);
      newFilters.set(column, {
        column,
        value: existing?.value || '',
        sortDirection: direction
      });
      return newFilters;
    });
  };
  const handleClearColumnFilter = (column: ColumnKey) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      newFilters.delete(column);
      return newFilters;
    });
  };
  // Client-side residue over the loaded pages: category (tag) chips and per-column
  // text filters. Folder scope, status/type filters and sorting are server-side
  // (see useDocuments above). [TODO-ENG] Move these two to G06 query params as well
  // — tags is not yet in the contract; column text maps to per-field `contains`.
  const filteredDocuments = useMemo(() => {
    let filtered = projectDocuments;
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((doc) =>
        doc.tags.some((tag) =>
          selectedCategories.some(
            (category) => tag.toLowerCase() === category.toLowerCase()
          )
        )
      );
    }
    columnFilters.forEach((filter) => {
      if (filter.value) {
        filtered = filtered.filter((doc) => {
          const value = doc[filter.column as keyof typeof doc];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(filter.value.toLowerCase());
          }
          return true;
        });
      }
    });
    return filtered;
  }, [selectedCategories, columnFilters, projectDocuments]);
  // Infinite scroll: the sentinel asks React Query for the next cursor page (ADR-011).
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  useEffect(() => {
    if (groupByColumn) return; // use per-group sentinels when grouped
    const currentRef = loadMoreRef.current;
    const rootEl = dataContainerRef.current;
    if (!currentRef || !rootEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: rootEl,
        threshold: 0.1
      }
    );
    observer.observe(currentRef);
    return () => {
      observer.disconnect();
    };
  }, [loadMore, viewMode, groupByColumn]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
        setOpenActionSubmenuKey(null);
      }
if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (columnChooserRef.current && !columnChooserRef.current.contains(event.target as Node)) {
        setShowColumnChooser(false);
      }
    };

    // Escape closes the row action menu, export dropdown and column chooser (WCAG 2.1.2).
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenActionMenuId(null);
      setOpenActionSubmenuKey(null);
      setShowExportMenu(false);
      setShowColumnChooser(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const orderedDocuments = useMemo(() => {
    if (!groupByColumn) {
      return filteredDocuments;
    }

    return [...filteredDocuments].sort((a, b) => {
      const aValue = getGroupLabel(getDocumentColumnText(a, groupByColumn), t('documentBrowser.unassigned'));
      const bValue = getGroupLabel(getDocumentColumnText(b, groupByColumn), t('documentBrowser.unassigned'));
      return aValue.localeCompare(bValue);
    });
  }, [filteredDocuments, groupByColumn, t]);
  // Every loaded (cursor-paged) row renders; the server decides page boundaries.
  const displayedDocuments = orderedDocuments;
  // Build grouped sections from the full orderedDocuments so subtotals
  // reflect the true totals even when lazy-loading per-group items.
  const groupedSections = useMemo<GroupedDocumentSection[]>(() => {
    if (!groupByColumn) {
      return [];
    }

    const sectionMap = new Map<string, GroupedDocumentSection>();

    orderedDocuments.forEach((document) => {
      const label = getGroupLabel(getDocumentColumnText(document, groupByColumn), t('documentBrowser.unassigned'));
      const key = `${groupByColumn}:${label}`;
      const existingSection = sectionMap.get(key);

      if (existingSection) {
        existingSection.documents.push(document);
        return;
      }

      sectionMap.set(key, {
        key,
        label,
        documents: [document]
      });
    });

    return Array.from(sectionMap.values());
  }, [orderedDocuments, groupByColumn, t]);
  // Group collapse now handled synchronously when the user drops a column.

  // Observe per-group load sentinels to lazy-load more items for each
  // expanded group as the user scrolls inside that group.
  useEffect(() => {
    if (!groupedSections || groupedSections.length === 0) return;
    const observers: IntersectionObserver[] = [];

    groupedSections.forEach((section) => {
      const el = groupLoadRefs.current.get(section.key);
      if (!el) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setPerGroupDisplayedCounts((prev) => {
            const next = new Map(prev);
            const cur = next.get(section.key) ?? ITEMS_PER_PAGE;
            const updated = Math.min(cur + ITEMS_PER_PAGE, section.documents.length);
            next.set(section.key, updated);
            return next;
          });
        });
      }, { root: dataContainerRef.current ?? null, threshold: 0.1 });

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [groupedSections]);
  const hasMore = hasNextPage ?? false;
  const hasActiveColumnFilters = columnFilters.size > 0 && [...columnFilters.values()].some(f => f.value);
  // Header count: the server's totalApprox (ADR-011) unless a client-side filter
  // (tags / column text) is narrowing the loaded pages, in which case only the
  // locally visible count is truthful.
  // Two numbers, matching the folder tree: "documents" means records with content,
  // placeholders are reported alongside so neither figure overstates the other.
  const isClientFiltered = selectedCategories.length > 0 || hasActiveColumnFilters;
  const placeholderCount = isClientFiltered
    ? filteredDocuments.filter(isPlaceholder).length
    : (placeholderApprox ?? filteredDocuments.filter(isPlaceholder).length);
  const documentCount = (isClientFiltered
    ? filteredDocuments.length
    : (totalApprox ?? filteredDocuments.length)) - placeholderCount;
  const allDisplayedSelected =
    displayedDocuments.length > 0 &&
    displayedDocuments.every((doc) => selectedDocumentIds.has(doc.id));
  const hasSomeDisplayedSelected =
    displayedDocuments.some((doc) => selectedDocumentIds.has(doc.id));

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedDocumentIds(new Set());
    selectionAnchorRef.current = null;
  };

  const toggleSelectAllDisplayed = () => {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      if (allDisplayedSelected) {
        displayedDocuments.forEach((doc) => next.delete(doc.id));
      } else {
        displayedDocuments.forEach((doc) => next.add(doc.id));
      }
      return next;
    });
  };

  // Ordered list of the rows the user can actually navigate (visible order,
  // skipping collapsed groups). Drives arrow-key movement and Shift-range.
  const navigableDocs = useMemo<Document[]>(() => {
    if (groupByColumn) {
      const out: Document[] = [];
      groupedSections.forEach((section) => {
        if (collapsedGroups.has(section.key)) return;
        const perCount = perGroupDisplayedCounts.get(section.key) ?? ITEMS_PER_PAGE;
        out.push(...section.documents.slice(0, perCount));
      });
      return out;
    }
    return displayedDocuments;
  }, [groupByColumn, groupedSections, collapsedGroups, perGroupDisplayedCounts, displayedDocuments]);

  // Add every id between two rows (inclusive) to the selection — Shift+click / Shift+Arrow.
  const selectRange = (fromId: string, toId: string) => {
    const ids = navigableDocs.map((d) => d.id);
    const a = ids.indexOf(fromId);
    const b = ids.indexOf(toId);
    if (a === -1 || b === -1) return;
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      for (let i = lo; i <= hi; i++) next.add(ids[i]);
      return next;
    });
  };

  const scrollRowIntoView = (docId: string) => {
    const container = dataContainerRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-doc-id="${CSS.escape(docId)}"]`);
    if (!container || !el) return;
    el.scrollIntoView({ block: 'nearest' });
    // 'nearest' counts a row as visible as soon as it is inside the scroll port —
    // but the column header is sticky and paints over the top of it, so arrowing
    // upward (and Home in particular) parks the active row *underneath* the
    // headers and it reads as having vanished. Nudge back by the overlap.
    const header = container.querySelector('thead');
    if (!header) return;
    const overlap = header.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
    if (overlap > 0) container.scrollTop -= overlap;
  };

  /** Move the cursor. Never touches the checked set — every caller here is a
   *  navigation gesture, and navigation must be free of side effects on what a
   *  bulk action would hit. Clears a manual dismiss: arrowing to a new row is a
   *  request to see it. */
  const moveActiveTo = (docId: string) => {
    setActiveDocId(docId);
    setPanelDismissed(false);
    scrollRowIntoView(docId);
  };

  /** Extend the checked range from the anchor to `docId`, seeding the anchor from
   *  the cursor when there isn't one yet so Shift+click works as a first action. */
  const extendSelectionTo = (docId: string) => {
    const anchor = selectionAnchorRef.current ?? activeDocId ?? docId;
    selectionAnchorRef.current = anchor;
    selectRange(anchor, docId);
  };

  // ── Pointer model ───────────────────────────────────────────────────────────
  // Row body, no modifier → "show me this one": moves the cursor, ticks nothing.
  // Ctrl/Cmd+click        → "add this to what I'm acting on": ticks, cursor still.
  // Shift+click           → extends the ticked range, cursor still.
  const handleRowClick = (doc: Document, e: React.MouseEvent) => {
    if (e.shiftKey) {
      extendSelectionTo(doc.id);
    } else if (e.ctrlKey || e.metaKey) {
      toggleDocumentSelection(doc.id);
      selectionAnchorRef.current = doc.id;
    } else {
      previewDocument(doc);
      // A plain click is the "last row I deliberately landed on", so it becomes
      // the anchor a later Shift+click ranges from.
      selectionAnchorRef.current = doc.id;
    }
    // Focus returns to the grid, not the row, so arrow keys keep working after a
    // click — and so a click never steals focus into the row's action buttons.
    gridRef.current?.focus({ preventScroll: true });
  };

  // The checkbox is the bulk-action axis alone: it never moves the cursor and
  // never changes what the sidebar is showing.
  const handleCheckboxClick = (doc: Document, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) {
      extendSelectionTo(doc.id);
      return;
    }
    toggleDocumentSelection(doc.id);
    selectionAnchorRef.current = doc.id;
  };

  // ── Keyboard model, on the grid container ───────────────────────────────────
  // Arrow/Home/End move the cursor only. Space ticks the cursor row. Enter opens
  // the document. Ctrl/Cmd+A selects all. Shift+Arrow / Shift+Home / Shift+End
  // extend the ticked range — the only keys that touch both axes, and only
  // because the user asked with a modifier.
  const handleListKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    // Typing in a column filter or search box is not grid navigation.
    if (target.closest('input, textarea, [contenteditable="true"]')) return;
    const ids = navigableDocs.map((d) => d.id);

    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      // "Select all docs" = the whole filtered set, not just the lazy-loaded slice.
      setSelectedDocumentIds(new Set(orderedDocuments.map((d) => d.id)));
      return;
    }

    if (ids.length === 0) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const curIdx = activeDocId ? ids.indexOf(activeDocId) : -1;
      // End lands on the last row currently in the list, not the last document in
      // the workspace — under cursor pagination (ADR-011) the rest isn't loaded yet.
      let nextIdx: number;
      if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = ids.length - 1;
      } else if (curIdx === -1) {
        // Nothing active yet — the first arrow press lands on the first row
        // rather than doing nothing.
        nextIdx = 0;
      } else {
        nextIdx = e.key === 'ArrowDown'
          ? Math.min(curIdx + 1, ids.length - 1)
          : Math.max(curIdx - 1, 0);
      }
      const nextId = ids[nextIdx];
      moveActiveTo(nextId);
      if (e.shiftKey) extendSelectionTo(nextId);
      return;
    }

    if (e.key === 'Enter') {
      // This handler bubbles from the table, so it runs BEFORE the browser
      // activates a focused control — without this guard, preventDefault below
      // swallows Enter on the row action menu, the reference link, a column sort
      // header or the select-all checkbox, and opens the viewer instead.
      if (target.closest('button, a')) return;
      e.preventDefault();
      // Enter is the step *past* preview: the sidebar is already showing this
      // row's properties, so Enter opens the document itself in the framed
      // viewer. A placeholder has no file in the content store, so there is
      // nothing to open — the row's View action is disabled for the same reason.
      const doc = navigableDocs.find((d) => d.id === activeDocId);
      if (doc && !isPlaceholder(doc)) openViewer(toViewerTarget(doc));
      return;
    }

    if (e.key === ' ' || e.key === 'Spacebar') {
      if (target.closest('button')) return; // a focused checkbox handles its own Space
      e.preventDefault();
      if (activeDocId) {
        toggleDocumentSelection(activeDocId);
        selectionAnchorRef.current = activeDocId;
      }
    }
  };

  /** Everything the framed viewer needs. The page raster stands in for the
   *  rendered PDF the real Apryse viewer would load over G07. */
  const toViewerTarget = (doc: Document): ViewerTarget => ({
    docId: doc.id,
    title: doc.title,
    revision: doc.revisionNumber,
    project: doc.project,
    fileType: doc.fileType,
    pageImage: doc.thumbnail || undefined,
  });

  const toDocumentDetail = (doc: Document): DetailPanelData => {
    const placeholder = isPlaceholder(doc);
    return {
      objectType: 'document',
      objectId: doc.id,
      docId: doc.id,
      title: doc.title,
      project: doc.project,
      status: doc.status,
      revision: String(doc.revisionNumber),
      author: doc.author,
      dateModified: doc.dateModified,
      dateCreated: doc.dateCreated,
      // A placeholder has no file, so no filetype/size is asserted — the demo
      // fallbacks below would otherwise claim a 2.4 MB PDF that doesn't exist.
      fileType: placeholder ? '' : 'PDF',
      fileSize: placeholder ? '' : (doc.fileSize || '2.4 MB'),
      contentState: doc.contentState,
      dateExpected: doc.dateExpected,
      responsibleParty: doc.responsibleParty,
      pageImage: doc.thumbnail || undefined,
      // [MOCK] Journey + version stack are derived client-side from the document.
      // [TODO-ENG] Both come from the server in production — the history/audit
      // trail and G06 revisions. See src/data/mockJourneys.ts.
      journey: buildJourney(doc),
      versions: buildVersionStack(doc),
      description: doc.description,
    };
  };

  /** Every "open the properties" affordance — the reference link, the row action
   *  menu, a grid/list card — now just moves the cursor. The sidebar follows the
   *  cursor and the ?doc= param follows the sidebar, so there is one source of
   *  truth instead of three places pushing snapshots into the panel. Clears a
   *  manual dismiss: asking explicitly to see properties must reopen the panel. */
  const previewDocument = (doc: Document) => {
    setActiveDocId(doc.id);
    // An explicit open shouldn't wait out the arrow-key debounce.
    setPanelDocId(doc.id);
    setPanelDismissed(false);
  };
  const dismissDetailPanel = () => setPanelDismissed(true);

  // ── What the properties sidebar is describing ───────────────────────────────
  // Derived from the (debounced) cursor, never stored: the panel showing something
  // other than the active row was the old bug class this replaces.
  const panelDocFromRows = useMemo(
    () => (panelDocId ? orderedDocuments.find((d) => d.id === panelDocId) : undefined),
    [panelDocId, orderedDocuments]
  );

  // [API] G06:GET /workspaces/{wsId}/documents/{docId} — resolves a doc the list
  // hasn't got, because under cursor pagination (ADR-011) a deep-linked row may
  // not be in the loaded pages. Row highlight stays best-effort.
  // Gated on the row lookup FAILING, not merely on a doc being previewed: arrowing
  // through loaded rows must never touch the network, and now that the cursor
  // feeds the panel it would otherwise fire once per row.
  // [TODO-ENG] If "scroll to the deep-linked row" becomes a requirement, G06 needs
  // a seek/around parameter — decide with engineering.
  // The workspace race this used to guard against is gone: activeProjectId now
  // derives from ?ws= synchronously, so it is never briefly the persisted
  // workspace. What remains is the case the derive cannot resolve — an unknown
  // ?ws= — where falling back to the persisted workspace would ask it for a
  // document that lives elsewhere, i.e. a guaranteed 404. Wait instead; if the G03
  // list later vouches for the id, the resolve succeeds and this fetch proceeds.
  const canFetchPanelDoc = urlWorkspaceHonoured(wsParam, activeProjectId);
  const { data: fetchedPanelDoc } = useQuery({
    queryKey: queryKeys.document(activeProjectId, panelDocId ?? ''),
    queryFn: () => getDocument(activeProjectId, panelDocId!),
    enabled: !!panelDocId && !panelDocFromRows && canFetchPanelDoc,
  });

  // React Query hands back the *previous* doc while a new key resolves, so the id
  // is checked before trusting it — otherwise a deep link briefly shows the wrong
  // document's properties.
  const panelDoc = panelDocFromRows ?? (fetchedPanelDoc?.id === panelDocId ? fetchedPanelDoc : undefined);
  // toDocumentDetail runs buildJourney + buildVersionStack, so it is memoised on
  // the document rather than re-derived on every render of a 137 KB page.
  const panelData = useMemo<DetailPanelData | null>(
    () => (panelDoc ? toDocumentDetail(panelDoc) : null),
    // toDocumentDetail is a pure mapper re-created each render; keying the memo on
    // it would defeat the memo entirely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panelDoc]
  );

  // The URL follows the preview — ADR-010 makes the URL the shareable view state,
  // so "the row I'm looking at" belongs in it. Written from the debounced id with
  // replace:true, so holding an arrow key neither stacks history entries nor
  // rewrites the param once per row.
  useEffect(() => {
    if ((panelDocId ?? null) === (searchParams.get('doc') ?? null)) return;
    // Claim this value so the seeding effect above recognises the echo.
    urlDocWrittenRef.current = panelDocId;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (panelDocId) next.set('doc', panelDocId);
      else next.delete('doc');
      return next;
    }, { replace: true });
  }, [panelDocId, searchParams, setSearchParams]);

  // Announce only the transitions the user didn't directly ask for: the sidebar
  // collapsing or reopening because the checked count crossed the boundary.
  // Deliberately count-free while collapsed — the message persists in the live
  // region after it's read, and re-announcing on every Shift+Arrow to keep a
  // number current would be noise. The count lives in the bulk bar, and each
  // row's own aria-selected carries its state.
  const prevSidebarCollapsedRef = useRef(false);
  useEffect(() => {
    if (sidebarCollapsed === prevSidebarCollapsedRef.current) return;
    prevSidebarCollapsedRef.current = sidebarCollapsed;
    setLiveMessage(
      sidebarCollapsed
        ? t('documentBrowser.bulk.panelHidden')
        : panelDocId
          ? t('documentBrowser.bulk.panelShown', { id: panelDocId })
          : t('documentBrowser.bulk.panelClosed')
    );
  }, [sidebarCollapsed, panelDocId, t]);

  const selectedDocuments = useMemo(
    () => orderedDocuments.filter((doc) => selectedDocumentIds.has(doc.id)),
    [orderedDocuments, selectedDocumentIds]
  );

  const handleExport = (type: 'visible' | 'all' | 'selected') => {
    const colsToExport = type === 'all' ? allColumns : columns;

    // 1. Generate Header Row
    // Wrapping each heading in quotes and doubling any internal quotes for standard CSV escaping mapping.
    const headerRow = colsToExport.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',') + '\n';

    // 2. Data rows come from the loaded (cursor-paged) items only.
    // [TODO-ENG] Full exports belong server-side (G27 exports) — the client can't
    // see beyond the pages it has fetched under ADR-011.
    const dataRows = (type === 'selected' ? selectedDocuments : filteredDocuments).map(doc => {
      return colsToExport.map(col => {
        let val = getDocumentColumnText(doc, col.key);
        // Properly escape double quotes if text contains them
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
        }
        return `"${val}"`;
      }).join(',');
    }).join('\n');

    // Combine them
    const csvContent = headerRow + dataRows;

    // We prepend the UTF-8 Byte Order Mark (\uFEFF) to the blob payload. 
    // This explicitly tells Excel "Hey, interpret this file as UTF-8!"
    // It properly encodes special characters, AND parses URLs starting with https:// into standard links when opened.
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `documents_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Bulk actions over the checked set ───────────────────────────────────────
  // Only the loaded (cursor-paged) rows can be resolved to documents, which is the
  // same limit Ctrl+A already carries.
  // [TODO-ENG] Server-side bulk operations (G27 exports, G07 content, transmittals)
  // should take the *query* plus the checked ids, not a client-resolved list.
  const bulkAddToClipboard = () => {
    selectedDocuments.forEach((doc) => addToClipboard(doc));
  };
  const bulkAddToBriefcase = () => {
    selectedDocuments.forEach((doc) => addToBriefcase({
      docId: doc.id,
      title: doc.title,
      reference: doc.id,
      revision: doc.revisionNumber,
      status: doc.status,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      author: doc.author,
      projectName: doc.project,
      folderId: doc.folderId,
    }));
  };

  const renderDocumentRow = (doc: Document) => {
    const isChecked = selectedDocumentIds.has(doc.id);
    const isActive = activeDocId === doc.id;
    const placeholder = isPlaceholder(doc);
    const overdue = isOverdue(doc);

    return (
      <tr
        key={doc.id}
        // Referenced by aria-activedescendant on the grid — this is how a screen
        // reader is told which row the cursor is on without focus ever moving here.
        id={rowDomId(doc.id)}
        data-doc-id={doc.id}
        // In a grid, aria-selected means "part of the selection" — the checked set,
        // not the cursor.
        aria-selected={isChecked}
        onClick={(e) => handleRowClick(doc, e)}
        // Two states that can both be true at once, so neither may own the same
        // channel: checked = blue tint + ticked box (what a bulk action will hit),
        // active = lighter tint + a brand ring (what the sidebar is describing).
        className={`transition-colors group cursor-pointer ${
          isChecked
            ? 'bg-[#E8F1FB]'
            : isActive
              ? 'bg-[#F0F6FF]'
              : 'hover:bg-neutral-50'
        } ${isActive ? 'ring-2 ring-inset ring-[#0461BA]' : ''}`}
      >
        <td>
          <SelectionCheckboxButton
            onClick={(e) => handleCheckboxClick(doc, e)}
            checked={isChecked}
            ariaLabel={isChecked ? t('documentBrowser.deselectDocument', { id: doc.id }) : t('documentBrowser.selectDocument', { id: doc.id })}
            // focus:opacity-100 matters for the keyboard-only path: an unchecked
            // box is hover-revealed, and Tab must not land on something invisible.
            className={!isChecked ? 'opacity-0 group-hover:opacity-100 focus:opacity-100' : ''}
          />
        </td>
        {columns.map((col) => {
          const tdStyle = columnWidths[col.key] ? { width: `${columnWidths[col.key]}px`, minWidth: `${Math.max(columnWidths[col.key], 60)}px` } : undefined;
          switch (col.key) {
            case 'id':
              return (
                <React.Fragment key={doc.id + '-cells'}>
                  <td key={col.key} style={tdStyle}>
                    <span className="inline-flex items-center gap-1.5">
                      {/* Filetype icon — same mapping as the grid cards, for a consistent cue.
                          Placeholders have no file, so the slot shows a dashed outline instead. */}
                      {placeholder
                        ? <PlaceholderFileIcon size={16} className="shrink-0 text-neutral-400" />
                        : getFileTypeIcon(doc.fileType)({ size: 16, className: 'shrink-0' })}
                      <button
                        onClick={(e) => {
                          // Reference link previews the document — never ticks the
                          // row. previewDocument moves the cursor, which the ?doc=
                          // param follows, so the link stays shareable /
                          // multi-window safe (ADR-010).
                          e.stopPropagation();
                          previewDocument(doc);
                        }}
                        className="text-[#0461BA] hover:text-[#035299] font-medium text-left transition-colors"
                      >
                        {doc.id}
                      </button>
                    </span>
                  </td>
                  <td className="w-28 relative">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenActionMenuId((prev) => {
                            const next = prev === doc.id ? null : doc.id;
                            if (!next) {
                              setOpenActionSubmenuKey(null);
                            }
                            return next;
                          });
                          if (openActionMenuId !== doc.id) {
                            setOpenActionSubmenuKey(null);
                          }
                        }}
                        className={`w-[var(--row-btn)] h-[var(--row-btn)] rounded-md inline-flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors ${openActionMenuId === doc.id ? 'opacity-100 bg-neutral-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                        aria-label={t('documentBrowser.actionsFor', { id: doc.id })}
                      >
                        <MoreHorizontalIcon size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/chat?ask=${encodeURIComponent(`${doc.id} — ${doc.title}`)}&askKind=document`);
                        }}
                        title={t('documentBrowser.askFlintAbout', { id: doc.id })}
                        aria-label={t('documentBrowser.askFlintAbout', { id: doc.id })}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-[var(--row-btn)] h-[var(--row-btn)] rounded-md inline-flex items-center justify-center text-[#0461BA] hover:bg-[#E8F1FB]"
                      >
                        <SparklesIcon size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isInClipboard(doc.id)) {
                            removeFromClipboard(doc.id);
                          } else {
                            addToClipboard(doc);
                          }
                        }}
                        title={isInClipboard(doc.id) ? t('documentBrowser.removeFromClipboard', { id: doc.id }) : t('documentBrowser.addToClipboard', { id: doc.id })}
                        aria-label={isInClipboard(doc.id) ? t('documentBrowser.removeFromClipboard', { id: doc.id }) : t('documentBrowser.addToClipboard', { id: doc.id })}
                        className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all w-[var(--row-btn)] h-[var(--row-btn)] rounded-md inline-flex items-center justify-center ${isInClipboard(doc.id)
                          ? 'bg-neutral-100 text-neutral-700 opacity-100'
                          : 'text-neutral-600 hover:bg-neutral-200'
                          }`}
                      >
                        <ClipboardStackIcon size={14} active={isInClipboard(doc.id)} />
                      </button>

                      {openActionMenuId === doc.id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute left-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-visible"
                        >
                          <div className="py-2 flex flex-col overflow-visible">
                            {/* Upload content — the only action that makes sense first
                                on a placeholder, so it leads the menu for those rows.
                                [TODO-ENG] wire to the upload flow (G07 PUT content) — not
                                built in this prototype. */}
                            {placeholder && (
                              <>
                                <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-[#E8F1FB]">
                                    <div className="text-[#0461BA] mt-0.5"><UploadIcon size={16} /></div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                      <span className="text-sm font-medium text-[#0461BA]">Upload content</span>
                                      <span className="text-[11px] text-neutral-500">Attach the file this record is waiting for</span>
                                    </div>
                                  </button>
                                </div>
                                <div className="h-px bg-neutral-100 my-1 mx-2" />
                              </>
                            )}
                            {/* View Item — needs a file in the content store.
                                Opens the viewer framed inside FLUX rather than
                                launching a new browser tab. */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button disabled={placeholder} onClick={(e) => { e.preventDefault(); e.stopPropagation(); openViewer(toViewerTarget(doc)); setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                                <div className="text-neutral-500 mt-0.5"><EyeIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">View</span>
                                </div>
                              </button>
                            </div>

                            {/* Properties Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); previewDocument(doc); setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><InfoIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Properties</span>
                                </div>
                              </button>
                            </div>

                            {/* Subscribe Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [TODO-ENG] wire Subscribe — endpoint unconfirmed (G23 notification config?) [TBD] */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><BellIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Subscribe</span>
                                </div>
                              </button>
                            </div>

                            {/* Add to Favourites Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [TODO-ENG] wire Add to Favourites — endpoint unconfirmed (G02 user prefs?) [TBD] */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><StarIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Add to Favourites</span>
                                </div>
                              </button>
                            </div>

                            <div className="h-px bg-neutral-100 my-1 mx-2" />

                            {/* Share link Submenu Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey('share')}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenActionSubmenuKey(openActionSubmenuKey === 'share' ? null : 'share'); }} className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${openActionSubmenuKey === 'share' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}>
                                <div className="text-neutral-500 mt-0.5"><LinkIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Share link</span>
                                </div>
                                <div className="text-neutral-400 mt-0.5"><ChevronRightIcon size={14} /></div>
                              </button>
                              {openActionSubmenuKey === 'share' && (
                                <div className="absolute left-[calc(100%-8px)] top-0 ml-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1.5 flex flex-col">
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [TODO-ENG] wire dynamic share link — endpoint unconfirmed [TBD] */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Dynamic</button>
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [TODO-ENG] wire static share link — endpoint unconfirmed [TBD] */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Static</button>
                                </div>
                              )}
                            </div>

                            {/* Rendition Submenu Item — a rendition is derived from content. */}
                            <div className="relative px-1" onMouseEnter={() => { if (!placeholder) setOpenActionSubmenuKey('rendition'); }}>
                              <button disabled={placeholder} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenActionSubmenuKey(openActionSubmenuKey === 'rendition' ? null : 'rendition'); }} className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed ${openActionSubmenuKey === 'rendition' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}>
                                <div className="text-neutral-500 mt-0.5"><FilesIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Rendition</span>
                                </div>
                                <div className="text-neutral-400 mt-0.5"><ChevronRightIcon size={14} /></div>
                              </button>
                              {openActionSubmenuKey === 'rendition' && (
                                <div className="absolute left-[calc(100%-8px)] top-0 ml-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1.5 flex flex-col">
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [TODO-ENG] wire rendition create — likely G07 content variant; returns async job (G25) [TBD] */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Create</button>
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [API] G07:GET /workspaces/{wsId}/documents/{docId}/content (rendition download) [AUTH] [TBD] */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Download</button>
                                </div>
                              )}
                            </div>

                            <div className="h-px bg-neutral-100 my-1 mx-2" />

                            {/* Message Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* [API] G13:POST /workspaces/{wsId}/messages [AUTH] [TBD] */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><MessageSquareIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Message</span>
                                </div>
                              </button>
                            </div>

                            {/* Add to / Remove from Briefcase — the briefcase holds files
                                for offline work, so there is nothing to take yet. */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button disabled={placeholder} onClick={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (isInBriefcase(doc.id)) {
                                  removeFromBriefcase(doc.id);
                                } else {
                                  addToBriefcase({ docId: doc.id, title: doc.title, reference: doc.id, revision: doc.revisionNumber, status: doc.status, fileType: doc.fileType, fileSize: doc.fileSize, author: doc.author, projectName: doc.project, folderId: doc.folderId });
                                }
                                setOpenActionMenuId(null);
                              }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                                <div className={isInBriefcase(doc.id) ? 'text-[#0461BA] mt-0.5' : 'text-neutral-500 mt-0.5'}><BriefcaseIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">{isInBriefcase(doc.id) ? 'Remove from Briefcase' : 'Add to Briefcase'}</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </React.Fragment>
              );
            case 'title':
              return (
                <td key={col.key} style={tdStyle}>
                  <button
                    onClick={() => previewDocument(doc)}
                    className="text-neutral-900 group-hover:text-[#0461BA] transition-colors font-medium text-left"
                  >
                    {doc.title}
                  </button>
                </td>
              );
            case 'revisionNumber':
              return (
                <td key={col.key} style={tdStyle} className="text-neutral-500 font-medium">
                  {doc.revisionNumber}
                </td>
              );
            case 'status':
              // One chip. 'Placeholder' is the 0% rung of the status ladder, not
              // a second axis — a record is never both 'Placeholder' and 'New'.
              return (
                <td key={col.key} style={tdStyle}>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${statusColors[doc.status]}`}>
                    {doc.status}
                  </span>
                </td>
              );
            case 'dateExpected':
              return (
                <td key={col.key} style={tdStyle} className={overdue ? 'text-rose-600 font-medium' : 'text-neutral-600'}>
                  {doc.dateExpected
                    ? <span className="inline-flex items-center gap-1">
                        {overdue && <ClockIcon size={12} className="shrink-0" />}
                        {doc.dateExpected}
                      </span>
                    : <span className="text-neutral-400">--</span>}
                </td>
              );
            case 'documentType':
              return (
                <td key={col.key} className="text-neutral-600">
                  {doc.documentType}
                </td>
              );
            case 'author':
              return (
                <td key={col.key} className="text-neutral-600">
                  {doc.author}
                </td>
              );
            case 'dateModified':
              return (
                <td key={col.key} className="text-neutral-600">
                  {doc.dateModified}
                </td>
              );
            default: {
              // File-derived values (type, size) don't exist until content is
              // uploaded — show a muted em-dash rather than an empty-looking cell.
              const text = getDocumentColumnText(doc, col.key);
              const blankForPlaceholder = placeholder && CONTENT_DERIVED_COLUMN_KEYS.has(col.key);
              return (
                <td key={col.key} className={blankForPlaceholder || !text ? 'text-neutral-400' : 'text-neutral-500'}>
                  {text || '--'}
                </td>
              );
            }
          }
        })}

      </tr>
    );
  };

  // Column definitions
  // Category-specific custom columns
  const categoryCustomColumns = useMemo<Record<string, { key: string; label: string }[]>>(() => ({
    Structural: [
      { key: 'beamSize', label: t('documentBrowser.columns.beamSize') },
      { key: 'materialGrade', label: t('documentBrowser.columns.materialGrade') },
      { key: 'loadRating', label: t('documentBrowser.columns.loadRating') },
      { key: 'connectionType', label: t('documentBrowser.columns.connectionType') },
    ],
    Electrical: [
      { key: 'voltage', label: t('documentBrowser.columns.voltage') },
      { key: 'circuitNumber', label: t('documentBrowser.columns.circuitNumber') },
      { key: 'panel', label: t('documentBrowser.columns.panel') },
      { key: 'protectionType', label: t('documentBrowser.columns.protectionType') },
    ],
    Mechanical: [
      { key: 'equipmentTag', label: t('documentBrowser.columns.equipmentTag') },
      { key: 'powerRating', label: t('documentBrowser.columns.powerRating') },
      { key: 'manufacturer', label: t('documentBrowser.columns.manufacturer') },
      { key: 'serviceMedium', label: t('documentBrowser.columns.serviceMedium') },
    ],
    Civil: [
      { key: 'concreteType', label: t('documentBrowser.columns.concreteType') },
      { key: 'rebarSize', label: t('documentBrowser.columns.rebarSize') },
      { key: 'soilClass', label: t('documentBrowser.columns.soilClass') },
      { key: 'foundationType', label: t('documentBrowser.columns.foundationType') },
    ],
    Architectural: [
      { key: 'finishType', label: t('documentBrowser.columns.finishType') },
      { key: 'roomNumber', label: t('documentBrowser.columns.roomNumber') },
      { key: 'ceilingHeight', label: t('documentBrowser.columns.ceilingHeight') },
      { key: 'fireRating', label: t('documentBrowser.columns.fireRating') },
    ],
    Plumbing: [
      { key: 'pipeSize', label: t('documentBrowser.columns.pipeSize') },
      { key: 'fixtureType', label: t('documentBrowser.columns.fixtureType') },
      { key: 'flowRate', label: t('documentBrowser.columns.flowRate') },
      { key: 'pressureClass', label: t('documentBrowser.columns.pressureClass') },
    ],
    HVAC: [
      { key: 'ductSize', label: t('documentBrowser.columns.ductSize') },
      { key: 'airflow', label: t('documentBrowser.columns.airflow') },
      { key: 'unitType', label: t('documentBrowser.columns.unitType') },
      { key: 'zone', label: t('documentBrowser.columns.zone') },
    ],
  }), [t]);

  // Compose all columns: base + custom for selected categories
  const allColumns = useMemo(
    () => {
      const customColumns = selectedCategories.length === 1
        ? categoryCustomColumns[selectedCategories[0]] || []
        : [];

      return [
        { key: 'id', label: t('documentBrowser.columns.reference') },
        { key: 'title', label: t('documentBrowser.columns.title') },
        { key: 'revisionNumber', label: t('documentBrowser.columns.rev') },
        { key: 'status', label: t('documentBrowser.columns.status') },
        { key: 'documentType', label: t('documentBrowser.columns.type') },
        { key: 'author', label: t('documentBrowser.columns.author') },
        { key: 'dateModified', label: t('documentBrowser.columns.dateModified') },
        // Placeholder schedule. Date Expected is on by default — it is the field
        // document controllers chase; Responsible is opt-in via the column chooser
        // so the default table doesn't grow two columns wider.
        { key: 'dateExpected', label: t('documentBrowser.columns.dateExpected') },
        { key: 'responsibleParty', label: t('documentBrowser.columns.responsibleParty') },
        ...customColumns
      ];
    },
    [categoryCustomColumns, selectedCategories, t]
  );
  const columnLabelLookup = useMemo(
    () => new Map(allColumns.map((column) => [column.key, column.label])),
    [allColumns]
  );
  const isGroupableColumn = useCallback((columnKey: ColumnKey) => !NON_GROUPABLE_COLUMN_KEYS.has(columnKey), []);

  // State for column order
  // Track all column keys (including custom)
  const initialColumnPrefs = useMemo(() => loadColumnPreferences(), []);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => initialColumnPrefs.order ?? allColumns.map(c => c.key));
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.map(c => c.key).filter((key) => !DEFAULT_HIDDEN_COLUMN_KEYS.has(key))
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => initialColumnPrefs.widths || {});
  // Update order/visibility if columns change (e.g., category changes)
  useEffect(() => {
    setColumnOrder((prev) => {
      const newKeys = allColumns.map(c => c.key);
      const retainedKeys = prev.filter((key) => newKeys.includes(key));
      return [...retainedKeys, ...newKeys.filter((key) => !retainedKeys.includes(key))];
    });
    setVisibleColumns((prev) => {
      const newKeys = allColumns.map(c => c.key);
      const retainedKeys = prev.filter((key) => newKeys.includes(key));
      // Columns the user has to opt into stay out of the auto-append, otherwise
      // every category change would silently switch them back on.
      const added = newKeys.filter((key) => !retainedKeys.includes(key) && !DEFAULT_HIDDEN_COLUMN_KEYS.has(key));
      return [...retainedKeys, ...added];
    });
  }, [allColumns]);

  // Persist column order and widths whenever they change
  useEffect(() => {
    saveColumnPreferences(columnOrder, columnWidths);
  }, [columnOrder, columnWidths]);
  useEffect(() => {
    if (groupByColumn && (!allColumns.some((column) => column.key === groupByColumn) || !isGroupableColumn(groupByColumn))) {
      setGroupByColumn(null);
      setCollapsedGroups(new Set());
    }
  }, [allColumns, groupByColumn, isGroupableColumn]);
  useEffect(() => {
    saveTableViewPreferences({ groupByColumn });
  }, [groupByColumn]);
  const columns = columnOrder
    .map(key => allColumns.find(c => c.key === key))
    .filter(col => col && visibleColumns.includes(col.key)) as { key: string; label: string }[];
  const hasActiveGrouping =
    typeof groupByColumn === 'string' &&
    groupByColumn.trim().length > 0 &&
    isGroupableColumn(groupByColumn);
  const groupedColumnLabel = hasActiveGrouping ? columnLabelLookup.get(groupByColumn) ?? groupByColumn : null;

  // Drag-and-drop state
  const [draggedCol, setDraggedCol] = useState<ColumnKey | null>(null);
  const isDraggingGroupableColumn =
    typeof draggedCol === 'string' &&
    draggedCol.trim().length > 0 &&
    isGroupableColumn(draggedCol);
  const [dragTarget, setDragTarget] = useState<{
    key: ColumnKey;
    position: 'before' | 'after';
  } | null>(null);

  const reorderColumns = useCallback(
    (sourceKey: ColumnKey, targetKey: ColumnKey, position: 'before' | 'after') => {
      setColumnOrder((prev) => {
        const sourceIndex = prev.indexOf(sourceKey);
        const targetIndex = prev.indexOf(targetKey);

        if (sourceIndex === -1 || targetIndex === -1) {
          return prev;
        }

        const next = [...prev];
        next.splice(sourceIndex, 1);

        const adjustedTargetIndex = next.indexOf(targetKey);
        const insertIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;

        next.splice(insertIndex, 0, sourceKey);
        return next;
      });
    },
    []
  );

  // Column resizing
  const resizeStateRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const onMouseMoveResize = useCallback((e: MouseEvent) => {
    const state = resizeStateRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const newWidth = Math.max(60, Math.round(state.startWidth + dx));
    setColumnWidths((prev) => ({ ...prev, [state.key]: newWidth }));
  }, []);

  const onMouseUpResize = useCallback(() => {
    resizeStateRef.current = null;
    window.removeEventListener('mousemove', onMouseMoveResize);
    window.removeEventListener('mouseup', onMouseUpResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMouseMoveResize]);

  const startResize = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const th = target.closest('th') as HTMLElement | null;
    const startWidth = (th && th.offsetWidth) || (columnWidths[key] || 120);
    resizeStateRef.current = { key, startX: e.clientX, startWidth };
    window.addEventListener('mousemove', onMouseMoveResize);
    window.addEventListener('mouseup', onMouseUpResize);
  }, [onMouseMoveResize, onMouseUpResize, columnWidths]);

  const handleDragStart = (e: React.DragEvent, key: ColumnKey) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCol(key);
    setDragTarget({ key, position: 'after' });
    if (isGroupableColumn(key)) {
      setDragTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (!draggedCol || !isGroupableColumn(draggedCol)) {
      return;
    }

    if (e.clientX === 0 && e.clientY === 0) {
      return;
    }

    setDragTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragOver = (e: React.DragEvent, overKey: ColumnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsGroupDropActive(false);

    if (draggedCol && isGroupableColumn(draggedCol) && e.clientX !== 0 && e.clientY !== 0) {
      setDragTooltipPosition({ x: e.clientX, y: e.clientY });
    }

    if (!draggedCol) {
      return;
    }

    const bounds = e.currentTarget.getBoundingClientRect();
    const offset = e.clientX - bounds.left;
    const position = offset < bounds.width / 2 ? 'before' : 'after';

    setDragTarget({ key: overKey, position });
  };

  const handleDrop = (e: React.DragEvent, dropKey: ColumnKey) => {
    e.preventDefault();
    setIsGroupDropActive(false);

    if (!draggedCol || draggedCol === dropKey || !dragTarget) {
      handleDragEnd();
      return;
    }

    reorderColumns(draggedCol, dropKey, dragTarget.position);
    handleDragEnd();
  };

  const handleDragEnd = useCallback(() => {
    setDraggedCol(null);
    setDragTarget(null);
    setIsGroupDropActive(false);
    setDragTooltipPosition(null);
  }, []);

  useEffect(() => {
    const resetDragState = () => {
      handleDragEnd();
    };

    window.addEventListener('dragend', resetDragState);
    window.addEventListener('drop', resetDragState);

    return () => {
      window.removeEventListener('dragend', resetDragState);
      window.removeEventListener('drop', resetDragState);
    };
  }, [handleDragEnd]);

  const handleGroupDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!draggedCol || !isGroupableColumn(draggedCol)) {
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    setIsGroupDropActive(true);

    if (e.clientX !== 0 && e.clientY !== 0) {
      setDragTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleGroupDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
      return;
    }

    setIsGroupDropActive(false);
  };

  const handleGroupDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedCol || !isGroupableColumn(draggedCol)) {
      handleDragEnd();
      return;
    }

    // compute group keys from all filtered documents so subtotals are
    // accurate and we can collapse groups immediately
    const keys = new Set<string>();
    filteredDocuments.forEach((document) => {
      const label = getGroupLabel(getDocumentColumnText(document, draggedCol), t('documentBrowser.unassigned'));
      keys.add(`${draggedCol}:${label}`);
    });

    setCollapsedGroups(new Set(keys));
    const initMap = new Map<string, number>();
    keys.forEach((k) => initMap.set(k, ITEMS_PER_PAGE));
    setPerGroupDisplayedCounts(initMap);
    setGroupByColumn(draggedCol);
    handleDragEnd();
  };

  const handleClearGrouping = () => {
    setGroupByColumn(null);
    setCollapsedGroups(new Set());
    setPerGroupDisplayedCounts(new Map());
  };

  const toggleGroupCollapsed = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);

      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      return next;
    });
  };

  return (
    <div
      data-component="browser-shell"
      className="h-[calc(100vh-60px)] mt-[60px] font-sans overflow-hidden p-4"
      style={{
        backgroundColor: 'var(--main-bg-color, #EAEEF6)'
      }}>

      {/* Main Layout */}
      <AnimatePresence>
        <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 0.25
            }}
            data-component="browser-layout"
            className="flex h-full gap-4 pl-[var(--left-rail-width,88px)] items-stretch">

            {/* Left Rail */}
            <LeftRail
              activeItem={activeRailItem}
              onItemClick={() => {}} />


            {/* Sidebar Island */}
            <CollapsibleFilterPanel
              isExpanded={leftPanelOpen}
              onToggle={() => setLeftPanelOpen((v) => !v)}
              mode={leftPanelMode}
              onModeChange={setLeftPanelMode}
            >

              {leftPanelMode === 'filter' ?
                <FilterPanel
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  contentState={contentState}
                  onContentStateChange={setContentState}
                  selectedDocType={selectedDocType}
                  onDocTypeChange={setSelectedDocType}
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories} /> :


                foldersQuery.isLoading ?
                  <div className="space-y-2 p-3 animate-pulse" aria-busy="true" aria-label="Loading folders">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-6 bg-neutral-100 rounded" style={{ marginLeft: (i % 3) * 12 }} />
                    ))}
                  </div> :
                foldersQuery.isError ?
                  <div className="p-3 text-xs text-neutral-500">
                    <p className="font-medium text-neutral-700 mb-1">Couldn't load folders</p>
                    <button
                      onClick={() => foldersQuery.refetch()}
                      className="inline-flex items-center gap-1 text-[#0461BA] hover:underline">
                      <RefreshCwIcon size={11} /> Retry
                    </button>
                  </div> :
                <FolderTree
                  folders={projectFolders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={selectFolder} />

              }
            </CollapsibleFilterPanel>

            {/* Main Content Island */}
            <div
              data-component="content-panel"
              className="flex-1 flex flex-col min-w-0 rounded-xl shadow-md overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: 'var(--element-bg-color, #FFFFFF)'
              }}>

              {/* Header */}
              <header
                className={`px-4 bg-white shrink-0 flex justify-between items-center py-2`}
              >
                {leftPanelMode === 'folder' ? (
                  <div className="min-w-0 pr-4 min-h-[40px] flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 flex-wrap">
                      <button
                        onClick={() => selectFolder(null)}
                        className={`hover:text-[#0461BA] transition-colors ${selectedFolderId === null ? 'text-[#0461BA] font-semibold' : ''}`}
                      >
                        All Documents
                      </button>
                      {breadcrumbPath.map((crumb) => (
                        <React.Fragment key={crumb.id}>
                          <ChevronRightIcon size={12} className="text-neutral-300" />
                          <button
                            onClick={() => selectFolder(crumb.id)}
                            className={`hover:text-[#0461BA] transition-colors ${selectedFolderId === crumb.id ? 'text-[#0461BA] font-semibold' : ''}`}
                          >
                            {crumb.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      {documentCount} documents
                      {placeholderCount > 0 && (
                        <>
                          <span className="text-neutral-300 mx-1.5">·</span>
                          {placeholderCount} placeholder{placeholderCount === 1 ? '' : 's'}
                        </>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStatus.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Status: <span className="font-semibold">{s}</span>
                          <button onClick={() => setSelectedStatus((prev) => prev.filter((x) => x !== s))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${s} filter`}>
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                      {selectedDocType.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Type: <span className="font-semibold">{t}</span>
                          <button onClick={() => setSelectedDocType((prev) => prev.filter((x) => x !== t))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${t} filter`}>
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                      {selectedCategories.map((category) => (
                        <span key={category} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Category: <span className="font-semibold">{category}</span>
                          <button onClick={() => setSelectedCategories((prev) => prev.filter((x) => x !== category))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${category} filter`}>
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                      {contentState && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Content: <span className="font-semibold">{contentState === 'placeholder' ? 'Placeholders only' : 'With content only'}</span>
                          <button onClick={() => setContentState('')} className="ml-1 hover:text-red-500 transition-colors" aria-label="Remove content filter">
                            <XIcon size={12} />
                          </button>
                        </span>
                      )}
                      {(selectedStatus.length > 0 || selectedDocType.length > 0 || selectedCategories.length > 0 || contentState) && (
                        <button
                          onClick={() => { setSelectedStatus([]); setSelectedDocType([]); setSelectedCategories([]); setContentState(''); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors">
                          Clear all
                          <XIcon size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : leftPanelMode === 'filter' ? (
                  <div className="min-w-0 pr-4 min-h-[40px] flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 flex-wrap">
                      {selectedFolderId ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9EDFF] text-[#034E8F] text-xs font-medium">
                          <FolderIcon size={12} />
                          <span className="text-[11px]">Folder scope:</span>
                          <span className="font-semibold">
                            {breadcrumbPath.length > 0 ? breadcrumbPath.map((crumb) => crumb.name).join(' / ') : 'Selected folder'}
                          </span>
                          <button
                            onClick={() => selectFolder(null)}
                            aria-label="Clear folder scope"
                            className="ml-2 text-[#0461BA] hover:text-[#034E8F] p-1 rounded-full"
                          >
                            <XIcon size={12} />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => selectFolder(null)}
                          className={`hover:text-[#0461BA] transition-colors ${selectedFolderId === null ? 'text-[#0461BA] font-semibold' : ''}`}
                        >
                          All Documents
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      {documentCount} documents
                      {placeholderCount > 0 && (
                        <>
                          <span className="text-neutral-300 mx-1.5">·</span>
                          {placeholderCount} placeholder{placeholderCount === 1 ? '' : 's'}
                        </>
                      )}
                    </p>
                    {/* Folder scope is now removable via the chip's X button; no extra links needed */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStatus.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Status: <span className="font-semibold">{s}</span>
                          <button onClick={() => setSelectedStatus((prev) => prev.filter((x) => x !== s))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${s} filter`}>
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                      {selectedDocType.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Type: <span className="font-semibold">{t}</span>
                          <button onClick={() => setSelectedDocType((prev) => prev.filter((x) => x !== t))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${t} filter`}>
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                      {selectedCategories.map((category) => (
                        <span key={category} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Category: <span className="font-semibold">{category}</span>
                          <button onClick={() => setSelectedCategories((prev) => prev.filter((x) => x !== category))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${category} filter`}>
                            <XIcon size={12} />
                          </button>
                        </span>
                      ))}
                      {contentState && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Content: <span className="font-semibold">{contentState === 'placeholder' ? 'Placeholders only' : 'With content only'}</span>
                          <button onClick={() => setContentState('')} className="ml-1 hover:text-red-500 transition-colors" aria-label="Remove content filter">
                            <XIcon size={12} />
                          </button>
                        </span>
                      )}
                      {(selectedStatus.length > 0 || selectedDocType.length > 0 || selectedCategories.length > 0 || contentState) && (
                        <button
                          onClick={() => { setSelectedStatus([]); setSelectedDocType([]); setSelectedCategories([]); setContentState(''); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors">
                          Clear all
                          <XIcon size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-1">
                  {/* Clipboard button */}
                  {clipboard.length > 0 && (
                    <ClipboardDropdown align="right">
                      {({ toggle, isOpen }) => (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggle(); }}
                          className="relative h-7 w-7 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 transition-colors inline-flex items-center justify-center"
                          aria-label="Clipboard"
                          aria-expanded={isOpen}
                        >
                          <ClipboardIcon size={15} />
                          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#0461BA] text-white text-[10px] leading-4 text-center font-semibold">
                            {Math.min(clipboard.length, 99)}
                          </span>
                        </button>
                      )}
                    </ClipboardDropdown>
                  )}
                  {/* View mode dropdown */}
                  <ViewModeDropdown
                    viewMode={viewMode}
                    onViewModeChange={setViewMode} />
                  {/* Column chooser button (three dots) */}
                  <div className="relative" ref={columnChooserRef}>
                    <button
                      onClick={() => setShowColumnChooser((v) => !v)}
                      className="h-7 w-7 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 transition-colors inline-flex items-center justify-center"
                      aria-label="Choose columns"
                      aria-haspopup="true"
                      aria-expanded={showColumnChooser}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="19" cy="12" r="2" fill="currentColor" /></svg>
                    </button>
                    {showColumnChooser && (
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-3">
                        <div className="mb-2 text-xs font-semibold text-neutral-700">Show Columns</div>
                        <div className="flex flex-col gap-2">
                          {allColumns.map(col => (
                            <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={visibleColumns.includes(col.key)}
                                onChange={() => {
                                  setVisibleColumns(prev =>
                                    prev.includes(col.key)
                                      ? prev.filter(k => k !== col.key)
                                      : [...prev, col.key]
                                  );
                                }}
                                className="accent-[#0461BA]"
                              />
                              <span>{col.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Export button */}
                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      onClick={() => setShowExportMenu((v) => !v)}
                      className="h-7 w-7 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 transition-colors inline-flex items-center justify-center"
                      aria-label="Export grid"
                      aria-haspopup="true"
                      aria-expanded={showExportMenu}
                      title="Export CSV"
                    >
                      <ShareIcon size={14} />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-2">
                        <div className="mb-1 px-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Export Grid</div>
                        <button
                          onClick={() => { handleExport('visible'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
                        >
                          Export visible columns (CSV)
                        </button>
                        <button
                          onClick={() => { handleExport('all'); setShowExportMenu(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
                        >
                          Export all columns (CSV)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* Content Area */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Sidebar collapse/expand is the one state change the user doesn't
                    directly command, so it is the one thing announced. */}
                <div aria-live="polite" role="status" className="sr-only">{liveMessage}</div>

                {/* Bulk action bar — the checked set's reason for existing. Appears
                    from one checked row: at count 1 the sidebar is still previewing
                    the (possibly different) active row, so without this there is no
                    on-screen evidence a selection exists at all. */}
                <AnimatePresence initial={false}>
                  {checkedCount > 0 && (
                    <motion.div
                      key="bulk-bar"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="overflow-hidden shrink-0"
                    >
                      {/* flex-wrap + nowrap labels: the grid column is narrow while a
                          wide detail panel is open, and squeezing the row would
                          otherwise break button labels mid-word. */}
                      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#0461BA]/25 bg-[#E8F1FB] px-3 py-2">
                        <span className="text-xs font-semibold text-[#0461BA] whitespace-nowrap">
                          {t('documentBrowser.bulk.count', { count: checkedCount })}
                        </span>
                        <button
                          onClick={clearSelection}
                          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline decoration-dotted transition-colors whitespace-nowrap"
                        >
                          {t('documentBrowser.bulk.clear')}
                        </button>
                        <span className="h-4 w-px bg-[#0461BA]/20 mx-1" aria-hidden="true" />
                        <button
                          onClick={bulkAddToClipboard}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors whitespace-nowrap"
                        >
                          <ClipboardIcon size={13} /> {t('documentBrowser.bulk.clipboard')}
                        </button>
                        <button
                          onClick={bulkAddToBriefcase}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors whitespace-nowrap"
                        >
                          <BriefcaseIcon size={13} /> {t('documentBrowser.bulk.briefcase')}
                        </button>
                        <button
                          onClick={() => handleExport('selected')}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors whitespace-nowrap"
                        >
                          <ShareIcon size={13} /> {t('documentBrowser.bulk.export')}
                        </button>
                        {/* Disabled rather than absent: these are the two actions a
                            user reaches for first on a multi-select, and a bar that
                            silently omits them reads as "not supported" instead of
                            "not built yet".
                            [TODO-ENG] Download needs G07 content retrieval; Transmit
                            needs transmittal creation. Neither exists in this
                            prototype — wire both to the real endpoints. */}
                        <button
                          disabled
                          title={t('documentBrowser.bulk.notWired')}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-400 border-dashed cursor-not-allowed whitespace-nowrap"
                        >
                          <DownloadIcon size={13} /> {t('documentBrowser.bulk.download')}
                        </button>
                        <button
                          disabled
                          title={t('documentBrowser.bulk.notWired')}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-400 border-dashed cursor-not-allowed whitespace-nowrap"
                        >
                          <SendIcon size={13} /> {t('documentBrowser.bulk.transmit')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isDocsError ?
                  // RFC 7807 errors surface here with a retry — the states the mock
                  // data era never exercised. [PHASE-1]
                  <div className="flex flex-col items-center justify-center h-full max-h-[400px] bg-white rounded-lg border border-rose-200 border-dashed">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-3">
                      <AlertTriangleIcon size={24} className="text-rose-400" />
                    </div>
                    <p className="text-neutral-900 font-semibold text-lg">
                      Couldn't load documents
                    </p>
                    <p className="text-neutral-500 text-sm mt-1">
                      Something went wrong talking to the server
                    </p>
                    <button
                      onClick={() => refetchDocuments()}
                      className="mt-4 inline-flex items-center gap-2 px-3 h-8 rounded-md bg-[#0461BA] text-white text-xs font-medium hover:bg-[#035299] transition-colors">
                      <RefreshCwIcon size={13} /> Try again
                    </button>
                  </div> :
                isDocsLoading ?
                  <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading documents">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-11 bg-neutral-100 rounded-md" />
                    ))}
                  </div> :
                filteredDocuments.length === 0 && leftPanelMode !== 'folder' && !(hasActiveColumnFilters && viewMode === 'table') ?
                  <div className="flex flex-col items-center justify-center h-full max-h-[400px] bg-white rounded-lg border border-neutral-200 border-dashed">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-3">
                      <SearchIcon size={24} className="text-neutral-400" />
                    </div>
                    <p className="text-neutral-900 font-semibold text-lg">
                      No documents found
                    </p>
                    <p className="text-neutral-500 text-sm mt-1">
                      Try adjusting your filters or search criteria
                    </p>
                  </div> :
                  viewMode === 'grid' ?
                    <div key="grid-view">
                      {/* Wrap grid in a horizontally-scrollable container and
                        add a sticky synced scrollbar so the horizontal
                        scrollbar remains visible at the bottom of the grid */}
                      <GridWithStickyScrollbar documents={displayedDocuments} highlightedDocId={panelDocId} onOpenDocument={previewDocument} />
                      {hasMore && !groupByColumn &&
                        <div
                          ref={loadMoreRef}
                          className="flex justify-center py-8">

                          {isFetchingNextPage ?
                            <div className="flex items-center gap-2 text-neutral-500">
                              <LoaderIcon size={20} className="animate-spin" />
                              <span className="text-sm">
                                Loading more documents...
                              </span>
                            </div> :

                            <div className="h-8" />
                          }
                        </div>
                      }
                    </div> :
                    viewMode === 'list' ?
                      <div key="list-view" className="space-y-2">
                        {displayedDocuments.map((doc) =>
                          <div key={doc.id}>
                            <button
                              onClick={() => previewDocument(doc)}
                              className={`w-full text-left block border p-3 hover:shadow-sm transition-all bg-white rounded-md group ${activeDocId === doc.id ? 'border-[#0461BA] ring-2 ring-[#0461BA]/20 shadow-md' : 'border-neutral-200 hover:border-neutral-300'}`}>

                              <div className="flex gap-3">
                                {/* Placeholders have no content, so nothing to preview —
                                    a dashed empty tile instead of a broken thumbnail. */}
                                {isPlaceholder(doc) ? (
                                  <div className="w-24 h-16 bg-neutral-50 flex-shrink-0 rounded-md border border-dashed border-neutral-300 flex items-center justify-center">
                                    <PlaceholderFileIcon size={20} className="text-neutral-400" />
                                  </div>
                                ) : (
                                  <div className="w-24 h-16 bg-neutral-100 flex-shrink-0 rounded-md overflow-hidden border border-neutral-100">
                                    <img
                                      src={doc.thumbnail}
                                      alt={doc.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                                  </div>
                                )}
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                  <div className="flex items-start justify-between mb-1 gap-3">
                                    <h3 className="font-semibold text-neutral-900 text-sm group-hover:text-[#0461BA] transition-colors truncate">
                                      {doc.title}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (isInClipboard(doc.id)) {
                                            removeFromClipboard(doc.id);
                                          } else {
                                            addToClipboard(doc);
                                          }
                                        }}
                                        title={isInClipboard(doc.id) ? `Remove ${doc.id} from clipboard` : `Add ${doc.id} to clipboard`}
                                        aria-label={isInClipboard(doc.id) ? `Remove ${doc.id} from clipboard` : `Add ${doc.id} to clipboard`}
                                        className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all w-6 h-6 rounded-md inline-flex items-center justify-center ${isInClipboard(doc.id)
                                          ? 'bg-neutral-100 text-neutral-700 opacity-100'
                                          : 'text-neutral-600 hover:bg-neutral-200'
                                          }`}>
                                        <ClipboardStackIcon size={13} active={isInClipboard(doc.id)} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          navigate(`/chat?ask=${encodeURIComponent(`${doc.id} — ${doc.title}`)}&askKind=document`);
                                        }}
                                        title={`Ask Flint about ${doc.id}`}
                                        aria-label={`Ask Flint about ${doc.id}`}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-6 h-6 rounded-md inline-flex items-center justify-center text-[#0461BA] hover:bg-[#E8F1FB]">
                                        <SparklesIcon size={13} />
                                      </button>
                                      <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${statusColors[doc.status]}`}>

                                        {doc.status}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs font-medium text-neutral-500 mb-2">
                                    {doc.id}{' '}
                                    <span className="text-neutral-300 mx-1">•</span>{' '}
                                    Rev {doc.revisionNumber}
                                    {doc.dateExpected && (
                                      <>
                                        <span className="text-neutral-300 mx-1">•</span>{' '}
                                        <span className={isOverdue(doc) ? 'text-rose-600' : 'text-neutral-500'}>
                                          Expected {doc.dateExpected}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                  <div className="flex gap-5 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1.5">
                                      <UserIcon
                                        size={12}
                                        className="text-neutral-400" />

                                      {doc.author}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <CalendarIcon
                                        size={12}
                                        className="text-neutral-400" />

                                      {doc.dateModified}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <FolderIcon
                                        size={12}
                                        className="text-neutral-400" />

                                      {doc.project}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                        )}
                        {hasMore && !hasActiveGrouping && (
                          <div ref={loadMoreRef} className="flex justify-center py-8">
                            {isFetchingNextPage ? (
                              <div className="flex items-center gap-2 text-neutral-500">
                                <LoaderIcon size={20} className="animate-spin" />
                                <span className="text-sm">Loading more documents...</span>
                              </div>
                            ) : (
                              <div className="h-8" />
                            )}
                          </div>
                        )}
                      </div> :

                      <div key="table-view" className="flex flex-col h-full">
                        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full min-h-0">
                          <AnimatePresence initial={false}>
                            {(isDraggingGroupableColumn || hasActiveGrouping) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden shrink-0"
                              >
                                <div
                                  onDragOver={handleGroupDragOver}
                                  onDragLeave={handleGroupDragLeave}
                                  onDrop={handleGroupDrop}
                                  className="border-b border-neutral-200 bg-white px-3 py-2"
                                >
                                  {hasActiveGrouping ? (
                                    <div className={`flex min-h-10 items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2 transition-colors ${isGroupDropActive ? 'border-[#0461BA] bg-[#E8F1FB]' : 'border-neutral-200 bg-white'}`}>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">Grouped by</span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F1FB] px-3 py-1 text-sm font-medium text-[#0461BA]">
                                          {groupedColumnLabel}
                                          <button
                                            onClick={handleClearGrouping}
                                            className="rounded-full p-0.5 text-[#0461BA] hover:bg-[#D8E9FB]"
                                            aria-label={`Clear grouping by ${groupedColumnLabel}`}>

                                            <XIcon size={12} />
                                          </button>
                                        </span>
                                      </div>
                                      <span className="text-xs text-neutral-500">Drag another column here to regroup</span>
                                    </div>
                                  ) : (
                                    <div className={`flex min-h-10 items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2 transition-colors ${isGroupDropActive ? 'border-[#0461BA] bg-[#E8F1FB]' : 'border-neutral-200 bg-neutral-50/70'}`}>
                                      <span className="text-sm text-neutral-500">Drag a column header here to group rows</span>
                                      {isDraggingGroupableColumn &&
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#0461BA] shadow-sm">
                                          Group by {columnLabelLookup.get(draggedCol) ?? draggedCol}
                                        </span>
                                      }
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Unified scroll wrapper — handles both vertical and horizontal scrolling */}
                          <div ref={dataContainerRef} className="flex-1 min-h-0 overflow-auto w-full" style={{ scrollbarGutter: 'stable' }}>
                            {/* The grid semantics and the keyboard focus live on the
                                table, not the scroll wrapper: aria-activedescendant
                                is only meaningful on the element that holds the
                                composite role AND the focus. The scroll wrapper stays
                                a plain scroll wrapper (scrollRowIntoView targets it). */}
                            <table
                              ref={gridRef}
                              role="grid"
                              tabIndex={0}
                              aria-multiselectable="true"
                              aria-label={t('documentBrowser.gridAria')}
                              // The cursor survives list changes, so a column filter
                              // or a collapsed group can leave activeDocId pointing at
                              // a row that is no longer rendered — an invalid ARIA
                              // reference. Only emit it while the row exists.
                              aria-activedescendant={activeDocId && navigableDocs.some((d) => d.id === activeDocId)
                                ? rowDomId(activeDocId)
                                : undefined}
                              onKeyDown={handleListKeyDown}
                              // Tabbing into the grid before any row is active would
                              // otherwise show nothing at all — the active-row ring
                              // is the usual focus cue, and there is no active row yet.
                              className="w-full doc-table border-collapse whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0461BA]/40">
                              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                                <tr className="border-b border-neutral-200 bg-neutral-50">
                                  <th className="text-left w-10">
                                    <SelectionCheckboxButton
                                      onClick={toggleSelectAllDisplayed}
                                      checked={allDisplayedSelected}
                                      indeterminate={hasSomeDisplayedSelected && !allDisplayedSelected}
                                      ariaLabel={allDisplayedSelected ? 'Deselect all documents' : 'Select all documents'}
                                    />
                                  </th>
                                  {columns.map((col) => (
                                    <React.Fragment key={col.key}>
                                      <th
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, col.key)}
                                        onDrag={handleDrag}
                                        onDragOver={e => handleDragOver(e, col.key)}
                                        onDrop={e => handleDrop(e, col.key)}
                                        onDragEnd={handleDragEnd}
                                        className="text-left relative transition-colors"
                                        style={{
                                          width: columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined,
                                          minWidth: columnWidths[col.key] ? `${Math.max(columnWidths[col.key], 60)}px` : undefined,
                                          opacity: draggedCol === col.key ? 0.45 : 1,
                                          cursor: draggedCol === col.key ? 'grabbing' : 'grab',
                                          backgroundColor: dragTarget?.key === col.key && draggedCol !== col.key ? '#EFF6FF' : undefined,
                                        }}
                                      >
                                        {dragTarget?.key === col.key && draggedCol !== col.key && dragTarget.position === 'before' && (
                                          <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-[#0461BA]" aria-hidden="true" />
                                        )}
                                        {dragTarget?.key === col.key && draggedCol !== col.key && dragTarget.position === 'after' && (
                                          <span className="absolute right-0 top-1 bottom-1 w-1 rounded-full bg-[#0461BA]" aria-hidden="true" />
                                        )}
                                        <ColumnHeaderDropdown
                                          column={col.key}
                                          label={col.label}
                                          filter={columnFilters.get(col.key)}
                                          onFilterChange={handleColumnFilterChange}
                                          onSortChange={handleColumnSortChange}
                                          onClearFilter={handleClearColumnFilter}
                                        />
                                        <div
                                          onMouseDown={(e) => startResize(e, col.key)}
                                          className="absolute top-0 right-0 h-full w-4 column-resizer"
                                          style={{ zIndex: 40, touchAction: 'none' }}
                                        />
                                      </th>
                                      {col.key === 'id' && (
                                        <th className="w-28" aria-label="Row actions" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {filteredDocuments.length === 0 ? (
                                  <tr>
                                    <td colSpan={columns.length + 2} className="py-12 text-center">
                                      <p className="text-sm font-medium text-neutral-600">No documents match the column filter</p>
                                      <p className="text-xs text-neutral-400 mt-1">Clear the filter above to show results</p>
                                    </td>
                                  </tr>
                                ) : groupByColumn ?
                                  groupedSections.map((section) => {
                                    const isCollapsed = collapsedGroups.has(section.key);
                                    return (
                                      <React.Fragment key={section.key}>
                                        <tr className="bg-[#F8FAFC]">
                                          <td colSpan={columns.length + 2}>
                                            <button
                                              onClick={() => toggleGroupCollapsed(section.key)}
                                              className="flex w-full items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left transition-colors hover:border-[#0461BA]/35 hover:bg-[#F8FBFF]"
                                              aria-expanded={!isCollapsed}>

                                              <span className="flex min-w-0 items-center gap-3">
                                                {isCollapsed ?
                                                  <ChevronRightIcon size={14} className="text-neutral-500" /> :
                                                  <ChevronDownIcon size={14} className="text-neutral-500" />
                                                }
                                                <span className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">{groupedColumnLabel}</span>
                                                <span className="truncate text-sm font-semibold text-neutral-800">{section.label}</span>
                                                <span className="ml-3 text-xs font-medium text-neutral-500 whitespace-nowrap">{section.documents.length} document{section.documents.length === 1 ? '' : 's'}</span>
                                              </span>
                                            </button>
                                          </td>
                                        </tr>
                                        {!isCollapsed && (() => {
                                          const perCount = perGroupDisplayedCounts.get(section.key) ?? ITEMS_PER_PAGE;
                                          const docsToShow = section.documents.slice(0, perCount);
                                          return (
                                            <>
                                              {docsToShow.map(renderDocumentRow)}
                                              {perCount < section.documents.length && (
                                                <tr key={`${section.key}-load`}>
                                                  <td colSpan={columns.length + 2} className="py-2">
                                                    <div
                                                      data-group-key={section.key}
                                                      ref={(el) => groupLoadRefs.current.set(section.key, el)}
                                                      className="h-8 flex items-center justify-center text-neutral-500">
                                                      <span className="text-sm">Loading more documents...</span>
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </React.Fragment>);

                                  }) :
                                  displayedDocuments.map(renderDocumentRow)
                                }
                              </tbody>
                            </table>

                            {hasMore &&
                              <div ref={loadMoreRef} className="flex justify-center py-8">
                                {isFetchingNextPage ? (
                                  <div className="flex items-center gap-2 text-neutral-500">
                                    <LoaderIcon size={20} className="animate-spin" />
                                    <span className="text-sm">Loading more documents...</span>
                                  </div>
                                ) : (
                                  <div className="h-8" />
                                )}
                              </div>
                            }
                          </div>
                        </div>
                        {isGroupDropActive && draggedCol && isGroupableColumn(draggedCol) && dragTooltipPosition &&
                          <div
                            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
                            style={{
                              left: dragTooltipPosition.x,
                              top: dragTooltipPosition.y - 8
                            }}>

                            Group by {columnLabelLookup.get(draggedCol) ?? draggedCol}
                          </div>
                        }
                      </div>
                }
              </div>
            </div>

            {/* Split detail panel — third flex column, sits alongside the grid.
                Resize handle lives in the browser-layout gap to its left.

                Collapse rule: above one checked row there is no single document to
                describe, so the panel slides shut and reopens when the count drops
                back to 0–1. The cursor keeps moving underneath it — a user
                extending a range still needs the arrow keys.

                The WIDTH animates on this wrapper rather than the wrapper
                unmounting: DetailSlidePanel's own AnimatePresence is *inside* it,
                so unmounting would take the exit animation with it and snap the
                grid wider in one frame. */}
            <AnimatePresence initial={false}>
              {panelData && !panelDismissed && (
                <motion.div
                  key="detail-panel"
                  className="relative shrink-0 h-full"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: sidebarCollapsed ? 0 : panelWidth, opacity: sidebarCollapsed ? 0 : 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {/* The handle sits 16px outside the panel's left edge, so it can't
                      live inside the clipping box below — it's dropped outright while
                      collapsed rather than left floating over the grid. */}
                  {!sidebarCollapsed && (
                    <PanelResizeHandle side="left" onResizeStart={startPanelResize} ariaLabel={t('panel.resize')} />
                  )}
                  <div className="h-full overflow-hidden">
                    {/* Fixed inner width so the panel's contents don't reflow (and
                        text doesn't re-wrap) while the wrapper animates shut. */}
                    <div className="h-full" style={{ width: panelWidth }}>
                      <DetailSlidePanel
                        data={panelData}
                        onClose={dismissDetailPanel}
                        variant="split"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
      </AnimatePresence>
    </div>);

}
