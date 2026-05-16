import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DownloadIcon,
  ShareIcon,
  PrinterIcon,
  FileTextIcon } from
'lucide-react';
import { mockDocuments } from '../data/mockDocuments';
import { useLocalization } from '../contexts/LocalizationContext';
import { MetadataPanel } from '../components/MetadataPanel';
import { RelationshipsPanel } from '../components/RelationshipsPanel';
import { statusColors } from '../components/DocumentCard';
export function DocumentDetail() {
  const { t } = useLocalization();
  const { id } = useParams<{
    id: string;
  }>();
  const document = mockDocuments.find((doc) => doc.id === id);
  if (!document) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-25 font-sans">
        <div className="text-center bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
          <FileTextIcon size={48} className="mx-auto text-neutral-300 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-neutral-900">
            {t('documentDetail.notFound')}
          </h2>
          <p className="text-neutral-500 mb-6">
            {t('documentDetail.notFoundBody')}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
            
            {t('documentDetail.returnToBrowser')}
          </Link>
        </div>
      </div>);

  }
  return (
    <div className="h-screen flex flex-col bg-neutral-25 font-sans overflow-hidden">
      {/* Header */}
      <header className="border-b border-neutral-200 px-4 py-3 bg-white shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link
              to="/"
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors border border-transparent hover:border-neutral-200">
              
              <ArrowLeftIcon size={20} />
            </Link>
            <div className="h-8 w-px bg-neutral-200"></div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  {document.title}
                </h1>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColors[document.status]}`}>
                  
                  {document.status}
                </span>
              </div>
              <p className="text-sm text-neutral-500 font-medium">
                {document.id} <span className="text-neutral-300 mx-1">•</span>{' '}
                {t('documentDetail.revision', { revision: document.revisionNumber })}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-neutral-200 bg-white text-sm font-medium flex items-center gap-2 hover:bg-[#F0F4F8] hover:border-neutral-300 transition-all rounded-lg text-neutral-700 shadow-sm">
              <PrinterIcon size={16} className="text-neutral-500" />
              {t('documentDetail.print')}
            </button>
            <button className="px-4 py-2 border border-neutral-200 bg-white text-sm font-medium flex items-center gap-2 hover:bg-[#F0F4F8] hover:border-neutral-300 transition-all rounded-lg text-neutral-700 shadow-sm">
              <ShareIcon size={16} className="text-neutral-500" />
              {t('documentDetail.share')}
            </button>
            <button className="px-4 py-2 border border-primary-500 bg-primary-500 text-sm font-medium flex items-center gap-2 hover:bg-primary-600 transition-all rounded-lg text-white shadow-sm">
              <DownloadIcon size={16} />
              {t('documentDetail.download')}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white border border-neutral-200 p-2 rounded-lg shadow-sm">
              <div className="bg-neutral-100 rounded-md overflow-hidden border border-neutral-100 relative group">
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-neutral-200/50 text-xs font-semibold text-neutral-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('documentDetail.previewMode')}
                </div>
                <img
                  src={document.thumbnail}
                  alt={document.title}
                  className="w-full h-auto object-contain max-h-[70vh]" />
                
              </div>

              <div className="p-4">
                <h2 className="text-lg font-bold mb-3 text-neutral-900 border-b border-neutral-100 pb-3">
                  {t('documentDetail.abstract')}
                </h2>
                <p className="text-neutral-700 leading-relaxed text-sm">
                  {document.description}
                </p>

                <div className="mt-4 p-4 bg-[#F0F4F8] border border-neutral-200 rounded-md flex items-start gap-3">
                  <FileTextIcon
                    className="text-neutral-400 shrink-0 mt-0.5"
                    size={20} />
                  
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                      {t('documentDetail.fullAccess')}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {t('documentDetail.fullAccessBody', { fileSize: document.fileSize, fileType: document.fileType })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 shrink-0 border-l border-neutral-200 bg-neutral-25 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            <MetadataPanel document={document} />
            <RelationshipsPanel relationships={document.relationships} />
          </div>
        </div>
      </div>
    </div>);

}
