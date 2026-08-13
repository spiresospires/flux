import React, { useRef, useEffect } from 'react';
import {
  FilterIcon,
  FolderIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon } from
'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useUserPref } from '../hooks/useUserPref';
import { PanelResizeHandle } from './PanelResizeHandle';
interface CollapsibleFilterPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  mode: 'filter' | 'folder';
  onModeChange: (mode: 'filter' | 'folder') => void;
  children: React.ReactNode;
  topSlot?: React.ReactNode;
}
export function CollapsibleFilterPanel({
  isExpanded,
  onToggle,
  mode,
  onModeChange,
  children,
  topSlot
}: CollapsibleFilterPanelProps) {
  const { t } = useLocalization();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef(false);
  // Persisted like the split detail panel's width (docBrowser.panelWidth) —
  // this component is only used in DocumentBrowser, so the key lives here.
  // The open/closed state is owned by DocumentBrowser (docBrowser.treeOpen),
  // mirroring how Chat owns chat.historyOpen for its history sidebar.
  const [width, setWidth] = useUserPref<number>('docBrowser.treeWidth', 320);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current || !panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const next = Math.min(560, Math.max(240, e.clientX - rect.left));
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
    <div className="relative h-full flex-shrink-0 flex">
      {/* Collapsed: a 40px strip of buttons, not a panel — same treatment as the
          Chat history sidebar. Tagged collapsed-rail (NOT left-panel): in flush
          view left-panel would paint it grey with a right divider, inventing a
          sidebar that is not there. See index.css for the full reasoning.
          bg-white (not --element-bg-color) is deliberate — it's the class
          content-panel uses, so rail and content stay seamless in every theme. */}
      {!isExpanded &&
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
      <div className={`relative h-full flex ${isExpanded ? '' : 'hidden'}`}>
        {/* Main Panel - Island Card */}
        <div
          ref={panelRef}
          data-component="left-panel"
          className="h-full rounded-xl shadow-md overflow-hidden flex flex-col relative"
          style={{
            width,
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
                title={t('panel.collapse')}
                aria-label={t('panel.collapse')}
                aria-expanded={true}
                aria-controls="filter-panel-content"
                className="w-7 h-7 shrink-0 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 inline-flex items-center justify-center transition-colors">

                <PanelLeftCloseIcon size={16} />
              </button>
            </div>

            {/* Panel Content (FilterPanel or FolderTree) */}
            <div className="flex-1 overflow-hidden">{children}</div>
          </div>
        </div>

        {/* Resize handle — sits in the browser-layout gap to the right of this island */}
        <PanelResizeHandle side="right" onResizeStart={startResize} ariaLabel={t('panel.resize')} />
      </div>
    </div>);

}
