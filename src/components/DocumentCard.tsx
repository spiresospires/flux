import React, { useState } from 'react';
import { CalendarIcon, ClockIcon, UserIcon, HardDriveIcon, SparklesIcon, CopyIcon, CheckIcon } from 'lucide-react';
// getFileTypeIcon + its file-type icon map moved to ./fileTypeIcon so this module
// exports only components (react-refresh/only-export-components).
import { getFileTypeIcon } from './fileTypeIcon';

// ── Placeholder presentation ────────────────────────────────────────────────
// Shared with DocumentBrowser so the table, list and card views cue placeholders
// identically. A placeholder is a pre-registered record with no file in the
// content store; differentiation stays quiet — a dashed-outline icon in the
// filetype slot, the neutral dashed 'Placeholder' status chip (statusColors), and
// '--' for file-derived values.

/** Dashed page outline — "a document that isn't here yet". Same 16px footprint as
 *  getFileTypeIcon so the reference column never shifts between row kinds. */
export function PlaceholderFileIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="3 2.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

import { Document, isPlaceholder, isOverdue } from '../types/document';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useClipboard } from '../contexts/ClipboardContext';
import { statusColors } from './documentStatusColors';

interface DocumentCardProps {
  document: Document;
  isHighlighted?: boolean;
  /** Open this document's properties panel. Grid view opens the same
   *  DetailSlidePanel as the table and list views rather than navigating to a
   *  separate page — one place to read a document's properties, and the
   *  selection stays deep-linkable via ?doc= (ADR-010). */
  onOpen?: (document: Document) => void;
}

const documentTypeBadgeStyles: Record<Document['documentType'], { label: string; accent: string; bg: string; text: string }> = {
  Drawing: { label: 'DWG', accent: '#2563EB', bg: '#DBEAFE', text: '#1D4ED8' },
  Specification: { label: 'SPEC', accent: '#059669', bg: '#D1FAE5', text: '#047857' },
  'Technical Report': { label: 'RPT', accent: '#DC2626', bg: '#FEE2E2', text: '#B91C1C' },
  Manual: { label: 'MAN', accent: '#7C3AED', bg: '#EDE9FE', text: '#6D28D9' },
  Procedure: { label: 'PROC', accent: '#EA580C', bg: '#FFEDD5', text: '#C2410C' }
};

function DocumentTypeBadge({ type }: { type: Document['documentType'] }) {
  const badge = documentTypeBadgeStyles[type];

  return (
    <span
      className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md border px-1.5 text-[10px] font-bold tracking-[0.08em]"
      style={{
        backgroundColor: badge.bg,
        borderColor: badge.accent,
        color: badge.text
      }}
      aria-label={type}
      title={type}
    >
      {badge.label}
    </span>
  );
}

export function DocumentCard({ document, isHighlighted, onOpen }: DocumentCardProps) {
  const navigate = useNavigate();
  const { addToClipboard, isInClipboard } = useClipboard();
  const [clipCopied, setClipCopied] = useState(false);
  const inClip = isInClipboard(document.id);
  const placeholder = isPlaceholder(document);
  const overdue = isOverdue(document);

  const handleClipboardAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToClipboard(document);
    setClipCopied(true);
    setTimeout(() => setClipCopied(false), 2000);
  };

  return (
    // Not a <Link>: there is no document detail route. Keyboard-operable so the
    // card matches the row behaviour in the table and list views.
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(document)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(document);
        }
      }}
      aria-label={`${document.id} — ${document.title}`}
      className="block h-full group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0461BA] rounded-md"
    >
      <motion.div
        whileHover={{
          y: -4,
          scale: 1.01
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut'
        }}
        className={`h-full flex flex-col bg-white shadow-sm rounded-md overflow-hidden ${isHighlighted ? 'border-2 border-[#0461BA] ring-2 ring-[#0461BA]/20 shadow-lg' : 'border border-neutral-200 hover:shadow-md'}`}>
        
        <div className={`aspect-video overflow-hidden border-b relative ${placeholder ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-100 border-neutral-100'}`}>
          {/* No content in the store yet — an explicit empty state rather than a
              broken image box. */}
          {placeholder ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-neutral-400">
              <PlaceholderFileIcon size={28} />
              <span className="text-[11px] font-medium">Awaiting content</span>
            </div>
          ) : (
            <img
              src={document.thumbnail}
              alt={document.title}
              className="w-full h-full object-cover" />
          )}
          <div className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1.5">
            <button
              onClick={handleClipboardAdd}
              title={inClip ? `${document.id} is in clipboard` : `Add ${document.id} to clipboard`}
              aria-label={inClip ? `${document.id} is in clipboard` : `Add ${document.id} to clipboard`}
              className={`w-7 h-7 rounded-md inline-flex items-center justify-center backdrop-blur-sm border shadow-sm transition-colors ${
                inClip || clipCopied
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-white/95 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
              }`}>
              {clipCopied || inClip ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/chat?ask=${encodeURIComponent(`${document.id} — ${document.title}`)}&askKind=document`);
              }}
              title={`Ask Flint about ${document.id}`}
              aria-label={`Ask Flint about ${document.id}`}
              className="w-7 h-7 rounded-md inline-flex items-center justify-center bg-white/95 backdrop-blur-sm text-[#0461BA] border border-neutral-200 shadow-sm hover:bg-[#E8F1FB] hover:border-[#0461BA]/40">
              <SparklesIcon size={14} />
            </button>
          </div>
        </div>
        <div className="p-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-start gap-2 min-w-0">
              <DocumentTypeBadge type={document.documentType} />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 text-neutral-900 leading-tight group-hover:text-[#0461BA] transition-colors">
                  {document.title}
                </h3>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                  {document.documentType}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusColors[document.status]}`}>

              {document.status}
            </span>
          </div>
          <div className="space-y-1 text-xs text-neutral-500 mb-3 flex-1">
            <div className="flex items-center gap-1.5">
              {placeholder
                ? <PlaceholderFileIcon size={16} className="shrink-0 text-neutral-400" />
                : getFileTypeIcon(document.fileType)({ size: 16, className: "shrink-0" })}
              <span className="font-medium text-neutral-700" title={placeholder ? 'No content uploaded yet' : document.fileType}>
                {document.id}{' '}
                <span className="text-neutral-300 font-normal mx-1">•</span> Rev{' '}
                {document.revisionNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserIcon size={14} className="text-neutral-400" />
              <span>{document.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-neutral-400" />
              <span>{document.dateModified}</span>
            </div>
            {/* File size is meaningless without content — a placeholder shows the
                date its content is due instead, flagged red once it slips. */}
            {placeholder ? (
              <div className={`flex items-center gap-1.5 ${overdue ? 'text-rose-600 font-medium' : ''}`}>
                <ClockIcon size={14} className={overdue ? 'text-rose-500' : 'text-neutral-400'} />
                <span>{document.dateExpected ? `Expected ${document.dateExpected}` : 'No date expected'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <HardDriveIcon size={14} className="text-neutral-400" />
                <span>{document.fileSize}</span>
              </div>
            )}
          </div>
          <div className="mt-auto pt-2 border-t border-neutral-100 flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag) =>
            <span
              key={tag}
              className="text-[10px] font-medium bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-600">
              
                {tag}
              </span>
            )}
            {document.tags.length > 3 &&
            <span className="text-[10px] font-medium bg-[#F0F4F8] px-2 py-0.5 rounded-md text-neutral-500">
                +{document.tags.length - 3}
              </span>
            }
          </div>
        </div>
      </motion.div>
    </div>);

}
