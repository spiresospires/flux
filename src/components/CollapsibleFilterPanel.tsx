import React from 'react';
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

  return (
    <div className="relative h-full flex-shrink-0 flex">
      {/* Main Panel - Island Card */}
      <motion.div
        initial={false}
        animate={{
          width: panelExpanded ? 320 : 0
        }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="h-full rounded-lg shadow-lg overflow-hidden flex flex-col"
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
            className="h-full flex flex-col w-[320px]">
            
              {topSlot &&
              <div className="px-4 h-10 shrink-0 flex items-center">
                  {topSlot}
                </div>
              }
              {/* Segmented Toggle - aligned with grid column headers */}
              <div className="px-4 py-2 shrink-0">
                <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200/50">
                  <button
                  onClick={() => onModeChange('folder')}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'folder' ? 'bg-[#0461BA] text-white shadow-md' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'}`}>
                  
                    <FolderIcon
                    size={16}
                    strokeWidth={mode === 'folder' ? 2.5 : 2} />
                  
                    {t('panel.folders')}
                  </button>
                  <button
                  onClick={() => onModeChange('filter')}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'filter' ? 'bg-[#0461BA] text-white shadow-md' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'}`}>
                  
                    <FilterIcon
                    size={16}
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
