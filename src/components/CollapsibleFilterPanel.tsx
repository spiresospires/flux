import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  FilterIcon,
  FolderIcon } from
'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
interface CollapsibleFilterPanelProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  showCollapseToggle?: boolean;
  mode: 'filter' | 'folder';
  onModeChange: (mode: 'filter' | 'folder') => void;
  children: React.ReactNode;
  topSlot?: React.ReactNode;
}
export function CollapsibleFilterPanel({
  isExpanded = true,
  onToggle,
  showCollapseToggle = true,
  mode,
  onModeChange,
  children,
  topSlot
}: CollapsibleFilterPanelProps) {
  const { t } = useLocalization();
  const panelExpanded = showCollapseToggle ? isExpanded : true;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef(false);
  const [width, setWidth] = useState<number>(320);

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
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="relative h-full flex-shrink-0 flex">
      {/* Main Panel - Island Card */}
      <motion.div
        initial={false}
        animate={{
          width: panelExpanded ? width : 0
        }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }}
        ref={panelRef}
        className="h-full rounded-lg shadow-lg overflow-hidden flex flex-col relative"
        style={{
          backgroundColor: 'var(--element-bg-color, #FFFFFF)'
        }}
        aria-expanded={panelExpanded}
        aria-controls="filter-panel-content">
        
        {/* Expanded Content */}
        <AnimatePresence mode="wait">
          {panelExpanded &&
          <motion.div
            key="expanded"
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
              duration: 0.15
            }}
            id="filter-panel-content"
            className="h-full flex flex-col"
            style={{ width }}>
            
              {topSlot &&
              <div className="px-4 h-10 shrink-0 flex items-center">
                  {topSlot}
                </div>
              }
              {/* Segmented Toggle - aligned with grid column headers */}
              <div className="px-4 py-2 shrink-0">
                <div className="flex items-center bg-neutral-100 p-1 rounded-full border border-neutral-200/50">
                  <button
                    onClick={() => onModeChange('folder')}
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-colors ${mode === 'folder' ? 'bg-[#E8F1FB] text-[#0461BA] border border-[#0461BA]/20' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'}`}>
                    <FolderIcon
                      size={14}
                      strokeWidth={mode === 'folder' ? 2.5 : 2} />
                    {t('panel.folders')}
                  </button>
                  <button
                    onClick={() => onModeChange('filter')}
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-colors ${mode === 'filter' ? 'bg-[#E8F1FB] text-[#0461BA] border border-[#0461BA]/20' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'}`}>
                    <FilterIcon
                      size={14}
                      strokeWidth={mode === 'filter' ? 2.5 : 2} />
                    {t('panel.filters')}
                  </button>
                </div>
              </div>

              {/* Panel Content (FilterPanel or FolderTree) */}
              <div className="flex-1 overflow-hidden">{children}</div>
            </motion.div>
          }
        </AnimatePresence>
      </motion.div>

      {/* Resize handle */}
      {panelExpanded && (
        <div
          onMouseDown={startResize}
          role="separator"
          aria-orientation="vertical"
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-10">
          <div className="absolute inset-y-0 right-0 w-px bg-neutral-200 group-hover:bg-[#0461BA] transition-colors" />
        </div>
      )}

      {showCollapseToggle && (
        <button
          onClick={onToggle}
          className="
            relative z-10 h-8 self-start mt-3
            flex items-center justify-center
            bg-white border border-l-0 border-neutral-200 
            shadow-sm
            hover:bg-[#F0F4F8] hover:border-neutral-300
            focus:outline-none focus:ring-2 focus:ring-[#0461BA] focus:ring-offset-1
            transition-colors
            rounded-r-md
          "
          style={{
            width: '18px',
            marginLeft: '-1px'
          }}
          aria-label={panelExpanded ? t('panel.collapse') : t('panel.expand')}>
          <motion.div
            animate={{
              rotate: panelExpanded ? 0 : 180
            }}
            transition={{
              duration: 0.2
            }}>
            <ChevronLeftIcon size={14} className="text-neutral-500" />
          </motion.div>
        </button>
      )}
    </div>);

}
