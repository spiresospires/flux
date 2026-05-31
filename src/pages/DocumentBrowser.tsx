import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from
  'react';
import { DocumentCard } from '../components/DocumentCard';
import { statusColors } from '../components/documentStatusColors';
import { FilterPanel } from '../components/FilterPanel';
import { FolderTree } from '../components/FolderTree';
import { LeftRail } from '../components/LeftRail';
import { CollapsibleFilterPanel } from '../components/CollapsibleFilterPanel';
import { DetailSlidePanel, type DetailPanelData } from '../components/DetailSlidePanel';
import { ClipboardDropdown } from '../components/ClipboardDropdown';
import { mockDocuments } from '../data/mockDocuments';
import { mockFolders } from '../data/mockFolders';
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
  BriefcaseIcon
} from
  'lucide-react';
import { useClipboard } from '../contexts/ClipboardContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useScope } from '../contexts/ScopeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Document } from '../types/document';
type SortDirection = 'asc' | 'desc' | null;
type ColumnKey = string;
const PROJECT_SCALE: Record<string, number> = {
  'The Shard, London': 1,
  Skyline: 0.7,
  Tower: 0.45,
  'Empire State': 0.85
};

interface ColumnFilter {
  column: ColumnKey;
  value: string;
  sortDirection: SortDirection;
}

