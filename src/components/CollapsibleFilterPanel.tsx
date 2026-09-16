import React, { useRef, useEffect } from 'react';
import {
  FilterIcon,
  FolderIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  XIcon } from
'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { usePanelWidth } from '../shell/usePanelWidth';
import type { PanelWidthBounds } from '../shell/panelWidth';
import { PanelResizeHandle } from './PanelResizeHandle';

const TREE_WIDTH: PanelWidthBounds = { min: 240, max: 560, fallback: 320 };

interface CollapsibleFilterPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  mode: 'filter' | 'folder';
  onModeChange: (mode: 'filter' | 'folder') => void;
  children: React.ReactNode;
  topSlot?: React.ReactNode;
  /** 'panel' (default) — the desktop/tablet inline island: fixed pixel
   *  width, drag-resizable, collapses to a 40px icon rail.
   *  'sheet' — full-width phone presentation. The caller (DocumentBrowser)
   *  mounts this component only while its own phone-only open state is
   *  true, so there is no collapsed-rail case to render here; width is
   *  always 100% rather than the persisted drag-resize pixel value, and
   *  there is no resize handle, since dragging a column width by mouse has
   *  no touch equivalent (see docs/responsive-architecture.md §7). */
  variant?: 'panel' | 'sheet';
}
export function CollapsibleFilterPanel({
  isExpanded,
  onToggle,
  mode,
  onModeChange,
  children,
  topSlot,
  variant = 'panel'
}: CollapsibleFilterPanelProps) {
  const isSheet = variant === 'sheet';
  const { t } = useLocalization();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef(false);
  // Persisted like the split detail panel's width (docBrowser.panelWidth) —
  // this component is only used in DocumentBrowser, so the key lives here.
  // The open/closed state is owned by DocumentBrowser (docBrowser.treeOpen),
  // mirroring how Chat owns chat.historyOpen for its history sidebar.
  // usePanelWidth, not useUserPref: the stored value is desk intent and a drag
  // below desktop must not overwrite it (P7).
  const [width, setWidth] = usePanelWidth('docBrowser.treeWidth', TREE_WIDTH);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current || !panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const next = Math.min(TREE_WIDTH.max, Math.max(TREE_WIDTH.min, e.clientX - rect.left));
      setWidth(next);
    };
    const onUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false;
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
    // setWidth is the useUserPref setter — useCallback(…, []), referentially
    // stable, so this effect subscribes once.
  }, [setWidth]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const railButton =
    'w-8 h-8 rounded-md flex items-center justify-center transition-colors';

  return (
    <div className={`relative h-full flex ${isSheet ? 'w-full' : 'flex-shrink-0'}`}>
      {/* Collapsed: a 40px strip of buttons, not a panel — same treatment as the
          Chat history sidebar. Tagged collapsed-rail (NOT left-panel): in flush
          view left-panel would paint it grey with a right divider, inventing a
          sidebar that is not there. See index.css for the full reasoning.
          bg-white (not --element-bg-color) is deliberate — it's the class
          content-panel uses, so rail and content stay seamless in every theme. */}
      {!isExpanded && !isSheet &&
        <div
          data-component="collapsed-rail"
          className="w-10 shrink-0 bg-white flex flex-col items-center py-3 gap-2 rounded-xl overflow-hidden shadow-md">
          <button
            onClick={onToggle}
            title={t('panel.expand')}
            aria-label={t('panel.expand')}
            aria-expanded={false}
            aria-controls="filter-panel-content"
            className={`${railButton} text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200`}>

            <PanelLeftOpenIcon size={16} />
          </button>
          {/* Quick-switch: reopen the panel straight into the wanted mode. */}
          <button
            onClick={() => { onModeChange('folder'); onToggle(); }}
            title={t('panel.folders')}
            aria-label={t('panel.folders')}
            className={`${railButton} ${mode === 'folder' ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB]'}`}>

            <FolderIcon size={16} />
          </button>
          <button
            onClick={() => { onModeChange('filter'); onToggle(); }}
            title={t('panel.filters')}
            aria-label={t('panel.filters')}
            className={`${railButton} ${mode === 'filter' ? 'bg-[#E8F1FB] text-[#0461BA]' : 'text-neutral-500 hover:text-[#0461BA] hover:bg-[#E8F1FB]'}`}>

            <FilterIcon size={16} />
          </button>
        </div>
      }

      {/* Expanded panel. Hidden rather than unmounted while collapsed: FolderTree
          owns its expanded rows and search term in local state, so unmounting
          would reset the tree on every collapse/expand round trip. */}
      <div className={`relative h-full flex ${isExpanded ? '' : 'hidden'} ${isSheet ? 'flex-1' : ''}`}>
        {/* Main Panel - Island Card */}
        <div
          ref={panelRef}
          data-component="left-panel"
          className={`h-full overflow-hidden flex flex-col relative ${isSheet ? 'w-full' : 'rounded-xl shadow-md'}`}
          style={{
            width: isSheet ? '100%' : width,
            backgroundColor: 'var(--element-bg-color, #FFFFFF)'
          }}>

          <div id="filter-panel-content" className="h-full flex flex-col">
            {topSlot &&
            <div className="px-4 h-10 shrink-0 flex items-center">
                {topSlot}
              </div>
            }
            {/* Segmented Toggle - aligned with grid column headers.
                The collapse button sits beside the pill group, not inside it —
                a header row of its own would push everything down and break
                that alignment. Kept to 28px so the row height is unchanged. */}
            <div className="px-4 py-2 shrink-0 flex items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center bg-neutral-100 p-1 rounded-full border border-neutral-200/50">
                <button
                  onClick={() => onModeChange('folder')}
                  className={`flex-1 min-w-0 py-1 px-2 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-colors ${mode === 'folder' ? 'bg-[#E8F1FB] text-[#0461BA] border border-[#0461BA]/20' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'}`}>
                  <FolderIcon
                    size={14}
                    className="shrink-0"
                    strokeWidth={mode === 'folder' ? 2.5 : 2} />
                  <span className="truncate">{t('panel.folders')}</span>
                </button>
                <button
                  onClick={() => onModeChange('filter')}
                  className={`flex-1 min-w-0 py-1 px-2 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-colors ${mode === 'filter' ? 'bg-[#E8F1FB] text-[#0461BA] border border-[#0461BA]/20' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'}`}>
                  <FilterIcon
                    size={14}
                    className="shrink-0"
                    strokeWidth={mode === 'filter' ? 2.5 : 2} />
                  <span className="truncate">{t('panel.filters')}</span>
                </button>
              </div>
              <button
                onClick={onToggle}
                title={isSheet ? t('common.close') : t('panel.collapse')}
                aria-label={isSheet ? t('common.close') : t('panel.collapse')}
                aria-expanded={true}
                aria-controls="filter-panel-content"
                className={`shrink-0 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 inline-flex items-center justify-center transition-colors ${isSheet ? 'w-11 h-11' : 'w-7 h-7'}`}>

                {isSheet ? <XIcon size={20} /> : <PanelLeftCloseIcon size={16} />}
              </button>
            </div>

            {/* Panel Content (FilterPanel or FolderTree) */}
            <div className="flex-1 overflow-hidden">{children}</div>
          </div>
        </div>

        {/* Resize handle — no touch equivalent (mouse-only drag), and no
            meaning against a full-width sheet — desktop/tablet 'panel' only. */}
        {!isSheet && <PanelResizeHandle side="right" onResizeStart={startResize} ariaLabel={t('panel.resize')} />}
      </div>
    </div>);

}
