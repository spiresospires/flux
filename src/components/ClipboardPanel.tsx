import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, FileIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { Document } from '../types/document';
import { useClipboard } from '../contexts/ClipboardContext';
import { useLocalization } from '../contexts/LocalizationContext';

interface ClipboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (docs: Document[]) => void;
}

const docStatusColors: Record<string, string> = {
  Draft: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'In Review': 'bg-warning-50 text-warning-700 border-warning-200',
  Approved: 'bg-success-50 text-success-700 border-success-200',
  Superseded: 'bg-plum-50 text-plum-700 border-plum-200',
  Archived: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export function ClipboardPanel({ isOpen, onClose, onSelect }: ClipboardPanelProps) {
  const { t } = useLocalization();
  const { clipboard, removeFromClipboard, clearClipboard } = useClipboard();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (docId: string) => {
    setSelected((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleAddToPrompt = () => {
    const selectedDocs = clipboard.filter((d) => selected.includes(d.id));
    if (selectedDocs.length > 0) {
      onSelect(selectedDocs);
      setSelected([]);
      onClose();
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === clipboard.length) {
      setSelected([]);
    } else {
      setSelected(clipboard.map((d) => d.id));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0, 0.16, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl border-t border-neutral-200 shadow-2xl max-h-[70vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Add from Clipboard</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {clipboard.length === 1 ? t('common.documentsCount', { count: clipboard.length }) : t('common.documentsCount_other', { count: clipboard.length })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
                aria-label={t('common.close')}
              >
                <XIcon size={16} />
              </button>
            </div>

            {clipboard.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                    <FileIcon size={20} className="text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">{t('clipboard.noDocuments')}</p>
                  <p className="text-xs text-neutral-500 mt-1">{t('clipboard.noDocumentsHelp')}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Content */}
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 px-6 py-4">
                  {/* Select All */}
                  <button
                    onClick={toggleSelectAll}
                    className="w-full text-left flex items-center gap-3 py-3 mb-3 rounded-lg hover:bg-[#F0F4F8] transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selected.length === clipboard.length
                          ? 'bg-[#0461BA] border-[#0461BA]'
                          : selected.length > 0
                            ? 'bg-[#0461BA]/20 border-[#0461BA]'
                            : 'border-neutral-300'
                      }`}
                    >
                      {selected.length > 0 && <CheckIcon size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-semibold text-neutral-800 flex-1">
                      {selected.length === clipboard.length ? t('clipboard.deselectAll') : t('clipboard.selectAll')}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {t('clipboard.selectionCount', { selected: selected.length, total: clipboard.length })}
                    </span>
                  </button>

                  {/* Documents */}
                  {clipboard.map((doc) => {
                    const isSelected = selected.includes(doc.id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => toggleSelect(doc.id)}
                        className="w-full text-left flex items-start gap-3 py-3 rounded-lg hover:bg-[#F0F4F8] transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-[#0461BA] border-[#0461BA]'
                              : 'border-neutral-300 hover:border-[#0461BA]'
                          }`}
                        >
                          {isSelected && <CheckIcon size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 line-clamp-1">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-neutral-500">{doc.id}</span>
                            <span className="text-xs text-neutral-400">·</span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                docStatusColors[doc.status] ??
                                'bg-neutral-100 text-neutral-600 border-neutral-200'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromClipboard(doc.id);
                            setSelected((prev) => prev.filter((id) => id !== doc.id));
                          }}
                          className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={t('clipboard.removeFromClipboard', { id: doc.id })}
                        >
                          <TrashIcon size={13} />
                        </button>
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-neutral-100 px-6 py-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      clearClipboard();
                      setSelected([]);
                    }}
                    className="text-sm text-neutral-600 font-medium hover:text-red-600 transition-colors"
                  >
                    {t('common.clearAll')}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={onClose}
                    className="text-sm px-3 py-1.5 rounded-lg text-neutral-700 border border-neutral-200 hover:bg-[#F0F4F8] transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleAddToPrompt}
                    disabled={selected.length === 0}
                    className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                      selected.length === 0
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-[#0461BA] text-white hover:bg-[#035299]'
                    }`}
                  >
                    {selected.length > 0 ? t('clipboard.addCountToPrompt', { count: selected.length }) : t('clipboard.addToPrompt')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

