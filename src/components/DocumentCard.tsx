import React, { useState } from 'react';
import { FileIcon, FileTextIcon, FileSpreadsheetIcon, FileBarChart2Icon, FileArchiveIcon, FileVideoIcon, FileImageIcon, FileCodeIcon, FileAudioIcon, CalendarIcon, UserIcon, HardDriveIcon, SparklesIcon, CopyIcon, CheckIcon } from 'lucide-react';
// Custom SVG for DWG (Autodesk) icon
function DwgIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-label="DWG file icon">
      <rect x="2" y="3" width="16" height="14" rx="2" fill="#F3F4F6" stroke="#2563EB" strokeWidth="1.5" />
      <text x="10" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#2563EB" fontFamily="Arial, sans-serif">DWG</text>
    </svg>
  );
}

// File type to icon mapping
const fileTypeIconMap: Record<string, (props: { size?: number; className?: string }) => JSX.Element> = {
  PDF: (props) => <FileTextIcon {...props} className={"text-red-500 " + (props.className || "")} />,
  DOC: (props) => <FileTextIcon {...props} className={"text-blue-600 " + (props.className || "")} />,
  DOCX: (props) => <FileTextIcon {...props} className={"text-blue-600 " + (props.className || "")} />,
  XLS: (props) => <FileSpreadsheetIcon {...props} className={"text-green-600 " + (props.className || "")} />,
  XLSX: (props) => <FileSpreadsheetIcon {...props} className={"text-green-600 " + (props.className || "")} />,
  PPT: (props) => <FileBarChart2Icon {...props} className={"text-orange-500 " + (props.className || "")} />,
  PPTX: (props) => <FileBarChart2Icon {...props} className={"text-orange-500 " + (props.className || "")} />,
  ZIP: (props) => <FileArchiveIcon {...props} className={"text-yellow-600 " + (props.className || "")} />,
  RAR: (props) => <FileArchiveIcon {...props} className={"text-yellow-600 " + (props.className || "")} />,
  DWG: (props) => <DwgIcon {...props} />, // Custom DWG icon
  MP4: (props) => <FileVideoIcon {...props} className={"text-purple-500 " + (props.className || "")} />,
  AVI: (props) => <FileVideoIcon {...props} className={"text-purple-500 " + (props.className || "")} />,
  MOV: (props) => <FileVideoIcon {...props} className={"text-purple-500 " + (props.className || "")} />,
  JPG: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  JPEG: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  PNG: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  GIF: (props) => <FileImageIcon {...props} className={"text-pink-500 " + (props.className || "")} />,
  TXT: (props) => <FileTextIcon {...props} className={"text-neutral-500 " + (props.className || "")} />,
  CSV: (props) => <FileSpreadsheetIcon {...props} className={"text-green-600 " + (props.className || "")} />,
  JSON: (props) => <FileCodeIcon {...props} className={"text-neutral-500 " + (props.className || "")} />,
  XML: (props) => <FileCodeIcon {...props} className={"text-neutral-500 " + (props.className || "")} />,
  MP3: (props) => <FileAudioIcon {...props} className={"text-amber-600 " + (props.className || "")} />,
  WAV: (props) => <FileAudioIcon {...props} className={"text-amber-600 " + (props.className || "")} />,
};

export function getFileTypeIcon(fileType: string) {
  const ext = fileType.trim().toUpperCase();
  return fileTypeIconMap[ext] || ((props) => <FileIcon {...props} className={"text-neutral-400 " + (props.className || "")} />);
}
import { Document } from '../types/document';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useClipboard } from '../contexts/ClipboardContext';
import { statusColors } from './documentStatusColors';

interface DocumentCardProps {
  document: Document;
  isHighlighted?: boolean;
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

export function DocumentCard({ document, isHighlighted }: DocumentCardProps) {
  const navigate = useNavigate();
  const { addToClipboard, isInClipboard } = useClipboard();
  const [clipCopied, setClipCopied] = useState(false);
  const inClip = isInClipboard(document.id);

  const handleClipboardAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToClipboard(document);
    setClipCopied(true);
    setTimeout(() => setClipCopied(false), 2000);
  };

  return (
    <Link to={`/document/${document.id}`} className="block h-full group">
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
        
        <div className="aspect-video bg-neutral-100 overflow-hidden border-b border-neutral-100 relative">
          <img
            src={document.thumbnail}
            alt={document.title}
            className="w-full h-full object-cover" />
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
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${statusColors[document.status]}`}>
              
              {document.status}
            </span>
          </div>
          <div className="space-y-1 text-xs text-neutral-500 mb-3 flex-1">
            <div className="flex items-center gap-1.5">
              {getFileTypeIcon(document.fileType)({ size: 16, className: "shrink-0" })}
              <span className="font-medium text-neutral-700" title={document.fileType}>
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
            <div className="flex items-center gap-1.5">
              <HardDriveIcon size={14} className="text-neutral-400" />
              <span>{document.fileSize}</span>
            </div>
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
    </Link>);

}