function GridWithStickyScrollbar({
  documents,
  highlightedDocId
}: {
  documents: Document[];
  highlightedDocId: string | null;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {documents.map((doc) => (
            <div key={doc.id}>
              <DocumentCard document={doc} isHighlighted={highlightedDocId === doc.id} />
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


type ViewMode = 'grid' | 'list' | 'table' | 'compact-table';

const TABLE_PREFERENCES_STORAGE_KEY = 'flux.documentBrowser.tablePreferences';
const COLUMN_PREFERENCES_STORAGE_KEY = 'flux.documentBrowser.columnPrefs';
const NON_GROUPABLE_COLUMN_KEYS = new Set<ColumnKey>(['id', 'title']);

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

function getGroupLabel(value: string, unassignedLabel: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : unassignedLabel;
}

function ViewModeDropdown({
  viewMode,
  onViewModeChange



}: { viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void; }) {
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const viewOptions: {
    mode: ViewMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
      {
        mode: 'table',
        label: t('documentBrowser.viewModes.comfyTable'),
        icon: <TableIcon size={16} />
      },
      {
        mode: 'compact-table',
        label: t('documentBrowser.viewModes.compactTable'),
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
      className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0461BA]/30 ${checked || indeterminate
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

  // Close popover on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setFilterOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
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
        onClick={cycleSort}
        className={`flex items-center gap-1 font-semibold text-xs uppercase tracking-wider transition-colors min-w-0 ${
          sortDir ? 'text-[#0461BA]' : 'text-neutral-600 hover:text-neutral-900'
        }`}
        title={`Click to sort by ${label}`}
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
        onClick={(e) => { e.stopPropagation(); setFilterOpen(v => !v); }}
        title={`Filter ${label}`}
        className={`shrink-0 rounded transition-all duration-150 ${
          hasFilter
            ? 'opacity-100 text-[#0461BA]'
            : 'opacity-0 group-hover:opacity-35 hover:!opacity-80 text-neutral-500'
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
                onClick={() => toggleSort('asc')}
                title="Sort A → Z"
                className={`flex-1 flex items-center justify-center h-7 rounded-lg transition-colors ${
                  sortDir === 'asc'
                    ? 'bg-[#E8F1FB] text-[#0461BA] ring-1 ring-[#0461BA]/25'
                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700'
                }`}
              >
                <ArrowUpIcon size={13} strokeWidth={sortDir === 'asc' ? 2.5 : 1.5} />
              </button>

              <button
                onClick={() => toggleSort('desc')}
                title="Sort Z → A"
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
export function DocumentBrowser() {
  const { t } = useLocalization();
  const { clipboard, addToClipboard, removeFromClipboard, isInClipboard } = useClipboard();
  const { currentWorkspace } = useWorkspace();
  const { setScope } = useScope();
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('compact-table');
  const [sortBy] = useState<'dateModified' | 'title' | 'id'>(
    'dateModified'
  );
  const [leftPanelMode, setLeftPanelMode] = useState<'filter' | 'folder'>(
    'folder'
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const activeRailItem = 'documents';
  const projectFolders = useMemo(() => {
    const factor = PROJECT_SCALE[currentWorkspace] ?? 1;
    const scale = (n: number) => Math.max(0, Math.round(n * factor));
    const walk = (list: typeof mockFolders): typeof mockFolders =>
      list.map((f) => ({
        ...f,
        documentCount: scale(f.documentCount),
        children: f.children ? walk(f.children) : []
      }));
    return walk(mockFolders);
  }, [currentWorkspace]);
  const projectDocuments = useMemo(() => {
    const factor = PROJECT_SCALE[currentWorkspace] ?? 1;
    // Deterministic shuffle seeded by project name so each workspace shows a different mix
    let seed = 0;
    for (let i = 0; i < currentWorkspace.length; i++) {
      seed = (seed * 31 + currentWorkspace.charCodeAt(i)) >>> 0;
    }
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    const shuffled = [...mockDocuments];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const count = Math.max(1, Math.round(mockDocuments.length * factor));
    return shuffled.slice(0, count);
  }, [currentWorkspace]);

  useEffect(() => {
    setSelectedFolderId(null);
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [currentWorkspace]);
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());

  // Navigate-from-search: switch workspace scope, open the folder, and select/highlight the document.
  // TODO: When direct object URLs are implemented (via a DB mapping table of objectType+id → canonical URL),
  // replace this location.state pattern with a proper deep-link route e.g. /documents/:folderId/:docId.
  useEffect(() => {
    const state = location.state as {
      folderId?: string;
      selectedDocId?: string;
      projectId?: string;
      projectName?: string;
    } | null;
    if (state?.projectId && state?.projectName) {
      setScope({ kind: 'project', id: state.projectId, name: state.projectName });
    }
    if (state?.folderId) setSelectedFolderId(state.folderId);
    if (state?.selectedDocId) {
      setHighlightedDocId(state.selectedDocId);
      setSelectedDocumentIds(new Set([state.selectedDocId]));
    }
  }, [location.state]);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openActionSubmenuKey, setOpenActionSubmenuKey] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [panelData, setPanelData] = useState<DetailPanelData | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  // Column filters for table view
  const [columnFilters, setColumnFilters] = useState<
    Map<ColumnKey, ColumnFilter>>(
      new Map());
  // Lazy loading state
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [groupByColumn, setGroupByColumn] = useState<ColumnKey | null>(() => loadTableViewPreferences().groupByColumn);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isGroupDropActive, setIsGroupDropActive] = useState(false);

  const [dragTooltipPosition, setDragTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [perGroupDisplayedCounts, setPerGroupDisplayedCounts] = useState<Map<string, number>>(new Map());
  const groupLoadRefs = useRef(new Map<string, HTMLDivElement | null>());
  // Scrollable data container ref for localized scrolling (right-hand panel)
  const dataContainerRef = useRef<HTMLDivElement | null>(null);

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

  const selectedFolderIds = useMemo(() => {
    if (!selectedFolderId) {
      return null;
    }

    const ids = new Set<string>();
    const stack = [selectedFolderId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId || ids.has(currentId)) {
        continue;
      }
      ids.add(currentId);

      const folder = folderLookup.get(currentId);
      if (folder) {
        folder.children.forEach((childId) => stack.push(childId));
      }
    }

    return ids;
  }, [selectedFolderId, folderLookup]);

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
    setDisplayedCount(ITEMS_PER_PAGE);
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
    setDisplayedCount(ITEMS_PER_PAGE);
  };
  const filteredDocuments = useMemo(() => {
    let filtered = projectDocuments;
    if (selectedFolderIds) {
      filtered = filtered.filter((doc) => !!doc.folderId && selectedFolderIds.has(doc.folderId));
    }
    if (selectedStatus.length > 0) {
      filtered = filtered.filter((doc) => selectedStatus.includes(doc.status));
    }
    if (selectedDocType.length > 0) {
      filtered = filtered.filter((doc) =>
        selectedDocType.includes(doc.documentType)
      );
    }
    if (selectedProject.length > 0) {
      filtered = filtered.filter((doc) => selectedProject.includes(doc.project));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((doc) =>
        doc.tags.some((tag) =>
          selectedCategories.some(
            (category) => tag.toLowerCase() === category.toLowerCase()
          )
        )
      );
    }
    // Apply column filters (for table view)
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
    // Apply column sorting
    let sortColumn: ColumnKey | null = null;
    let sortDirection: SortDirection = null;
    columnFilters.forEach((filter) => {
      if (filter.sortDirection) {
        sortColumn = filter.column;
        sortDirection = filter.sortDirection;
      }
    });
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn as keyof typeof a] as string;
        const bVal = b[sortColumn as keyof typeof b] as string;
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sorting
      filtered.sort((a, b) => {
        if (sortBy === 'dateModified') {
          return (
            new Date(b.dateModified).getTime() -
            new Date(a.dateModified).getTime());

        } else if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else {
          return a.id.localeCompare(b.id);
        }
      });
    }
    return filtered;
  }, [
    selectedStatus,
    selectedDocType,
    selectedProject,
    selectedCategories,
    sortBy,
    selectedFolderIds,
    columnFilters,
    projectDocuments]
  );
  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [
    selectedStatus,
    selectedDocType,
    selectedProject,
    selectedCategories,
    selectedFolderId,
    leftPanelMode,
    groupByColumn]
  );
  // Lazy loading with Intersection Observer
  const loadMore = useCallback(() => {
    if (displayedCount >= filteredDocuments.length || isLoading) return;
    setIsLoading(true);
    // Simulate network delay for lazy loading
    setTimeout(() => {
      setDisplayedCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filteredDocuments.length)
      );
      setIsLoading(false);
    }, 500);
  }, [displayedCount, filteredDocuments.length, isLoading]);
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
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
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
  const displayedDocuments = orderedDocuments.slice(0, displayedCount);
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
  const hasMore = displayedCount < orderedDocuments.length;
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

  const toDocumentDetail = (doc: typeof mockDocuments[0]): DetailPanelData => ({
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
    fileType: 'PDF',
    fileSize: doc.fileSize || '2.4 MB',
    description: doc.description,
  });

  const handleExport = (type: 'visible' | 'all') => {
    const colsToExport = type === 'visible' ? columns : allColumns;

    // 1. Generate Header Row
    // Wrapping each heading in quotes and doubling any internal quotes for standard CSV escaping mapping.
    const headerRow = colsToExport.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',') + '\n';

    // 2. Generate Data Rows mapping through all filtered items (ignoring lazy load limit)
    const dataRows = filteredDocuments.map(doc => {
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

  const renderDocumentRow = (doc: Document) => {
    const isSelected = selectedDocumentIds.has(doc.id);

    return (
      <tr
        key={doc.id}
        className={`transition-colors group ${
          isSelected || highlightedDocId === doc.id
            ? 'bg-[#E8F1FB]'
            : panelData?.docId === doc.id
              ? 'bg-[#F0F6FF] ring-1 ring-inset ring-[#0461BA]/20'
              : 'hover:bg-neutral-50'
        }`}
      >
        <td className={viewMode === 'compact-table' ? 'p-2' : 'p-4'}>
          <SelectionCheckboxButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleDocumentSelection(doc.id);
            }}
            checked={isSelected}
            ariaLabel={isSelected ? t('documentBrowser.deselectDocument', { id: doc.id }) : t('documentBrowser.selectDocument', { id: doc.id })}
            className={!isSelected ? 'opacity-0 group-hover:opacity-100' : ''}
          />
        </td>
        {columns.map((col) => {
          const tdStyle = columnWidths[col.key] ? { width: `${columnWidths[col.key]}px`, minWidth: `${Math.max(columnWidths[col.key], 60)}px` } : undefined;
          switch (col.key) {
            case 'id':
              return (
                <React.Fragment key={doc.id + '-cells'}>
                  <td key={col.key} style={tdStyle} className={viewMode === 'compact-table' ? 'p-2' : 'p-4'}>
                    <button
                      onClick={() => setPanelData(toDocumentDetail(doc))}
                      className="text-[#0461BA] hover:text-[#035299] font-medium text-left transition-colors"
                    >
                      {doc.id}
                    </button>
                  </td>
                  <td className={viewMode === 'compact-table' ? 'p-2 w-28 relative' : 'p-4 w-32 relative'}>
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
                        className={`w-7 h-7 rounded-md inline-flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors ${openActionMenuId === doc.id ? 'opacity-100 bg-neutral-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
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
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity w-7 h-7 rounded-md inline-flex items-center justify-center text-[#0461BA] hover:bg-[#E8F1FB]"
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
                        className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all w-7 h-7 rounded-md inline-flex items-center justify-center ${isInClipboard(doc.id)
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
                            {/* View Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: View API */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><EyeIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">View</span>
                                </div>
                              </button>
                            </div>

                            {/* Properties Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPanelData(toDocumentDetail(doc)); setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><InfoIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Properties</span>
                                </div>
                              </button>
                            </div>

                            {/* Subscribe Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Subscribe API */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><BellIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Subscribe</span>
                                </div>
                              </button>
                            </div>

                            {/* Add to Favourites Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: API */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
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
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Dynamic API */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Dynamic</button>
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Static API */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Static</button>
                                </div>
                              )}
                            </div>

                            {/* Rendition Submenu Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey('rendition')}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenActionSubmenuKey(openActionSubmenuKey === 'rendition' ? null : 'rendition'); }} className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${openActionSubmenuKey === 'rendition' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}>
                                <div className="text-neutral-500 mt-0.5"><FilesIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Rendition</span>
                                </div>
                                <div className="text-neutral-400 mt-0.5"><ChevronRightIcon size={14} /></div>
                              </button>
                              {openActionSubmenuKey === 'rendition' && (
                                <div className="absolute left-[calc(100%-8px)] top-0 ml-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 py-1.5 flex flex-col">
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Create API */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Create</button>
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Download API */ setOpenActionMenuId(null); setOpenActionSubmenuKey(null); }} className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">Download</button>
                                </div>
                              )}
                            </div>

                            <div className="h-px bg-neutral-100 my-1 mx-2" />

                            {/* Message Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Message API */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><MessageSquareIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Message</span>
                                </div>
                              </button>
                            </div>

                            {/* Add to Briefcase Item */}
                            <div className="relative px-1" onMouseEnter={() => setOpenActionSubmenuKey(null)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Briefcase API */ setOpenActionMenuId(null); }} className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-neutral-100">
                                <div className="text-neutral-500 mt-0.5"><BriefcaseIcon size={16} /></div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <span className="text-sm font-medium text-neutral-900">Add to Briefcase</span>
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
                <td key={col.key} style={tdStyle} className={viewMode === 'compact-table' ? 'p-2' : 'p-4'}>
                  <button
                    onClick={() => setPanelData(toDocumentDetail(doc))}
                    className="text-neutral-900 group-hover:text-[#0461BA] transition-colors font-medium text-left"
                  >
                    {doc.title}
                  </button>
                </td>
              );
            case 'revisionNumber':
              return (
                <td key={col.key} style={tdStyle} className={viewMode === 'compact-table' ? 'p-2' : 'p-4 text-neutral-500 font-medium'}>
                  {doc.revisionNumber}
                </td>
              );
            case 'status':
              return (
                <td key={col.key} style={tdStyle} className={viewMode === 'compact-table' ? 'p-2' : 'p-4'}>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${statusColors[doc.status]}`}>
                    {doc.status}
                  </span>
                </td>
              );
            case 'documentType':
              return (
                <td key={col.key} className={viewMode === 'compact-table' ? 'p-2' : 'p-4 text-neutral-600'}>
                  {doc.documentType}
                </td>
              );
            case 'author':
              return (
                <td key={col.key} className={viewMode === 'compact-table' ? 'p-2' : 'p-4 text-neutral-600'}>
                  {doc.author}
                </td>
              );
            case 'dateModified':
              return (
                <td key={col.key} className={viewMode === 'compact-table' ? 'p-2' : 'p-4 text-neutral-600'}>
                  {doc.dateModified}
                </td>
              );
            default:
              return (
                <td key={col.key} className={viewMode === 'compact-table' ? 'p-2' : 'p-4 text-neutral-500'}>
                  {getDocumentColumnText(doc, col.key) || '--'}
                </td>
              );
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
  const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns.map(c => c.key));
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
      return [...retainedKeys, ...newKeys.filter((key) => !retainedKeys.includes(key))];
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

  // Column chooser dropdown state
  const [showColumnChooser, setShowColumnChooser] = useState(false);

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
    setDisplayedCount(ITEMS_PER_PAGE);
    handleDragEnd();
  };

  const handleClearGrouping = () => {
    setGroupByColumn(null);
    setCollapsedGroups(new Set());
    setPerGroupDisplayedCounts(new Map());
    setDisplayedCount(ITEMS_PER_PAGE);
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
              isExpanded
              showCollapseToggle={false}
              mode={leftPanelMode}
              onModeChange={setLeftPanelMode}
            >

              {leftPanelMode === 'filter' ?
                <FilterPanel
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  selectedDocType={selectedDocType}
                  onDocTypeChange={setSelectedDocType}
                  selectedProject={selectedProject}
                  onProjectChange={setSelectedProject}
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories} /> :


                <FolderTree
                  folders={projectFolders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId} />

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
                        onClick={() => setSelectedFolderId(null)}
                        className={`hover:text-[#0461BA] transition-colors ${selectedFolderId === null ? 'text-[#0461BA] font-semibold' : ''}`}
                      >
                        All Documents
                      </button>
                      {breadcrumbPath.map((crumb) => (
                        <React.Fragment key={crumb.id}>
                          <ChevronRightIcon size={12} className="text-neutral-300" />
                          <button
                            onClick={() => setSelectedFolderId(crumb.id)}
                            className={`hover:text-[#0461BA] transition-colors ${selectedFolderId === crumb.id ? 'text-[#0461BA] font-semibold' : ''}`}
                          >
                            {crumb.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">{filteredDocuments.length} documents</p>
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
                      {selectedProject.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Project: <span className="font-semibold">{p}</span>
                          <button onClick={() => setSelectedProject((prev) => prev.filter((x) => x !== p))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${p} filter`}>
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
                      {(selectedStatus.length > 0 || selectedDocType.length > 0 || selectedProject.length > 0 || selectedCategories.length > 0) && (
                        <button
                          onClick={() => { setSelectedStatus([]); setSelectedDocType([]); setSelectedProject([]); setSelectedCategories([]); }}
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
                            onClick={() => setSelectedFolderId(null)}
                            aria-label="Clear folder scope"
                            className="ml-2 text-[#0461BA] hover:text-[#034E8F] p-1 rounded-full"
                          >
                            <XIcon size={12} />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedFolderId(null)}
                          className={`hover:text-[#0461BA] transition-colors ${selectedFolderId === null ? 'text-[#0461BA] font-semibold' : ''}`}
                        >
                          All Documents
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">{filteredDocuments.length} documents</p>
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
                      {selectedProject.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F1FB] text-[#0461BA] text-xs font-medium">
                          Project: <span className="font-semibold">{p}</span>
                          <button onClick={() => setSelectedProject((prev) => prev.filter((x) => x !== p))} className="ml-1 hover:text-red-500 transition-colors" aria-label={`Remove ${p} filter`}>
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
                      {(selectedStatus.length > 0 || selectedDocType.length > 0 || selectedProject.length > 0 || selectedCategories.length > 0) && (
                        <button
                          onClick={() => { setSelectedStatus([]); setSelectedDocType([]); setSelectedProject([]); setSelectedCategories([]); }}
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
                  <div className="relative">
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
                        <button
                          className="mt-3 w-full py-1.5 rounded bg-[#0461BA] text-white text-xs font-semibold hover:bg-[#234d96] focus:outline-none focus:ring-2 focus:ring-[#0461BA]"
                          onClick={() => setShowColumnChooser(false)}
                        >
                          Done
                        </button>
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
                {filteredDocuments.length === 0 && leftPanelMode !== 'folder' ?
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
                      <GridWithStickyScrollbar documents={displayedDocuments} highlightedDocId={highlightedDocId} />
                      {hasMore && !groupByColumn &&
                        <div
                          ref={loadMoreRef}
                          className="flex justify-center py-8">

                          {isLoading ?
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
                              onClick={() => setPanelData(toDocumentDetail(doc))}
                              className={`w-full text-left block border p-3 hover:shadow-sm transition-all bg-white rounded-md group ${highlightedDocId === doc.id ? 'border-[#0461BA] ring-2 ring-[#0461BA]/20 shadow-md' : 'border-neutral-200 hover:border-neutral-300'}`}>

                              <div className="flex gap-3">
                                <div className="w-24 h-16 bg-neutral-100 flex-shrink-0 rounded-md overflow-hidden border border-neutral-100">
                                  <img
                                    src={doc.thumbnail}
                                    alt={doc.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                                </div>
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
                            {isLoading ? (
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
                            <table className="w-full text-sm border-collapse whitespace-nowrap">
                              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                                <tr className="border-b border-neutral-200 bg-neutral-50">
                                  <th className={viewMode === 'compact-table' ? 'text-left p-2 w-9' : 'text-left p-4 w-10'}>
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
                                        className={`${viewMode === 'compact-table' ? 'text-left p-2' : 'text-left p-4'} relative transition-colors`}
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
                                        <th className={viewMode === 'compact-table' ? 'p-2 w-28' : 'p-4 w-32'} aria-label="Row actions" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {groupByColumn ?
                                  groupedSections.map((section) => {
                                    const isCollapsed = collapsedGroups.has(section.key);
                                    return (
                                      <React.Fragment key={section.key}>
                                        <tr className="bg-[#F8FAFC]">
                                          <td colSpan={columns.length + 2} className={viewMode === 'compact-table' ? 'px-2 py-2' : 'px-4 py-3'}>
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
                                {isLoading ? (
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

            {/* Split detail panel — third flex column, sits alongside the grid */}
            {panelData && (
              <div className="w-[360px] shrink-0 h-full">
                <DetailSlidePanel
                  data={panelData}
                  onClose={() => setPanelData(null)}
                  variant="split"
                />
              </div>
            )}

          </motion.div>
      </AnimatePresence>
    </div>);

}
