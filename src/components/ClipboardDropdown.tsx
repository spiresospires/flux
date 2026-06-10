import React, { useEffect, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import { Document } from '../types/document';
import { useClipboard } from '../contexts/ClipboardContext';

interface ClipboardDropdownProps {
  /** Which edge of the trigger the dropdown aligns to */
  align?: 'left' | 'right';
  /** Whether the dropdown opens above or below the trigger */
  direction?: 'down' | 'up';
  /**
   * If provided, each document row becomes clickable and calls this handler.
   * Intended for the chat context where clicking adds a doc to the prompt.
   * The dropdown stays open so multiple docs can be selected in one session;
   * clicking outside or the trigger again closes it.
   */
  onDocumentClick?: (doc: Document) => void;
  /**
   * Doc IDs that are already attached / selected — highlighted in the list.
   * Used by the chat context to show which docs are already queued.
   */
  selectedDocIds?: string[];
  /** Render-prop for the trigger button. Receives toggle + open state. */
  children: (props: { toggle: () => void; isOpen: boolean }) => React.ReactNode;
}

export function ClipboardDropdown({
  align = 'right',
  direction = 'down',
  onDocumentClick,
  selectedDocIds = [],
  children,
}: ClipboardDropdownProps) {
  const { clipboard, removeFromClipboard, clearClipboard } = useClipboard();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Escape closes the dropdown for keyboard users (WCAG 2.1.2).
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggle = () => setIsOpen((prev) => !prev);

  const positionClasses = [
    direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
    align === 'right' ? 'right-0' : 'left-0',
  ].join(' ');

  return (
    <div className="relative" ref={containerRef}>
      {children({ toggle, isOpen })}

      {isOpen && (
        <div
          className={`absolute ${positionClasses} w-72 bg-white border border-neutral-200 rounded-md shadow-lg z-40`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-neutral-800">
              Clipboard ({clipboard.length})
            </p>
            <button
              onClick={() => clearClipboard()}
              className="text-[11px] font-semibold text-neutral-500 hover:text-red-600 transition-colors disabled:text-neutral-300"
              disabled={clipboard.length === 0}
              aria-label="Clear clipboard"
            >
              Clear
            </button>
          </div>

          {/* Body */}
          {clipboard.length === 0 ? (
            <div className="px-3 py-4 text-xs text-neutral-500">Clipboard is empty</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {clipboard.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`px-3 py-2 border-b border-neutral-100 last:border-b-0 flex items-center justify-between gap-2 group ${
                      onDocumentClick
                        ? isSelected
                          ? 'bg-[#E8F1FB] cursor-pointer'
                          : 'hover:bg-[#F0F4F8] cursor-pointer'
                        : 'hover:bg-neutral-50'
                    }`}
                    onClick={onDocumentClick ? () => onDocumentClick(doc) : undefined}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-[#0461BA]' : 'text-neutral-800'}`}>
                        {doc.id}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{doc.title}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromClipboard(doc.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50"
                      aria-label={`Remove ${doc.id} from clipboard`}
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
