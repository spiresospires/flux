import React from 'react';
import { FileIcon, CalendarIcon, UserIcon, HardDriveIcon, SparklesIcon } from 'lucide-react';
import { Document } from '../types/document';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
interface DocumentCardProps {
  document: Document;
  isHighlighted?: boolean;
}
export const statusColors = {
  Draft: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'In Review': 'bg-warning-50 text-warning-700 border-warning-200',
  Approved: 'bg-success-50 text-success-700 border-success-200',
  Superseded: 'bg-plum-50 text-plum-700 border-plum-200',
  Archived: 'bg-neutral-100 text-neutral-600 border-neutral-200'
};
export function DocumentCard({ document, isHighlighted }: DocumentCardProps) {
  const navigate = useNavigate();
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/chat?ask=${encodeURIComponent(`${document.id} — ${document.title}`)}&askKind=document`);
            }}
            title={`Ask Flint about ${document.id}`}
            aria-label={`Ask Flint about ${document.id}`}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute top-2 right-2 w-7 h-7 rounded-md inline-flex items-center justify-center bg-white/95 backdrop-blur-sm text-[#0461BA] border border-neutral-200 shadow-sm hover:bg-[#E8F1FB] hover:border-[#0461BA]/40">
            <SparklesIcon size={14} />
          </button>
        </div>
        <div className="p-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 text-neutral-900 leading-tight group-hover:text-[#0461BA] transition-colors">
              {document.title}
            </h3>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${statusColors[document.status]}`}>
              
              {document.status}
            </span>
          </div>
          <div className="space-y-1 text-xs text-neutral-500 mb-3 flex-1">
            <div className="flex items-center gap-1.5">
              <FileIcon size={14} className="text-neutral-400" />
              <span className="font-medium text-neutral-700">
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
            <span className="text-[10px] font-medium bg-neutral-50 px-2 py-0.5 rounded-md text-neutral-500">
                +{document.tags.length - 3}
              </span>
            }
          </div>
        </div>
      </motion.div>
    </Link>);

}